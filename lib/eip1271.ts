import { Contract, JsonRpcProvider, hashMessage } from "ethers";

const EIP1271_MAGIC = "0x1626ba7e";

const EIP1271_ABI = [
  "function isValidSignature(bytes32 _hash, bytes _signature) external view returns (bytes4)",
] as const;

const RPC_URLS: Record<number, string> = {
  8453: process.env.BASE_MAINNET_RPC_URL ?? "https://mainnet.base.org",
  84532: process.env.BASE_SEPOLIA_RPC_URL ?? "https://sepolia.base.org",
};

/**
 * Verify a SIWE message using EIP-1271 (smart contract / passkey wallet).
 * Use when standard ECDSA verification fails (e.g. Base app passkey).
 */
export async function verifySiweWithEIP1271(
  message: string,
  signature: string,
  signerAddress: string,
  chainId: number
): Promise<string | null> {
  const rpcUrl = RPC_URLS[chainId];
  if (!rpcUrl) {
    console.error("[EIP1271] No RPC for chainId:", chainId);
    return null;
  }

  try {
    const provider = new JsonRpcProvider(rpcUrl);
    const code = await provider.getCode(signerAddress);
    if (!code || code === "0x") {
      return null;
    }

    const hash = hashMessage(message);
    const contract = new Contract(signerAddress, EIP1271_ABI, provider);
    const result = await contract.isValidSignature(hash, signature);
    const returned = typeof result === "string" ? result : result?.toString?.() ?? "";
    const magic = EIP1271_MAGIC.toLowerCase().replace("0x", "");

    if (returned.toLowerCase().includes(magic)) {
      return signerAddress;
    }
    return null;
  } catch (err) {
    console.error("[EIP1271] Verification failed:", err);
    return null;
  }
}
