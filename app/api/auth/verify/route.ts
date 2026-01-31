import { NextRequest, NextResponse } from "next/server";
import { SiweMessage } from "siwe";
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
      try {
        const parsed = new SiweMessage(message);
        console.error("[SIWE] Invalid signature – message domain:", parsed.domain, "uri:", parsed.uri);
      } catch {
        console.error("[SIWE] Invalid signature – message could not be parsed");
      }
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }
    const isProduction = process.env.NODE_ENV === "production";
    try {
      const cookieStore = await cookies();
      cookieStore.set(SESSION_COOKIE, JSON.stringify({ address }), {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? "none" : "lax",
        maxAge: SESSION_MAX_AGE,
        path: "/",
      });
    } catch (cookieError) {
      console.error("Session cookie could not be set:", cookieError);
      // Verification succeeded; return success so client doesn't show "Verification failed"
      return NextResponse.json({ address });
    }
    return NextResponse.json({ address });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Verification failed" }, { status: 500 });
  }
}
