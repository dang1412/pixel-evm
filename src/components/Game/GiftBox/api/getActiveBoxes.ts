import { useReadContract, useWatchContractEvent } from 'wagmi'
import { useCallback } from 'react'

import { GiftContractAddress } from './constants'
import { Log } from 'viem'
import { useRefetchWhenBoxClaimed } from './useBalance'

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

  // useRefetchWhenBoxClaimed(undefined, refetch)

  const onLogs = useCallback((logs: Log[]) => {
    console.log('BoxAdded new logs!', logs)
    refetch()
  }, [refetch])

  // useWatchContractEvent({
  //   address: GiftContractAddress,
  //   abi,
  //   eventName: 'BoxAdded',
  //   onLogs,
  // })

  return data
}
