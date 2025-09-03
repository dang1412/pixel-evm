import { useReadContract } from 'wagmi'

import { GiftContractAddress } from './constants'
import { Address, formatUnits } from 'viem'
import { watchBoxClaimed } from './watchBoxClaimed'
import { useMemo } from 'react'

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
  console.log('useBalance for account:', account)
  const { data, refetch } = useReadContract({
    address: GiftContractAddress,
    abi,
    functionName: 'balanceOf',
    args: [account], // replace with actual user address
  })

  watchBoxClaimed((user, position, token) => {
    if (user.toLowerCase() === account.toLowerCase()) {
      console.log('Balance affected by box claimed event:', user, position, token)
      refetch()
    }
  })

  console.log('Balance data:', data)

  return useMemo(() => formatUnits(data || 0n, 18), [data])
}
