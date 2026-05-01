import { auth } from "@/lib/auth";
import { headers as nextHeaders } from "next/headers";

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const list = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  return list.includes(email.toLowerCase());
}

export async function requireAdminSession() {
  const session = await auth.api.getSession({ headers: await nextHeaders() });
  if (!session?.user || !isAdminEmail(session.user.email)) return null;
  return session;
}
