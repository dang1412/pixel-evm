import { useReadContract } from 'wagmi'
import { useCallback, useMemo } from 'react'

import { globalState } from '@/components/globalState'

import { GiftContractAddress } from './constants'
import { useRefetchWhenBoxClaimed, useRefetchWhenClaimError } from './useRefetchWhenBoxClaimed'

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

  const boxes = useMemo(() => data ? [...data] : [], [data])

  globalState.boxes = boxes

  return boxes
}
