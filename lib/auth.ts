import { cookies } from "next/headers";

const SESSION_COOKIE = "advice_session";

export async function getSessionAddress(): Promise<string | null> {
  const cookieStore = await cookies();
  const session = cookieStore.get(SESSION_COOKIE)?.value;
  if (!session) return null;
  try {
    const { address } = JSON.parse(session);
    return address ?? null;
  } catch {
    return null;
  }
}
