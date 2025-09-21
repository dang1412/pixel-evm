import { useEffect } from 'react'
import { Address } from 'viem'

import { globalEventBus } from '@/lib/EventEmitter'
import { BoxClaimedEventArgs } from '@/lib/ws'

export function useRefetchWhenBoxClaimed(addr: Address | undefined, refetch: () => void) {
  useEffect(() => {
    const handleBoxClaimed = ({ user, position, token }: BoxClaimedEventArgs) => {
      // call when not login or the login address claimed
      if (!addr || user.toLowerCase() === addr.toLowerCase()) {
        console.log('Balance affected by box claimed event:', user, position, token)
        setTimeout(refetch, 1000) // refetch after 1 second
      }
    }

    globalEventBus.on('boxClaimed', handleBoxClaimed)

    return () => {
      globalEventBus.off('boxClaimed', handleBoxClaimed)
    }
  }, [addr, refetch])
}

export function useRefetchWhenClaimError(refetch: () => void) {
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
}
