import { createSign, createVerify } from "crypto";

/**
 * 易支付 (epay_pro / cccyun) integration. RSA-SHA256 signing.
 *
 * Spec: D:\DownLoads\epay_pro_release_41344\app\view\doc\sign_note.html
 * (also at https://pay.cccyun.cc/admin/doc/sign_note.html)
 */

function canonicalize(
  params: Record<string, string | number | undefined | null>
): string {
  return Object.entries(params)
    .filter(
      ([k, v]) =>
        k !== "sign" &&
        k !== "sign_type" &&
        v !== undefined &&
        v !== null &&
        String(v) !== ""
    )
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([k, v]) => `${k}=${v}`)
    .join("&");
}

function normalizePem(envValue: string, kind: "PRIVATE" | "PUBLIC"): string {
  const v = envValue.trim().replace(/\\n/g, "\n");
  if (v.includes("BEGIN")) return v;
  // Bare base64 — wrap with PEM headers (PKCS#8 for private, X.509 SPKI for public)
  const header = kind === "PRIVATE" ? "PRIVATE KEY" : "PUBLIC KEY";
  const wrapped = v.replace(/\s+/g, "").match(/.{1,64}/g)?.join("\n") ?? v;
  return `-----BEGIN ${header}-----\n${wrapped}\n-----END ${header}-----`;
}

export function signYipay(
  params: Record<string, string | number | undefined | null>,
  privateKeyPemRaw: string
): string {
  const privateKey = normalizePem(privateKeyPemRaw, "PRIVATE");
  const stringA = canonicalize(params);
  const signer = createSign("RSA-SHA256");
  signer.update(stringA, "utf8");
  signer.end();
  return signer.sign(privateKey, "base64");
}

export function verifyYipay(
  params: Record<string, string>,
  publicKeyPemRaw: string
): boolean {
  const sign = params.sign;
  if (!sign) return false;
  const publicKey = normalizePem(publicKeyPemRaw, "PUBLIC");
  const stringA = canonicalize(params);
  const verifier = createVerify("RSA-SHA256");
  verifier.update(stringA, "utf8");
  verifier.end();
  try {
    return verifier.verify(publicKey, sign, "base64");
  } catch {
    return false;
  }
}

interface BuildSubmitArgs {
  gateway: string; // e.g. "https://pay.cccyun.cc"
  pid: string | number;
  privateKeyPem: string;
  outTradeNo: string;
  notifyUrl: string;
  returnUrl: string;
  name: string; // ≤127 bytes; will be truncated by platform if over
  money: number; // yuan
  type?: "alipay" | "wxpay" | string; // omit → cashier page
  param?: string;
}

/**
 * Build a signed redirect URL for 页面跳转支付 (`/api/pay/submit`).
 * No HTTP call needed — frontend just sets window.location.href to this.
 */
export function buildYipaySubmitUrl(args: BuildSubmitArgs): string {
  const params: Record<string, string | number> = {
    pid: args.pid,
    out_trade_no: args.outTradeNo,
    notify_url: args.notifyUrl,
    return_url: args.returnUrl,
    name: args.name,
    money: args.money.toFixed(2),
    timestamp: Math.floor(Date.now() / 1000).toString(),
  };
  if (args.type) params.type = args.type;
  if (args.param) params.param = args.param;

  const sign = signYipay(params, args.privateKeyPem);

  const search = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) search.append(k, String(v));
  search.append("sign", sign);
  search.append("sign_type", "RSA");

  return `${args.gateway.replace(/\/$/, "")}/api/pay/submit?${search.toString()}`;
}
