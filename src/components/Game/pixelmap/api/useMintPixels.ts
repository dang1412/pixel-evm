import { useCallback } from 'react'
import { ContractFunctionExecutionError, parseAbi } from 'viem'
import { usePublicClient, useWriteContract } from 'wagmi'

import { PixelNFTAddress } from './constant'

const abi = parseAbi([
  // 'function balanceOf(address account) view returns (uint256)',
  // 'function decimals() view returns (uint8)',
  'function mintArea(uint8 x, uint8 y, uint8 w, uint8 h) external payable',
])

// event ABI for parsing logs
// const boxClaimedEventAbi = [
//   {
//     type: "event",
//     name: "BoxClaimed",
//     inputs: [
//       { name: "user", type: "address", indexed: false, internalType: "address" },
//       { name: "position", type: "uint16", indexed: false, internalType: "uint16" },
//       { name: "token", type: "uint16", indexed: false, internalType: "uint16" }
//     ],
//     anonymous: false
//   },
// ] as const

const price = 0.05 // 0.05 ETH per pixel

export function useMintPixels() {
  const { writeContractAsync } = useWriteContract()

  const mintPixels = useCallback(async (x: number, y: number, w: number, h: number) => {
    const hash = await writeContractAsync({
      address: PixelNFTAddress,
      abi,
      functionName: 'mintArea',
      args: [x, y, w, h],
      value: BigInt(price * 1e18 * w * h), // 0.01 ETH per pixel
    }).catch((error) => {
      if (error instanceof ContractFunctionExecutionError) {
        console.error('ContractFunctionExecutionError:', error.cause)
        // throw error.cause
      } else {
        console.error('Error in writeContractAsync:', error)
        // throw error
      }
    })

    console.log('Mint transaction hash:', hash)
    return hash
  }, [])

  return { mintPixels }
}
