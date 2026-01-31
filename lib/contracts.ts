export const ADVICE_VOTING_ABI = [
  {
    type: "function",
    name: "vote",
    inputs: [
      { name: "questionId", type: "uint256", internalType: "uint256" },
      { name: "choice", type: "uint8", internalType: "enum AdviceVoting.Choice" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "getResults",
    inputs: [{ name: "questionId", type: "uint256", internalType: "uint256" }],
    outputs: [
      { name: "yesCount", type: "uint256", internalType: "uint256" },
      { name: "noCount", type: "uint256", internalType: "uint256" },
      { name: "waitCount", type: "uint256", internalType: "uint256" },
      { name: "dependsCount", type: "uint256", internalType: "uint256" },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "hasVoted",
    inputs: [
      { name: "questionId", type: "uint256", internalType: "uint256" },
      { name: "voter", type: "address", internalType: "address" },
    ],
    outputs: [{ name: "", type: "bool", internalType: "bool" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getChoice",
    inputs: [
      { name: "questionId", type: "uint256", internalType: "uint256" },
      { name: "voter", type: "address", internalType: "address" },
    ],
    outputs: [{ name: "", type: "uint8", internalType: "enum AdviceVoting.Choice" }],
    stateMutability: "view",
  },
  {
    type: "event",
    name: "VoteCast",
    inputs: [
      { name: "questionId", type: "uint256", indexed: true, internalType: "uint256" },
      { name: "voter", type: "address", indexed: true, internalType: "address" },
      { name: "choice", type: "uint8", indexed: false, internalType: "enum AdviceVoting.Choice" },
    ],
  },
] as const;

export const CHOICE = { Yes: 0, No: 1, Wait: 2, Depends: 3 } as const;
export const CHOICE_LABEL: Record<number, string> = {
  0: "Yes",
  1: "No",
  2: "Wait",
  3: "Depends",
};

export function getContractAddress(chainId: number): `0x${string}` | null {
  const addr =
    chainId === 84532
      ? process.env.NEXT_PUBLIC_VOTING_CONTRACT_BASE_SEPOLIA
      : chainId === 8453
        ? process.env.NEXT_PUBLIC_VOTING_CONTRACT_BASE
        : null;
  return addr ? (addr as `0x${string}`) : null;
}
