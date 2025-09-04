import { useCallback } from 'react'
import { useWatchContractEvent } from 'wagmi'
import { Log } from 'viem'

// import type {
//   ExtractAbiEvent,
//   // ExtractAbiEventNames,
//   // GetEventArgs,
//   Log,
// } from 'viem'

// // Get the event type from your ABI
// type BoxClaimedEvent = ExtractAbiEvent<
//   typeof giftAbi,
//   'BoxClaimed'
// >

// Now make a log type
type BoxClaimedLog = Log<bigint, number, false, any, undefined>

import { globalEventBus } from '@/lib/EventEmitter'
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

export interface BoxClaimedEventArgs {
  user: `0x${string}`
  position: number
  token: number
}

export function watchBoxClaimed() {

  const onLogs = useCallback((logs: Log[]) => {
    console.log('BoxClaimed new logs!', logs)
    for (const log of logs) {
      const { user, position, token } = (log as any).args as BoxClaimedEventArgs || {}
      globalEventBus.emit('boxClaimed', { user, position, token })
    }
  }, [])

  useWatchContractEvent({
    address: GiftContractAddress,
    abi,
    eventName: 'BoxClaimed',
    onLogs,
  })
}
