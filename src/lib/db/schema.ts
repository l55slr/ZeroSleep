import {
  bigserial,
  boolean,
  date,
  index,
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const linkTypeEnum = pgEnum("link_type", [
  "github",
  "npm",
  "leetcode",
  "x",
  "linkedin",
  "youtube",
  "website",
  "project",
  "custom",
]);

export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  clerkUserId: text("clerk_user_id").notNull().unique(),
  handle: text("handle").notNull().unique(),
  displayName: text("display_name").notNull(),
  bio: text("bio"),
  avatarUrl: text("avatar_url"),
  theme: text("theme").notNull().default("dark"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const links = pgTable(
  "links",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    profileId: uuid("profile_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    type: linkTypeEnum("type").notNull().default("custom"),
    label: text("label").notNull(),
    url: text("url").notNull(),
    position: integer("position").notNull().default(0),
    visible: boolean("visible").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("links_profile_position_idx").on(t.profileId, t.position)],
);

export const clickEvents = pgTable(
  "click_events",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    linkId: uuid("link_id")
      .notNull()
      .references(() => links.id, { onDelete: "cascade" }),
    clickedAt: timestamp("clicked_at", { withTimezone: true }).notNull().defaultNow(),
    referrer: text("referrer"),
    country: text("country"),
    device: text("device"),
  },
  (t) => [index("click_events_link_time_idx").on(t.linkId, t.clickedAt)],
);

export const dailyStats = pgTable(
  "daily_stats",
  {
    day: date("day").notNull(),
    linkId: uuid("link_id")
      .notNull()
      .references(() => links.id, { onDelete: "cascade" }),
    clicks: integer("clicks").notNull().default(0),
  },
  (t) => [primaryKey({ columns: [t.day, t.linkId] })],
);

export const reservedHandles = pgTable("reserved_handles", {
  handle: text("handle").primaryKey(),
});

// Server-only tables: no public API policies. The server connects as the table owner.
export const waitlistSignups = pgTable("waitlist_signups", {
  email: text("email").primaryKey(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}).enableRLS();

export const waitlistRateLimits = pgTable(
  "waitlist_rate_limits",
  {
    key: text("key").primaryKey(),
    attempts: integer("attempts").notNull().default(1),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  },
  (t) => [index("waitlist_rate_limits_expiry_idx").on(t.expiresAt)],
).enableRLS();
