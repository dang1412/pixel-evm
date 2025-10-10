import { useMemo } from 'react'
import { Address } from 'viem'
import { useReadContract } from 'wagmi'

import { PixelArea } from '../../types'
import { PixelNFTAddress } from './constant'
import { toPixelAreas } from './getMintedPixels'

const abi = [
  {
    type: "function",
    name: "getUserPixels",
    inputs: [
      {
      name: "user",
      type: "address",
      internalType: "address"
      }
    ],
    outputs: [
      {
        name: "",
        type: "uint16[]",
        internalType: "uint16[]"
      },
      {
        name: "",
        type: "tuple[]",
        internalType: "struct PixelNFT.TokenSizes[]",
        components: [
          {
            name: "w",
            type: "uint8",
            internalType: "uint8"
          },
          {
            name: "h",
            type: "uint8",
            internalType: "uint8"
          }
        ]
      }
    ],
    stateMutability: "view"
  },
] as const

export function getUserPixels(user?: Address): PixelArea[] {
  const { data } = useReadContract({
    address: PixelNFTAddress, // replace with actual contract address
    abi,
    functionName: 'getUserPixels',
    args: [user || '0x'],
    query: { enabled: !!user }, // only run if user is defined
  })

  const areas = useMemo(() => data ? toPixelAreas([...data[0]], [...data[1]]) : [], [data])

  return areas
}
