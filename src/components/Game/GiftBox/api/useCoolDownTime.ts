import { useEffect, useMemo } from 'react'
import { useReadContract } from 'wagmi'

import { globalState } from '@/components/globalState'
import { GiftContractAddress } from './constants'
import { useRefetchWhenBoxClaimed } from './useRefetchWhenBoxClaimed'

const abi = [
  {
    type: "function",
    name: "calculateCooldownFinshed",
    inputs: [
      { name: "user", type: "address", internalType: "address" }
    ],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view"
  },
] as const

export function useCoolDownTime(addr: `0x${string}` = `0x`) {
  const { data, refetch } = useReadContract({
    address: GiftContractAddress,
    abi,
    functionName: 'calculateCooldownFinshed',
    args: [addr],
  })

  // update when box claimed
  useRefetchWhenBoxClaimed(addr, refetch)

  // get coolDownTime with useMemo
  const coolDownTime = useMemo(() => Number(data || 0), [data])
  // set to global state
  globalState.giftBoxCooldownTime = coolDownTime

  return coolDownTime
}
