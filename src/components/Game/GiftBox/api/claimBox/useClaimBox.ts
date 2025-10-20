import { RefObject, useCallback, useEffect, useState } from 'react'
import { ContractFunctionExecutionError } from 'viem'
import { useModal } from 'connectkit'
import { useAccount, usePublicClient } from 'wagmi'

import { globalEventBus } from '@/lib/EventEmitter'
import { globalState } from '@/components/globalState'
import { useNotification } from '@/providers/NotificationProvider'
import { TurnstileRef } from '@/components/Turnstile'

import { GiftContractAddress } from '../constants'
import { claimBoxAbi } from './types'
import { useAccountCapabilities } from './useAccountCapabilities'
import { useClaimBoxPayMaster } from './useClaimBoxPayMaster'
import { useClaimBoxEOA } from './useClaimBoxEOA'
import { generateTurnstileAndVerify } from '../verifyHuman'

export function useClaimBox(ref: RefObject<TurnstileRef | null>) {

  const client = usePublicClient()

  const { address: account } = useAccount()

  const { setOpen } = useModal()

  const { notify } = useNotification()

  const [simulateError, setSimulateError] = useState<ContractFunctionExecutionError>()

  // claimBox for EOA (Normal Account)
  const { claimBoxEOA, result: rs1, error: err1 } = useClaimBoxEOA()

  // claimBox for SA (Smart Account)
  const capabilities = useAccountCapabilities()
  const { claimBoxPayMaster, result: rs2, error: err2 } = useClaimBoxPayMaster(capabilities)

  const claimBoxUniversal = useCallback(async (pos: number) => {
    // 
    if (!account) {
      notify('Please connect wallet', 'error')
      setOpen(true)
      return
    }

    // check coolDownTime
    const coolDownTime = globalState.giftBoxCooldownTime || 0
    if (coolDownTime && coolDownTime > Math.floor(Date.now() / 1000)) {
      notify(`Box cooldown not passed`, 'error')
      return
    }

    // Simulate contract
    if (!client) return
    try {
      const request = await client.simulateContract({
        address: GiftContractAddress,
        abi: claimBoxAbi,
        functionName: 'claimBox',
        args: [pos, BigInt(0), '0x'],
        account,
      })
      console.log('Simulated result', request)
    } catch (e) {
      setSimulateError(e as ContractFunctionExecutionError)
      return
    }

    // Verify human (Turnstile)
    const turnstileRef = ref.current
    if (!turnstileRef) return
    const data = await generateTurnstileAndVerify(turnstileRef, account)
    if (!data) {
      return notify('No signature', 'error')
    }

    // got deadline and signature from server
    const { deadline, signature } = data
    console.log('Claim box with args', deadline, signature)

    if (capabilities?.paymasterService) {
      await claimBoxPayMaster(pos, deadline, signature)
    } else {
      await claimBoxEOA(pos, deadline, signature)
    }
  }, [client, account, capabilities, claimBoxEOA, claimBoxPayMaster])

  // handle error
  handleClaimBoxError((simulateError || err1 || err2) as ContractFunctionExecutionError)

  // handle result
  const rs = rs1 || rs2
  useEffect(() => {
    if (rs) {
      console.log('Box claimed with result:', rs)
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
