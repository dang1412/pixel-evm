import { useCallback } from 'react'
import { parseEventLogs } from 'viem'

import { simulateContract } from '@wagmi/core'
import { useAccount, usePublicClient, useWriteContract } from 'wagmi'

import { globalEventBus } from '@/lib/EventEmitter'
import { GiftContractAddress } from './constants'
import { enableRoundRobinHttp } from '@/providers/roundRobinHttp'

const abi = [
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
const boxClaimedEventAbi = [
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

export function useClaimBox() {

  const { writeContractAsync } = useWriteContract()
  const { address: account } = useAccount()
  const client = usePublicClient()

  const claimBox = useCallback(async (pos: number, deadline: number, sig: `0x${string}`) => {
    if (!client) throw new Error('No client')
    if (!account) throw new Error('No account')

    const params = {
      address: GiftContractAddress,
      abi,
      functionName: 'claimBox',
      args: [pos, BigInt(deadline), sig],
      account,
    } as const

    try {

      const { request } = await client.simulateContract(params)
      enableRoundRobinHttp(false)
      const hash = await writeContractAsync(request)
      console.log('Transaction hash claimBox:', hash)

      const receipt = await client.waitForTransactionReceipt({ hash })

      const logs = parseEventLogs({
        abi: boxClaimedEventAbi,
        eventName: 'BoxClaimed',
        logs: receipt.logs,
      })

      console.log('Parsed BoxClaimed logs:', logs[0].args)

      globalEventBus.emit('boxClaimed', logs[0].args)

      return hash
    } catch (error) {
      console.log('Claim box error:', error)
    } finally {
      enableRoundRobinHttp(true)
    }
  }, [writeContractAsync, client, account])

  return claimBox
}
