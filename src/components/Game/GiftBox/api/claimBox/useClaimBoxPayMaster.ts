import { useCallback, useEffect, useMemo } from 'react'
import { useCallsStatus } from 'wagmi'
import { useWriteContracts } from 'wagmi/experimental'

import { GiftContractAddress } from '../constants'
import { AccountCapabilities, claimBoxAbi } from './types'
import { getBoxClaimedEventLog } from './utils'

export function useClaimBoxPayMaster(capabilities: AccountCapabilities) {
  const { writeContractsAsync, data, error } = useWriteContracts();

  const claimBoxPayMaster = useCallback(async (pos: number, deadline: number, sig: `0x${string}`) => {
    await writeContractsAsync({
      contracts: [
        {
          address: GiftContractAddress,
          abi: claimBoxAbi,
          functionName: 'claimBox',
          args: [pos, BigInt(deadline), sig],
        }
      ],
      capabilities
    })
  }, [capabilities])

  // After call, get status and receipts (with logs)
  const { data: statusData } = useCallsStatus({
    id: data?.id ? data.id : '',
    query: { enabled: !!data?.id}
  })

  useEffect(() => {
    console.log('claimBoxPayMaster receipts', statusData)
  }, [statusData?.receipts])

  const result = useMemo(() => getBoxClaimedEventLog(statusData?.receipts?.[0] as any), [statusData?.receipts])

  return { claimBoxPayMaster, result, error }
}