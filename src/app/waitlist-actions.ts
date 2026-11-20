"use server";

import { createHmac } from "node:crypto";
import { isIP } from "node:net";
import { headers } from "next/headers";
import { lt, sql } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { waitlistRateLimits, waitlistSignups } from "@/lib/db/schema";
import { waitlistEmailSchema, type WaitlistState } from "@/lib/waitlist";

const unavailable: WaitlistState = {
  status: "error",
  message: "Signups are temporarily unavailable. Please try again later.",
};

export async function joinWaitlist(
  _previous: WaitlistState,
  formData: FormData,
): Promise<WaitlistState> {
  const parsed = waitlistEmailSchema.safeParse(formData.get("email"));
  if (!parsed.success) {
    return {
      status: "error",
      field: "email",
      message: "Enter a valid email address, like you@example.com.",
    };
  }

  if (formData.get("company")) {
    return { status: "error", message: "We couldn’t submit this form. Please try again." };
  }

  const secret = process.env.WAITLIST_RATE_LIMIT_SECRET;
  if (!process.env.DATABASE_URL || !secret || secret.length < 32) {
    return unavailable;
  }

  let address: string;
  if (process.env.VERCEL === "1") {
    const forwarded = (await headers()).get("x-vercel-forwarded-for")?.trim();
    if (!forwarded || !isIP(forwarded)) return unavailable;
    address = forwarded;
  } else if (process.env.NODE_ENV === "development") {
    address = "local-development";
  } else {
    return unavailable;
  }

  const key = createHmac("sha256", secret).update(address).digest("hex");

  try {
    const db = getDb();
    await db.delete(waitlistRateLimits).where(lt(waitlistRateLimits.expiresAt, sql`now()`));

    const [allowed] = await db
      .insert(waitlistRateLimits)
      .values({ key, expiresAt: sql`now() + interval '1 hour'` })
      .onConflictDoUpdate({
        target: waitlistRateLimits.key,
        set: { attempts: sql`${waitlistRateLimits.attempts} + 1` },
        setWhere: lt(waitlistRateLimits.attempts, 5),
      })
      .returning({ key: waitlistRateLimits.key });

    if (!allowed) {
      return {
        status: "error",
        message: "Too many attempts. Please try again in an hour.",
      };
    }

    await db.insert(waitlistSignups).values({ email: parsed.data }).onConflictDoNothing();
    return {
      status: "success",
      message: "You’re on the list. We’ll email you when ZeroSleep is ready.",
    };
  } catch {
    console.error("Waitlist signup could not be saved.");
    return unavailable;
  }
}
