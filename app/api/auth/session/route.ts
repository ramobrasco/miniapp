import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const SESSION_COOKIE = "advice_session";

export async function GET() {
  const cookieStore = await cookies();
  const session = cookieStore.get(SESSION_COOKIE)?.value;
  if (!session) return NextResponse.json({ address: null });
  try {
    const { address } = JSON.parse(session);
    return NextResponse.json({ address });
  } catch {
    return NextResponse.json({ address: null });
  }
}
