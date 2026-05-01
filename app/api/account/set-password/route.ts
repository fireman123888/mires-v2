import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers as nextHeaders } from "next/headers";

export const maxDuration = 30;

/**
 * Sets a password on an account that doesn't have one yet (typical for
 * users who originally signed up via magic link). Backed by
 * better-auth's `setPassword` server API.
 */
export async function POST(req: NextRequest) {
  const headers = await nextHeaders();
  const session = await auth.api.getSession({ headers });
  if (!session?.user) {
    return NextResponse.json({ error: "login_required" }, { status: 401 });
  }

  let body: { newPassword?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const newPassword = body.newPassword;
  if (
    !newPassword ||
    typeof newPassword !== "string" ||
    newPassword.length < 8
  ) {
    return NextResponse.json({ error: "password_too_short" }, { status: 400 });
  }

  try {
    await auth.api.setPassword({
      body: { newPassword },
      headers,
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "set_password_failed" },
      { status: 400 }
    );
  }
}
