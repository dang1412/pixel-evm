import { useEffect, useMemo } from 'react'
import { Address, formatUnits } from 'viem'
import { useReadContract } from 'wagmi'

import { globalEventBus } from '@/lib/EventEmitter'

import { GiftContractAddress } from './constants'
import { BoxClaimedEventArgs } from './watchBoxClaimed'

const abi = [
  // balanceOf
  {
    type: 'function',
    name: 'balanceOf',
    stateMutability: 'view',
    inputs: [
      {
        name: 'account',
        type: 'address',
      },
    ],
    outputs: [
      {
        type: 'uint256',
      },
    ],
  },
  {
    type: 'function',
    name: 'decimals',
    stateMutability: 'view',
    inputs: [],
    outputs: [
      {
        type: 'uint8',
      },
    ],
  },
] as const

export function useBalance(account: Address) {
  const { data, refetch } = useReadContract({
    address: GiftContractAddress,
    abi,
    functionName: 'balanceOf',
    args: [account], // replace with actual user address
  })

  useRefetchWhenBoxClaimed(account, refetch)

  console.log('Balance data:', account, data)

  return useMemo(() => formatUnits(data || 0n, 18), [data])
}

export function useRefetchWhenBoxClaimed(addr: Address, refetch: () => void) {
  useEffect(() => {
    const handleBoxClaimed = ({ user, position, token }: BoxClaimedEventArgs) => {
      if (user.toLowerCase() === addr.toLowerCase()) {
        console.log('Balance affected by box claimed event:', user, position, token)
        refetch()
      }
    }

    globalEventBus.on('boxClaimed', handleBoxClaimed)

    return () => {
      globalEventBus.off('boxClaimed', handleBoxClaimed)
    }
  }, [addr, refetch])
}
