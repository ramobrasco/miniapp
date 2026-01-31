import { SiweMessage } from "siwe";

const PRODUCTION_ORIGIN = "https://miniapp-dun-one.vercel.app";
const PRODUCTION_HOST = "miniapp-dun-one.vercel.app";

export function createSiweMessage(
  address: string,
  nonce: string,
  chainId: number = 84532,
  _origin?: string
) {
  // Always use canonical app origin so SIWE works when opened inside Base app / iframes.
  // Never rely on window.location.origin in embedded context.
  let uri: string;
  if (typeof globalThis !== "undefined" && "location" in globalThis) {
    const loc = (globalThis as { location?: { hostname?: string } }).location;
    const hostname = loc?.hostname ?? "";
    if (hostname === PRODUCTION_HOST) {
      uri = PRODUCTION_ORIGIN;
    } else if (hostname === "localhost" || hostname === "127.0.0.1") {
      uri = "http://localhost:3000";
    } else {
      // In-app / embedded browser (e.g. Base app): hostname may differ; always use our domain so SIWE verifies.
      uri = PRODUCTION_ORIGIN;
    }
  } else {
    uri =
      process.env.NEXT_PUBLIC_APP_ORIGIN ?? _origin ?? "http://localhost:3000";
  }
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
  } catch (err) {
    console.error("[SIWE] Verification failed:", err);
    return null;
  }
}
