import { useClient, useConfig, usePublicClient, useReadContract } from 'wagmi'
import { multicall, readContract } from '@wagmi/core'
import { Address, formatUnits } from 'viem'
import { GiftContractAddress, PixelTokenAddress } from './constants'
import { useCallback, useEffect, useState } from 'react'
import { useRefetchWhenBoxClaimed, useRefetchWhenClaimError } from './useRefetchWhenBoxClaimed'
import { globalState } from '@/components/globalState'

const giftAbi = [
  {
    name: 'getActiveBoxPositions',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint16[]', name: '' }]
  },
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

const erc20Abi = [
  {
    type: 'function',
    name: 'balanceOf',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address',}],
    outputs: [{ type: 'uint256' }],
  },
] as const

interface MultiInfo {
  boxes?: number[]
  coolDownTime?: number
  tokenBalance?: string
}

export function useMultiInfo(user?: Address) {
  const client = usePublicClient()

  const [info, setInfo] = useState<MultiInfo>({})

  const fetch = useCallback(async () => {
    if (!client) return

    const data: MultiInfo = {}

    console.log('Fetch useMultiCallInfo-----------', user)

    if (!user) {
      const boxes = await client.readContract({
        address: GiftContractAddress,
        abi: giftAbi,
        functionName: 'getActiveBoxPositions',
        args: [],
      })

      data.boxes = [...boxes]
    } else {
      const [boxes, coolDownTime] = await client.multicall({
        contracts: [
          {
            address: GiftContractAddress,
            abi: giftAbi,
            functionName: 'getActiveBoxPositions',
          },
          {
            address: GiftContractAddress,
            abi: giftAbi,
            functionName: 'calculateCooldownFinshed',
            args: [user],
          },
          // {
          //   address: PixelTokenAddress,
          //   abi: erc20Abi,
          //   functionName: 'balanceOf',
          //   args: [user], // replace with actual user address
          // }
        ],
        allowFailure: true
      })

      if (boxes.result) {
        data.boxes = [...boxes.result]
      }
      if (coolDownTime.result) {
        data.coolDownTime = Number(coolDownTime.result)
        globalState.giftBoxCooldownTime = data.coolDownTime
      }
      // if (tokenBalance.result) {
      //   data.tokenBalance = formatUnits(tokenBalance.result || 0n, 18)
      // }

      console.log('Fetch rs', data)
    }

    setInfo(data)
  }, [client, user])

  useEffect(() => {
    fetch()
  }, [fetch])

  // refetch when claim success or error
  useRefetchWhenBoxClaimed(user, fetch)
  useRefetchWhenClaimError(fetch)

  return { ...info, refetch: fetch }

  // if (!addr) {
  //   const { data: boxes, refetch } = await readContract(config, {
  //     address: GiftContractAddress,
  //     abi: giftAbi,
  //     functionName: 'getActiveBoxPositions',
  //     args: [],
  //   })

  //   return { boxes }
  // }
}
