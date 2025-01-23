import { useAccount, useChainId, useConfig, usePublicClient, useWatchContractEvent, useWriteContract } from 'wagmi'

import { IPFSService } from '@/lib/IPFSService'
import { rtcConnectAbi } from './rtcConnectAbi'
import { useCallback, useEffect, useState } from 'react'
import { RTCService } from '@/lib/RTCService'
import { watchContractEvent } from 'viem/actions'

// Sepolia
// const RTC_CONTRACT_ADDR = '0xBaA0f5E2EcF36cE5c15261806CFCAf8877116Db0'
// Base Sepolia
const RTC_CONTRACT_ADDR = '0x38b66BD216844760CD468F51D661226bb4333EB1'

export type Address = `0x${string}`

interface RTCEventData {
  from: Address
  to: Address
  cid: string
}

const services: {[k: Address]: RTCService} = {}
const ipfs = new IPFSService()

export enum RTCConnectState {
  None,

  // create offer, uploading offer, make offer tx
  Offering = 'Offering',
  // done offer tx
  Offered = 'Offered',
  // received answer cid, start downloading answer
  AnswerReceived = 'AnswerReceived',


  // received offer cid, start downloading offer
  OfferReceived = 'OfferReceived',
  // create answer, uploading answer, make answer tx
  Answering = 'Answering',
  // done answer tx
  Answered = 'Answered',

  // done handshake
  Connected = 'Connected',
}

interface UseWebRTCConnectOpts {
  onReceiveData: (from: Address, data: string | ArrayBuffer) => void
  onConnectStateChange: (from: Address, state: RTCConnectState) => void
}

export type OfferConnectFunc = (addr: Address) => void
export type SendAllFunc = (data: string | ArrayBuffer) => void
export type SendToFunc = (addr: Address, data: string | ArrayBuffer) => void
export type AddressesConnectStates = {[addr: Address]: RTCConnectState}

interface UseWebRTCConnectReturn {
  offerConnect: OfferConnectFunc
  sendAll: SendAllFunc
  sendTo: SendToFunc
  connectStates: AddressesConnectStates
}

export function useWebRTCConnect({ onReceiveData, onConnectStateChange: onConnectStateChange_ }: UseWebRTCConnectOpts): UseWebRTCConnectReturn {
  const { writeContractAsync, data, error } = useWriteContract()
  const { address: myAddr } = useAccount()

  // connect states
  const [connectStates, setAddrConnectStates] = useState<AddressesConnectStates>({})
  const onConnectStateChange = useCallback((from: Address, state: RTCConnectState) => {
    onConnectStateChange_(from, state)
    setAddrConnectStates(states => ({...states, [from]: state}))
  }, [onConnectStateChange_])

  // proceed offer
  const proceedOffer = useCallback(async (from: Address, offerCID: string) => {
    const rtcService = new RTCService(ipfs, async (answerCid) => {
      // after uploading answer to IPFS and got the cid, answer the connect
      console.log('Answering onchain', from)

      // await contract.answerConnect(from, cid)
      await writeContractAsync({
        abi: rtcConnectAbi,
        address: RTC_CONTRACT_ADDR,
        functionName: 'answerConnect',
        args: [
          from,
          answerCid
        ]
      })

      console.log('Answered onchain, waiting for accepting the answer', from)
      onConnectStateChange(from, RTCConnectState.Answered)
    })

    rtcService.onMessage = (data) => {
      onReceiveData(from, data)
    }
    rtcService.onConnect = () => {
      onConnectStateChange(from, RTCConnectState.Connected)
    }

    // Receive offer
    onConnectStateChange(from, RTCConnectState.OfferReceived)
    const sdp = await ipfs.fetch<RTCSessionDescriptionInit>(offerCID)
    
    // Answer offer
    console.log('Answering', from, offerCID)
    onConnectStateChange(from, RTCConnectState.Answering)
    rtcService.receiveOfferThenAnswer(sdp)

    services[from] = rtcService
  }, [writeContractAsync, onConnectStateChange, onReceiveData])

  const client = usePublicClient()

  // wait for connect offer from others
  useEffect(() => {
    if (!client || !myAddr) return () => {}

    const unsub = watchContractEvent(client, {
      address: RTC_CONTRACT_ADDR,
      abi: rtcConnectAbi,
      eventName: 'OfferConnect',
      args: {
        to: myAddr
      },
      async onLogs(logs) {
        console.log('New logs abcd!', logs)
        for (const log of logs) {
          console.log('Offer', (log as any).args)
          // got the offer
          const { from, to, cid } = (log as any).args as RTCEventData
          proceedOffer(from, cid)
        }
      },
    })

    return () => unsub
  }, [client, myAddr])

  const offerConnect = useCallback((target: Address) => {
    if (!client) return

    const rtcService = new RTCService(ipfs, async (cid) => {
      // after uploading answer to IPFS and got the cid, answer the connect
      console.log('Offering onchain', target)

      await writeContractAsync({
        abi: rtcConnectAbi,
        address: RTC_CONTRACT_ADDR,
        functionName: 'offerConnect',
        args: [
          target,
          cid
        ]
      })

      console.log('Offered onchain, waiting for the answer', target, cid)
      onConnectStateChange(target, RTCConnectState.Offered) // 2
    })

    // create channel
    rtcService.createChannel('myChannel')
    // create offer
    onConnectStateChange(target, RTCConnectState.Offering)  // 1
    rtcService.createOffer()

    // onMessage
    rtcService.onMessage = (data) => {
      onReceiveData(target, data)
    }
    // onConnect
    rtcService.onConnect = () => {
      onConnectStateChange(target, RTCConnectState.Connected) // 4
    }

    // wait for answer
    const unwatch = watchContractEvent(client, {
      address: RTC_CONTRACT_ADDR,
      abi: rtcConnectAbi,
      eventName: 'AnswerConnect',
      args: {
        from: target,
        to: myAddr
      },
      async onLogs(logs) {
        unwatch()
        for (const log of logs) {
          console.log('Answer', (log as any).args)
          // got the answer
          const { from, to, cid: answeredCID } = (log as any).args as RTCEventData
          const sdp = await ipfs.fetch<RTCSessionDescriptionInit>(answeredCID)
          await rtcService.receiveSDP(sdp)
          onConnectStateChange(target, RTCConnectState.AnswerReceived)  // 3
        }
      },
    })

    // save the target service
    services[target] = rtcService
  }, [client, writeContractAsync, onConnectStateChange, onReceiveData])

  const sendTo = useCallback((addr: Address, data: string | ArrayBuffer) => {
    const rtcService = services[addr]
    if (rtcService) {
      rtcService.sendMessage(data)
    }
  }, [])

  const sendAll = useCallback((data: string | ArrayBuffer) => {
    for (const addr of Object.keys(services)) {
      sendTo(addr as Address, data)
    }
  }, [])

  return { offerConnect, sendAll, sendTo, connectStates }
}
