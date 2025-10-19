import { useCallback, useEffect, useMemo } from 'react'
import { ContractFunctionExecutionError, Log, parseEventLogs } from 'viem'
import { useModal } from 'connectkit'
import { useAccount, useCapabilities, useChainId, usePublicClient, useWriteContract } from 'wagmi'

import { globalEventBus } from '@/lib/EventEmitter'
import { globalState } from '@/components/globalState'
import { enableRoundRobinHttp } from '@/providers/roundRobinHttp'
import { useNotification } from '@/providers/NotificationProvider'

import { GiftContractAddress } from '../constants'
import { boxClaimedEventAbi, claimBoxAbi } from './types'
import { useAccountCapabilities } from './useAccountCapabilities'
import { useClaimBoxPayMaster } from './useClaimBoxPayMaster'
import { useClaimBoxEOA } from './useClaimBoxEOA'

export function useClaimBox() {

  // const { writeContractAsync } = useWriteContract()
  // const { address: account } = useAccount()

  // const client = usePublicClient()
  // // const connector = useConnectorClient()

  // const { setOpen } = useModal()

  const { notify, setLoading } = useNotification()

  // const claimBoxEOAx = useCallback(async (pos: number, deadline: number, sig: `0x${string}`) => {
  //   if (!client) throw new Error('No client')
  //   if (!account) {
  //     notify(`Please connect your wallet`)
  //     setOpen(true)
  //     return
  //   }

  //   // check coolDownTime
  //   // const coolDownTime = globalState.giftBoxCooldownTime || 0
  //   // if (coolDownTime && coolDownTime > Math.floor(Date.now() / 1000)) {
  //   //   notify(`Box cooldown not passed`, 'error')
  //   //   return
  //   // }

  //   const params = {
  //     address: GiftContractAddress,
  //     abi: claimBoxAbi,
  //     functionName: 'claimBox',
  //     args: [pos, BigInt(deadline), sig],
  //     account,
  //   } as const

  //   try {
  //     setLoading(true)
  //     const { request } = await client.simulateContract(params)
  //     enableRoundRobinHttp(false)
  //     const hash = await writeContractAsync({...params})
  //     console.log('Transaction hash claimBox:', hash)

  //     const receipt = await client.waitForTransactionReceipt({ hash })

  //     const logs = parseEventLogs({
  //       abi: boxClaimedEventAbi,
  //       eventName: 'BoxClaimed',
  //       logs: receipt.logs,
  //     })

  //     const args = logs[0].args

  //     console.log('Parsed BoxClaimed logs:', args)

  //     globalEventBus.emit('boxClaimed', args)

  //     notify(`Box claimed successfully (${args.token} token)`, 'success')

  //     return hash
  //   } catch (error) {
  //     const err = error as ContractFunctionExecutionError
  //     console.log('Claim box error:', err.cause?.message, err.cause?.shortMessage, err.cause?.details)
  //     globalEventBus.emit('boxClaimError', err.cause?.shortMessage)
  //     notify(`${err.cause?.shortMessage}`, 'error')
  //   } finally {
  //     enableRoundRobinHttp(true)
  //     setLoading(false)
  //   }
  // }, [writeContractAsync, client, account])

  // claimBox for EOA (Normal Account)
  const { claimBoxEOA, result: rs1, error: err1 } = useClaimBoxEOA()

  // claimBox for SA (Smart Account)
  const capabilities = useAccountCapabilities()
  const { claimBoxPayMaster, result: rs2, error: err2 } = useClaimBoxPayMaster(capabilities)

  const claimBoxUniversal = useCallback(async (pos: number, deadline: number, sig: `0x${string}`) => {
    // check coolDownTime
    const coolDownTime = globalState.giftBoxCooldownTime || 0
    if (coolDownTime && coolDownTime > Math.floor(Date.now() / 1000)) {
      notify(`Box cooldown not passed`, 'error')
      return
    }

    // start loading
    setLoading(true)

    // @TODO await client.simulateContract(params)

    // @TODO Verify human (Turnstile)

    if (capabilities?.paymasterService) {
      await claimBoxPayMaster(pos, deadline, sig)
    } else {
      await claimBoxEOA(pos, deadline, sig)
    }

    setLoading(false)
  }, [claimBoxEOA, claimBoxPayMaster])

  // handle error
  handleClaimBoxError((err1 || err2) as ContractFunctionExecutionError)

  // handle result
  const rs = rs1 || rs2
  useEffect(() => {
    if (rs) {
      console.log('Box claimed with paymaster, result:', rs)
      globalEventBus.emit('boxClaimed', rs)
      notify(`Box claimed successfully (${rs.token} token)`, 'success')
    }
  }, [rs])

  return claimBoxUniversal
}

function handleClaimBoxError(err: ContractFunctionExecutionError) {
  const { notify, setLoading } = useNotification()

  useEffect(() => {
    if (err) {
      // const err = error as ContractFunctionExecutionError
      console.log('Claim box error:', err.cause?.message, err.cause?.shortMessage, err.cause?.details)
      globalEventBus.emit('boxClaimError', err.cause?.shortMessage)
      notify(`${err.cause?.shortMessage}`, 'error')
      setLoading(false)
    }
  }, [err])
}
