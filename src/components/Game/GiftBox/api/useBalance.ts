import { useCallback, useMemo } from 'react'
import { Address, formatUnits } from 'viem'
import { useReadContract } from 'wagmi'

import { PixelTokenAddress } from './constants'
import { useRefetchWhenBoxClaimed, useRefetchWhenClaimError } from './useRefetchWhenBoxClaimed'

const abi = [
  // balanceOf
  {
    type: 'function',
    name: 'balanceOf',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address',}],
    outputs: [{ type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'decimals',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint8' }],
  },
] as const

export function useTokenBalance(account: Address) {
  const { data, refetch } = useReadContract({
    address: PixelTokenAddress,
    abi,
    functionName: 'balanceOf',
    args: [account], // replace with actual user address
  })

  const fetchBalance = useCallback(() => {
    console.log('fetchBalance------', account)
    refetch()
  }, [refetch])

  useRefetchWhenBoxClaimed(account, fetchBalance)
  useRefetchWhenClaimError(fetchBalance)

  console.log('Balance data:', account, data)

  return useMemo(() => formatUnits(data || 0n, 18), [data])
}
