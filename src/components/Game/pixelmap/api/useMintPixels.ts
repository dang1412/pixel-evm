import { useCallback } from 'react'
import { ContractFunctionExecutionError, parseAbi } from 'viem'
import { useWriteContract } from 'wagmi'

import { PixelNFTAddress } from './constant'
import { useNotification } from '@/providers/NotificationProvider'

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

  const { notify, setLoading, loading } = useNotification()

  const mintPixels = useCallback(async (x: number, y: number, w: number, h: number) => { 
    if (loading) throw new Error('Another transaction is processing')
    setLoading(true)
    const hash = await writeContractAsync({
      address: PixelNFTAddress,
      abi,
      functionName: 'mintArea',
      args: [x, y, w, h],
      value: BigInt(price * 1e18 * w * h), // 0.01 ETH per pixel
    }).catch((error) => {
      const err = error as ContractFunctionExecutionError
      console.log('Mint pixels error:', err.cause?.message, err.cause?.shortMessage, err.cause?.details)
      notify(`Mint failed: ${err.cause?.shortMessage}`, 'error')
      throw error
    }).finally(() => {
      setLoading(false)
    })

    notify(`Minted (${x}, ${y}) [${w}x${h}]`, 'success')
    console.log('Mint transaction hash:', hash)

    return hash
  }, [loading])

  return { mintPixels }
}
