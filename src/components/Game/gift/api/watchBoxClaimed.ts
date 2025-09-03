import { useWatchContractEvent } from 'wagmi'

import { GiftContractAddress } from './constants'

const abi = [
  {
    type: "event",
    name: "BoxClaimed",
    inputs: [
      {
        name: "user",
        type: "address",
        indexed: false,
        internalType: "address"
      },
      {
        name: "position",
        type: "uint16",
        indexed: false,
        internalType: "uint16"
      },
      {
        name: "token",
        type: "uint16",
        indexed: false,
        internalType: "uint16"
      }
    ],
    anonymous: false
  },
] as const

export function watchBoxClaimed(onClaimed: (user: `0x${string}`, position: number, token: number) => void) {
  useWatchContractEvent({
    address: GiftContractAddress,
    abi,
    eventName: 'BoxClaimed',
    onLogs(logs) {
      console.log('New logs!', logs)
      for (const log of logs) {
        const { user, position, token } = log.args
        onClaimed(user || `0x`, position || -1, token || 0)
      }
    },
  })
}
