import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createHmac } from "node:crypto";
import { isIP } from "node:net";
import { test } from "node:test";
import vm from "node:vm";
import ts from "typescript";
import { lt, sql } from "drizzle-orm";
import { getTableConfig } from "drizzle-orm/pg-core";
import { waitlistEmailSchema } from "./waitlist.ts";
import { waitlistRateLimits, waitlistSignups } from "./db/schema.ts";

const source = await readFile(new URL("../app/waitlist-actions.ts", import.meta.url), "utf8");
const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext } }).outputText;
const initial = { status: "idle", message: "" };

async function actionHarness({ configured = true, allowed = true, fail = false, vercel = false, ip = "203.0.113.5", production = false } = {}) {
  const writes = [];
  const logs = [];
  const context = vm.createContext({
    process: { env: {
      NODE_ENV: production ? "production" : "development",
      ...(configured ? { DATABASE_URL: "dummy-local-test-value", WAITLIST_RATE_LIMIT_SECRET: "test-only-secret-with-at-least-32-characters" } : {}),
      ...(vercel ? { VERCEL: "1" } : {}),
    } },
    console: { error: (...args) => logs.push(args) },
  });
  const db = {
    delete: () => ({ where: async () => { if (fail) throw new Error("private database details"); } }),
    insert: (table) => ({ values: (value) => {
      writes.push({ table, value });
      return {
        onConflictDoUpdate: () => ({ returning: async () => allowed ? [{ key: "allowed" }] : [] }),
        onConflictDoNothing: async () => {},
      };
    } }),
  };
  const imports = {
    "node:crypto": { createHmac },
    "node:net": { isIP },
    "next/headers": { headers: async () => new Headers(ip ? { "x-vercel-forwarded-for": ip } : {}) },
    "drizzle-orm": { lt, sql },
    "@/lib/db": { getDb: () => db },
    "@/lib/db/schema": { waitlistRateLimits, waitlistSignups },
    "@/lib/waitlist": { waitlistEmailSchema },
  };
  const testModule = new vm.SourceTextModule(code, { context });
  await testModule.link((name) => {
    const values = imports[name];
    assert.ok(values, `Unexpected import: ${name}`);
    return new vm.SyntheticModule(Object.keys(values), function () {
      for (const [key, value] of Object.entries(values)) this.setExport(key, value);
    }, { context });
  });
  await testModule.evaluate();
  const submit = (email = "person@example.com", company = "") => {
    const data = new FormData();
    if (email !== null) data.set("email", email);
    data.set("company", company);
    return testModule.namespace.joinWaitlist(initial, data);
  };
  return { submit, writes, logs };
}

test("normalizes email without removing plus aliases", () => {
  assert.equal(waitlistEmailSchema.parse(" Person+Launch@Example.COM "), "person+launch@example.com");
});

test("rejects empty, malformed, oversized and non-string email input", () => {
  for (const value of [null, "", "  ", "no-email", "a@localhost", "<script>@example.com", "x".repeat(255) + "@example.com", "a\r\nb@example.com", new File(["test"], "email.txt")]) {
    assert.equal(waitlistEmailSchema.safeParse(value).success, false);
  }
});

test("invalid email never reaches storage", async () => {
  const h = await actionHarness();
  const result = await h.submit("bad");
  assert.equal(result.field, "email");
  assert.equal(h.writes.length, 0);
});

test("honeypot submission does not write or report success", async () => {
  const h = await actionHarness();
  assert.equal((await h.submit("person@example.com", "bot")).status, "error");
  assert.equal(h.writes.length, 0);
});

test("missing configuration fails honestly", async () => {
  const h = await actionHarness({ configured: false });
  assert.equal((await h.submit()).status, "error");
  assert.equal(h.writes.length, 0);
});

test("saves normalized email after a successful rate-limit check", async () => {
  const h = await actionHarness({ vercel: true });
  assert.equal((await h.submit(" Person@Example.COM ")).status, "success");
  assert.equal(h.writes[1].table, waitlistSignups);
  assert.equal(h.writes[1].value.email, "person@example.com");
  assert.match(h.writes[0].value.key, /^[a-f0-9]{64}$/);
  assert.notEqual(h.writes[0].value.key, "203.0.113.5");
});

test("duplicate path uses an idempotent insert with the same response", async () => {
  const h = await actionHarness();
  assert.equal((await h.submit()).status, "success");
  assert.equal((await h.submit()).status, "success");
});

test("rate-limited requests never insert an email", async () => {
  const h = await actionHarness({ allowed: false });
  assert.match((await h.submit()).message, /Too many attempts/);
  assert.equal(h.writes.some(w => w.table === waitlistSignups), false);
});

test("database errors never disclose database details", async () => {
  const h = await actionHarness({ fail: true });
  const result = await h.submit();
  assert.equal(result.status, "error");
  assert.equal(JSON.stringify([result, h.logs]).includes("private database details"), false);
});

test("Vercel rejects missing or invalid trusted IP headers", async () => {
  for (const ip of ["", "invalid", "203.0.113.1, 203.0.113.2"]) {
    const h = await actionHarness({ vercel: true, ip });
    assert.equal((await h.submit()).status, "error");
    assert.equal(h.writes.length, 0);
  }
});

test("non-Vercel production cannot bypass the trusted-IP requirement", async () => {
  const h = await actionHarness({ production: true });
  assert.equal((await h.submit()).status, "error");
  assert.equal(h.writes.length, 0);
});

test("waitlist tables deny public API access through RLS with no public policies", async () => {
  const snapshot = JSON.parse(await readFile(new URL("../../drizzle/meta/0001_snapshot.json", import.meta.url), "utf8"));
  const migration = await readFile(new URL("../../drizzle/0001_add_waitlist.sql", import.meta.url), "utf8");
  for (const table of [waitlistSignups, waitlistRateLimits]) {
    const config = getTableConfig(table);
    assert.equal(config.enableRLS, true);
    assert.equal(config.policies.length, 0);
    assert.equal(snapshot.tables[`public.${config.name}`].isRLSEnabled, true);
    assert.ok(migration.includes(`ALTER TABLE "${config.name}" ENABLE ROW LEVEL SECURITY;`));
  }
});

test("production requests reuse the database connection pool", async () => {
  const dbSource = await readFile(new URL("./db/index.ts", import.meta.url), "utf8");
  const dbCode = ts.transpileModule(dbSource, { compilerOptions: { module: ts.ModuleKind.ESNext } }).outputText;
  const context = vm.createContext({ process: { env: { NODE_ENV: "production", DATABASE_URL: "dummy-local-test-value" } } });
  let pools = 0;
  const client = {};
  const imports = {
    "drizzle-orm/postgres-js": { drizzle: (value) => value },
    postgres: { default: () => { pools++; return client; } },
    "./schema": { waitlistSignups, waitlistRateLimits },
  };
  const testModule = new vm.SourceTextModule(dbCode, { context });
  await testModule.link((name) => {
    const values = imports[name];
    assert.ok(values, `Unexpected import: ${name}`);
    return new vm.SyntheticModule(Object.keys(values), function () {
      for (const [key, value] of Object.entries(values)) this.setExport(key, value);
    }, { context });
  });
  await testModule.evaluate();
  assert.equal(testModule.namespace.getDb(), client);
  assert.equal(testModule.namespace.getDb(), client);
  assert.equal(pools, 1);
});
