import { useWriteContract } from 'wagmi'

import { GiftContractAddress } from './constants'

const abi = [
  {
    type: 'function',
    name: 'claimBox',
    inputs: [
      { name: 'position', type: 'uint16', internalType: 'uint16' },
      { name: 'deadline', type: 'uint256', internalType: 'uint256' },
      { name: 'signature', type: 'bytes', internalType: 'bytes' }
    ],
    outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'nonpayable'
  },
  { type: "error", name: "ClaimExpired", inputs: [] },
  { type: "error", name: "InvalidClaimSignature", inputs: [] },
  { type: "error", name: "ECDSAInvalidSignature", inputs: [] },
  {
    type: "error",
    name: "ECDSAInvalidSignatureLength",
    inputs: [
      { name: "length", type: "uint256", "internalType": "uint256" }
    ]
  },
  {
    type: "error",
    name: "ECDSAInvalidSignatureS",
    inputs: [{ name: "s", type: "bytes32", "internalType": "bytes32" }]
  },
] as const

export function useClaimBox() {

  const { data, error, writeContractAsync } = useWriteContract()

  const claimBox = async (pos: number, deadline: number, sig: `0x${string}`) => {
    // console.log('Transaction sent:', rs)
    const hash = await writeContractAsync({
      address: GiftContractAddress,
      abi,
      functionName: 'claimBox',
      args: [pos, BigInt(deadline), sig],
    })
  }

  return claimBox
}
