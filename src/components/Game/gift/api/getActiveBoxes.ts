import { useReadContract, useWatchContractEvent } from 'wagmi'

import { GiftContractAddress } from './constants'

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

  useWatchContractEvent({
    address: GiftContractAddress,
    abi,
    eventName: 'BoxAdded',
    onLogs(logs) {
      console.log('New logs!', logs)
      refetch()
    },
  })

  return data
}
