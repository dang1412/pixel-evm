import { useMemo } from 'react'
import { useReadContract } from 'wagmi'

import { GiftContractAddress } from './constants'
import { useRefetchWhenBoxClaimed } from './useBalance'

const abi = [
  {
    type: "function",
    name: "lastBoxTaken",
    inputs: [{ "name": "", "type": "address", "internalType": "address" }],
    outputs: [{ "name": "", "type": "uint256", "internalType": "uint256" }],
    stateMutability: "view"
  },
] as const

const CoolDownSec = 300

export function useCoolDownTime(addr: `0x${string}` = `0x`) {
  const { data, refetch } = useReadContract({
    address: GiftContractAddress,
    abi,
    functionName: 'lastBoxTaken',
    args: [addr],
  })

  // update when box claimed
  useRefetchWhenBoxClaimed(addr, refetch)

  const waitSec = useMemo(() => Number(data || 0) + CoolDownSec - Math.floor(Date.now() / 1000), [data])

  return waitSec
}
