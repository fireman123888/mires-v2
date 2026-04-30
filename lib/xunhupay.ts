import { createHash } from "crypto";

const API_ENDPOINT = "https://api.xunhupay.com/payment/do.html";

/**
 * Compute the XunHuPay hash:
 *   1. Sort non-empty params by ASCII key order
 *   2. Build "k1=v1&k2=v2…" string (exclude `hash` itself)
 *   3. Append APPSECRET directly (no separator)
 *   4. md5() lowercase hex
 */
export function signXunHuPay(
  params: Record<string, string | number | undefined>,
  appsecret: string
): string {
  const filtered = Object.entries(params)
    .filter(([k, v]) => k !== "hash" && v !== undefined && v !== null && v !== "")
    .sort(([a], [b]) => a.localeCompare(b));
  const stringA = filtered.map(([k, v]) => `${k}=${v}`).join("&");
  return createHash("md5").update(stringA + appsecret).digest("hex");
}

/**
 * Verify a notify payload's hash against APPSECRET.
 */
export function verifyXunHuPay(
  payload: Record<string, string>,
  appsecret: string
): boolean {
  const received = payload.hash;
  if (!received) return false;
  const expected = signXunHuPay(payload, appsecret);
  // Constant-time-ish compare
  if (expected.length !== received.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ received.charCodeAt(i);
  return diff === 0;
}

interface CreatePaymentArgs {
  appid: string;
  appsecret: string;
  tradeOrderId: string;
  totalFeeCny: number; // in yuan, e.g. 10 for ¥10
  title: string; // 42 Chinese chars max
  notifyUrl: string;
  returnUrl?: string;
  attach?: string;
}

interface CreatePaymentResult {
  ok: boolean;
  url?: string; // mobile-optimized payment URL
  qrUrl?: string; // PC QR code URL (5 min validity)
  errcode?: number;
  errmsg?: string;
  raw?: unknown;
}

/**
 * Create a payment intent and get back a checkout URL the user can be sent to.
 */
export async function createXunHuPayment(args: CreatePaymentArgs): Promise<CreatePaymentResult> {
  const params: Record<string, string | number> = {
    version: "1.1",
    appid: args.appid,
    trade_order_id: args.tradeOrderId,
    total_fee: args.totalFeeCny.toFixed(2),
    title: args.title,
    time: Math.floor(Date.now() / 1000),
    notify_url: args.notifyUrl,
    nonce_str: Math.random().toString(36).slice(2, 14),
    ...(args.returnUrl ? { return_url: args.returnUrl } : {}),
    ...(args.attach ? { attach: args.attach } : {}),
  };
  const hash = signXunHuPay(params, args.appsecret);
  const body = new URLSearchParams({ ...Object.fromEntries(Object.entries(params).map(([k, v]) => [k, String(v)])), hash });

  try {
    const resp = await fetch(API_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
      signal: AbortSignal.timeout(15_000),
    });
    const text = await resp.text();
    let data: { errcode?: number; errmsg?: string; url?: string; url_qrcode?: string };
    try {
      data = JSON.parse(text);
    } catch {
      return { ok: false, errmsg: `Non-JSON response: ${text.slice(0, 200)}` };
    }
    if (data.errcode !== 0) {
      return { ok: false, errcode: data.errcode, errmsg: data.errmsg, raw: data };
    }
    return { ok: true, url: data.url, qrUrl: data.url_qrcode, raw: data };
  } catch (e) {
    return { ok: false, errmsg: e instanceof Error ? e.message : "Unknown" };
  }
}
