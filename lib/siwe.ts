import { SiweMessage } from "siwe";

export function createSiweMessage(
  address: string,
  nonce: string,
  chainId: number = 84532,
  origin?: string
) {
  // Use canonical app origin in production so SIWE works when opened inside Base app / iframes
  const uri =
    process.env.NEXT_PUBLIC_APP_ORIGIN ||
    origin ||
    (typeof globalThis !== "undefined" && "location" in globalThis
      ? (globalThis as { location?: { origin?: string } }).location?.origin
      : undefined) ||
    "http://localhost:3000";
  const domain = typeof uri === "string" && uri.startsWith("http") ? new URL(uri).hostname : "localhost";
  return new SiweMessage({
    domain,
    address,
    statement: "Sign in to Should I?",
    uri,
    version: "1",
    chainId,
    nonce,
  });
}

export async function verifySiweMessage(message: string, signature: string) {
  try {
    const siweMessage = new SiweMessage(message);
    const result = await siweMessage.verify({ signature, nonce: siweMessage.nonce });
    return result.success ? siweMessage.address : null;
  } catch {
    return null;
  }
}
