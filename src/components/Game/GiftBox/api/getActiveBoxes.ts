import { useReadContract } from 'wagmi'
import { useCallback, useEffect } from 'react'

import { GiftContractAddress } from './constants'
import { globalEventBus } from '@/lib/EventEmitter'
import { useRefetchWhenBoxClaimed, useRefetchWhenClaimError } from './useRefetchWhenBoxClaimed'
import { Address } from 'viem'
import { globalState } from '@/components/globalState'

const abi = [
  {
    name: 'getActiveBoxPositions',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint16[]', name: '' }]
  },
  {
    type: "event",
    name: "BoxAdded",
    inputs: [
      {
        name: "position",
        type: "uint16",
        indexed: false,
        internalType: "uint16"
      }
    ],
    anonymous: false
  },
] as const

// deprecated, use useMultiInfo

export function useActiveBoxes() {

  const { data, refetch } = useReadContract({
    address: GiftContractAddress,
    abi,
    functionName: 'getActiveBoxPositions',
  })

  // refetch when claim box error
  useRefetchWhenClaimError(refetch)

  // refetch when anyone claimed and current number <= 10
  const refetchWhenClaimed = useCallback(() => {
    if (globalState.boxes && globalState.boxes.length <= 10) {
      refetch()
    }
  }, [refetch])
  useRefetchWhenBoxClaimed(undefined, refetchWhenClaimed)
  // useEffect(() => {
  //   const refetchWhenBoxClaimError = (msg: string) => {
  //     console.log('refetchWhenBoxClaimError', msg)
  //     refetch()
  //   }

  //   globalEventBus.on('boxClaimError', refetchWhenBoxClaimError)

  //   return () => {
  //     globalEventBus.off('boxClaimError', refetchWhenBoxClaimError)
  //   }
  // }, [refetch])

  if (data) globalState.boxes = [...data]

  return data
}
