import { useCallback, useMemo } from 'react'
import { Address, ContractFunctionExecutionError, parseAbi } from 'viem'
import { usePublicClient, useReadContract } from 'wagmi'

import { PixelNFTAddress } from './constant'
import { positionToXY } from '../../utils'
import { PixelArea } from '../../types'

// struct TokenSizes {
//         uint8 w;
//         uint8 h;
//     }

// const abi = parseAbi([
//   'function getPixels() view returns (uint16[] memory, tuple(uint8 w, uint8 h)[] memory)'
// ])

const abi = [
  {
    type: "function",
    name: "getPixels",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "uint16[]",
        internalType: "uint16[]"
      },
      {
        name: "",
        type: "address[]",
        internalType: "address[]"
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

// console.log('abi:', abi)

export function getMintedPixels(): { owners: Address[], areas: PixelArea[] } {
  const { data } = useReadContract({
    address: PixelNFTAddress, // replace with actual contract address
    abi,
    functionName: 'getPixels',
  })

  const areas = useMemo(() => data ? toPixelAreas([...data[0]], [...data[2]]) : [], [data])
  const owners = useMemo(() => data ? [...data[1]] : [], [data])

  return { areas, owners }
}

export function toPixelAreas(positions: number[], sizes: { w: number; h: number }[]): PixelArea[] {
  const areas = positions.map((pos, index) => {
    const { x, y } = positionToXY(pos)
    const size = sizes[index] || { w: 1, h: 1 }
    return { x, y, w: size.w, h: size.h }
  })
  return areas
}