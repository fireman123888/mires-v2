import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers as nextHeaders } from "next/headers";
import { getCredits } from "@/lib/credits";

export async function GET() {
  const session = await auth.api.getSession({ headers: await nextHeaders() });
  if (!session?.user) {
    return NextResponse.json({ credits: null });
  }
  const credits = await getCredits(session.user.id);
  return NextResponse.json({ credits });
}
