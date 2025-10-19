import { useCallback, useEffect, useMemo } from 'react'
import { useWaitForTransactionReceipt, useWriteContract } from 'wagmi'

import { GiftContractAddress } from '../constants'
import { claimBoxAbi } from './types'
import { getBoxClaimedEventLog } from './utils'

export function useClaimBoxEOA() {
  const { writeContractAsync, data, error } = useWriteContract()

  const claimBoxEOA = useCallback(async (pos: number, deadline: number, sig: `0x${string}`) => {
    await writeContractAsync({
      address: GiftContractAddress,
      abi: claimBoxAbi,
      functionName: 'claimBox',
      args: [pos, BigInt(deadline), sig],
    })
  }, [writeContractAsync])

  // After call, get status and receipts (with logs)
  const { data: receipt } = useWaitForTransactionReceipt({
    hash: data,
    query: { enabled: !!data }
  })

  useEffect(() => {
    console.log('claimBoxEOA receipts', receipt)
  }, [receipt])

  const result = useMemo(() => getBoxClaimedEventLog(receipt), [receipt])

  return { claimBoxEOA, result, error }
}