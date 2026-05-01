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
  // Daily +20 refresh: tracks the last UTC date we credited the daily bonus.
  lastDailyRefresh: text("last_daily_refresh"), // ISO YYYY-MM-DD or null
  // Subscription plan: null = Free; "pro" / "ultimate" = paid tier.
  // Active iff proPlanExpiresAt > now(). Set/extended on admin grant approval.
  proPlanType: text("pro_plan_type"),
  proPlanExpiresAt: timestamp("pro_plan_expires_at"),
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

// Track payment orders for credit pack purchases.
export const paymentOrder = pgTable(
  "payment_order",
  {
    id: text("id").primaryKey(), // our out_trade_no (UUID-ish, ≤32 chars)
    userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
    packId: text("pack_id").notNull(), // 'small' | 'medium' | 'large'
    creditAmount: integer("credit_amount").notNull(), // credits to grant on success
    priceCents: integer("price_cents").notNull(), // store as cents to avoid float
    currency: text("currency").notNull().default("CNY"),
    status: text("status").notNull().default("pending"), // pending | paid | failed | refunded
    provider: text("provider").notNull().default("yipay"),
    providerTxnId: text("provider_txn_id"), // upstream wechat/alipay txn id
    providerOrderId: text("provider_order_id"), // platform internal trade_no
    createdAt: timestamp("created_at").notNull().defaultNow(),
    paidAt: timestamp("paid_at"),
    rawNotify: text("raw_notify"), // JSON of last notify payload for debugging
  },
  (t) => ({
    userIdx: index("payment_order_user_idx").on(t.userId, t.createdAt),
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
