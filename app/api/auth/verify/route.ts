import { NextRequest, NextResponse } from "next/server";
import { verifySiweMessage } from "@/lib/siwe";
import { cookies } from "next/headers";

const SESSION_COOKIE = "advice_session";
const SESSION_MAX_AGE = 60 * 60 * 24; // 24h

export async function POST(req: NextRequest) {
  try {
    const { message, signature } = await req.json();
    if (!message || !signature) {
      return NextResponse.json({ error: "Missing message or signature" }, { status: 400 });
    }
    const address = await verifySiweMessage(message, signature);
    if (!address) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }
    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE, JSON.stringify({ address }), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: SESSION_MAX_AGE,
      path: "/",
    });
    return NextResponse.json({ address });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Verification failed" }, { status: 500 });
  }
}
