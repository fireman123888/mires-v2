import { pgTable, text, timestamp, integer, boolean, primaryKey, index } from "drizzle-orm/pg-core";

// better-auth tables (canonical names per https://better-auth.com/docs/concepts/database)
export const user = pgTable("user", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  name: text("name"),
  image: text("image"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  // Credit balance — extended via better-auth additionalFields
  credits: integer("credits").notNull().default(200),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Custom tables for Mires
export const creditTransaction = pgTable(
  "credit_transaction",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
    delta: integer("delta").notNull(), // negative = spend, positive = grant/refund
    balanceAfter: integer("balance_after").notNull(),
    reason: text("reason").notNull(), // 'signup_bonus' | 'generate' | 'upscale' | 'refund' | ...
    metadata: text("metadata"), // JSON string with extra context (prompt, provider, etc.)
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => ({
    userIdx: index("credit_tx_user_idx").on(t.userId, t.createdAt),
  })
);

// Track anonymous IP usage for the daily free quota.
export const ipDailyUsage = pgTable(
  "ip_daily_usage",
  {
    ip: text("ip").notNull(),
    day: text("day").notNull(), // ISO date YYYY-MM-DD in UTC
    count: integer("count").notNull().default(0),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.ip, t.day] }),
  })
);
