export const claimBoxAbi = [
  // claimBox
  {
    type: 'function',
    name: 'claimBox',
    inputs: [
      { name: 'position', type: 'uint16', internalType: 'uint16' },
      { name: 'deadline', type: 'uint256', internalType: 'uint256' },
      { name: 'signature', type: 'bytes', internalType: 'bytes' }
    ],
    outputs: [],
    stateMutability: 'nonpayable'
  },
  // errors
  { type: "error", name: "ClaimExpired", inputs: [] },
  { type: "error", name: "InvalidClaimSignature", inputs: [] },
  { type: "error", name: "ECDSAInvalidSignature", inputs: [] },
  {
    type: "error",
    name: "ECDSAInvalidSignatureLength",
    inputs: [{ name: "length", type: "uint256", internalType: "uint256" }]
  },
  {
    type: "error",
    name: "ECDSAInvalidSignatureS",
    inputs: [{ name: "s", type: "bytes32", internalType: "bytes32" }]
  },
] as const

// event ABI for parsing logs
export const boxClaimedEventAbi = [
  {
    type: "event",
    name: "BoxClaimed",
    inputs: [
      { name: "user", type: "address", indexed: false, internalType: "address" },
      { name: "position", type: "uint16", indexed: false, internalType: "uint16" },
      { name: "token", type: "uint16", indexed: false, internalType: "uint16" }
    ],
    anonymous: false
  },
] as const

export interface AccountCapabilities {
  paymasterService?: {
    url: string
  }
}
