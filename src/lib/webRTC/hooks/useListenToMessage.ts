import { useCallback } from 'react'
import { useAccount, usePublicClient } from 'wagmi'
import { watchContractEvent } from 'viem/actions'
import { type PublicClient } from 'viem';

import { ListenMessageAbi } from './ListenMessageAbi'

export interface EventMessagePayload {
  from: string;
  to: string;
  cid: string
}

export const MSG_CONTRACT_ADDR = '0x38b66BD216844760CD468F51D661226bb4333EB1'

export default function useListenToMessage() {
  const { address: myAddr } = useAccount()
  const client = usePublicClient() as PublicClient

  const listenToMessage = useCallback(async (onMsg: (e: EventMessagePayload) => void) => {
    const unsub = watchContractEvent(client, {
      address: MSG_CONTRACT_ADDR,
      abi: ListenMessageAbi,
      eventName: 'OfferConnect',
      args: {
        to: myAddr
      },
      async onLogs(logs) {
        console.log('New logs abcd!', logs)
        for (const log of logs) {
          console.log('Offer', (log as any).args)
          // got the offer
          const { from, to, cid } = (log as any).args as EventMessagePayload
          onMsg({ from, to, cid })
        }
      },
    })

    return unsub
  }, [client, myAddr])

  return listenToMessage
}
