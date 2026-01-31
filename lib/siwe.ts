import { SiweMessage } from "siwe";

export function createSiweMessage(
  address: string,
  nonce: string,
  chainId: number = 84532,
  origin?: string
) {
  const uri = origin ?? process.env.NEXT_PUBLIC_APP_ORIGIN ?? "http://localhost:3000";
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
  const siweMessage = new SiweMessage(message);
  const result = await siweMessage.verify({ signature, nonce: siweMessage.nonce });
  return result.success ? siweMessage.address : null;
}
