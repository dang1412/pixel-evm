import { useReadContract } from 'wagmi'
import { useEffect } from 'react'

import { GiftContractAddress } from './constants'
import { globalEventBus } from '@/lib/EventEmitter'

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

export function useActiveBoxes() {

  const { data, refetch } = useReadContract({
    address: GiftContractAddress,
    abi,
    functionName: 'getActiveBoxPositions',
    args: [],
  })

  // refetch when claim box error
  useEffect(() => {
    const refetchWhenBoxClaimError = (msg: string) => {
      console.log('refetchWhenBoxClaimError', msg)
      refetch()
    }

    globalEventBus.on('boxClaimError', refetchWhenBoxClaimError)

    return () => {
      globalEventBus.off('boxClaimError', refetchWhenBoxClaimError)
    }
  }, [refetch])

  return data
}
