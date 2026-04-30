import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Lazy-init: Upstash creds may be absent at build time. Construct on first use
// and gracefully no-op if env is missing (keeps local dev working without Redis).
let _redis: Redis | null = null;
function getRedis(): Redis | null {
  if (_redis) return _redis;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  _redis = new Redis({ url, token });
  return _redis;
}

// Each "Generate" click on the home page fires 4 parallel requests (one per
// provider panel). Limits below are sized so a single click never trips them,
// with headroom for ~3 clicks/minute before throttling.

// ----- Layer 1: per-IP rate limit (sliding window) -----
let _ipLimit: Ratelimit | null = null;
export function getIpRateLimit(): Ratelimit | null {
  if (_ipLimit) return _ipLimit;
  const redis = getRedis();
  if (!redis) return null;
  _ipLimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(20, "60 s"),
    analytics: true,
    prefix: "rl:ip",
  });
  return _ipLimit;
}

// ----- Layer 1: per-user rate limit (sliding window) -----
let _userLimit: Ratelimit | null = null;
export function getUserRateLimit(): Ratelimit | null {
  if (_userLimit) return _userLimit;
  const redis = getRedis();
  if (!redis) return null;
  _userLimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(40, "60 s"),
    analytics: true,
    prefix: "rl:user",
  });
  return _userLimit;
}

// ----- Layer 1: cheap-endpoint rate limit (TTS, optimize-prompt) -----
let _cheapLimit: Ratelimit | null = null;
export function getCheapRateLimit(): Ratelimit | null {
  if (_cheapLimit) return _cheapLimit;
  const redis = getRedis();
  if (!redis) return null;
  _cheapLimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(15, "60 s"),
    analytics: true,
    prefix: "rl:cheap",
  });
  return _cheapLimit;
}

// ----- Layer 2: concurrency (in-flight cap) via INCR/DECR -----

const CONCURRENCY_TTL_SEC = 600; // safety net in case DECR is missed

interface AcquireResult {
  acquired: boolean;
  current?: number;
  limit?: number;
}

/**
 * Atomically increment an in-flight counter and check against the cap. The TTL
 * is a safety net so a crashed request doesn't leak the slot forever.
 */
export async function acquireSlot(scope: string, limit: number): Promise<AcquireResult> {
  const redis = getRedis();
  if (!redis) return { acquired: true }; // no Redis configured → don't block
  const key = `cc:${scope}`;
  const count = await redis.incr(key);
  await redis.expire(key, CONCURRENCY_TTL_SEC);
  if (count > limit) {
    await redis.decr(key);
    return { acquired: false, current: count - 1, limit };
  }
  return { acquired: true, current: count, limit };
}

export async function releaseSlot(scope: string): Promise<void> {
  const redis = getRedis();
  if (!redis) return;
  const key = `cc:${scope}`;
  // Don't go negative if something weird happened.
  const current = await redis.decr(key);
  if (current < 0) await redis.set(key, 0);
}

// ----- Layer 2 + 3 wrapper -----

// Sized so a single "Generate" click (4 parallel panel requests) plus an
// upscale or two never blocks itself.
export const CONCURRENCY = {
  perIp: 6,    // anonymous: 4 panel + 2 buffer
  perUser: 8,  // logged-in: 4 panel + upscale + 3 buffer
  global: 40,  // protects Pollinations: ~10 concurrent users at full 4-panel
} as const;

interface ConcurrencyAcquired {
  scopes: string[];
}

/**
 * Acquire all relevant concurrency slots (global + per-user-or-ip). Returns a
 * release fn or a non-acquired marker. Always call release in a finally block.
 */
export async function acquireConcurrency(opts: {
  userId?: string | null;
  ip: string;
}): Promise<{ ok: true; release: () => Promise<void> } | { ok: false; reason: string }> {
  const acquired: string[] = [];
  const release = async () => {
    await Promise.all(acquired.map((s) => releaseSlot(s)));
  };

  // Global cap first (fastest reject path)
  const g = await acquireSlot("global", CONCURRENCY.global);
  if (!g.acquired) return { ok: false, reason: "global_busy" };
  acquired.push("global");

  // Then per-identity cap
  const idScope = opts.userId ? `user:${opts.userId}` : `ip:${opts.ip}`;
  const idLimit = opts.userId ? CONCURRENCY.perUser : CONCURRENCY.perIp;
  const u = await acquireSlot(idScope, idLimit);
  if (!u.acquired) {
    await release();
    return { ok: false, reason: opts.userId ? "user_busy" : "ip_busy" };
  }
  acquired.push(idScope);

  return { ok: true, release };
}

// ----- helpers -----

/**
 * Build a Retry-After header value from a `reset` timestamp (ms epoch).
 */
export function retryAfterSeconds(resetMs: number): number {
  const secs = Math.ceil((resetMs - Date.now()) / 1000);
  return Math.max(secs, 1);
}
