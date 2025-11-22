import { useCallback, useEffect, useState } from 'react'

import { WebRTCService } from '../WebRTCService'
import { ConnectionStatus, useWebRTC } from '../WebRTCProvider'

import { ChannelPayloadMap } from '@/providers/types'
import { useWebSocketSubscription } from '@/providers/useWebsocketSubscription'
import { useWebSocket } from '@/providers/WebsocketProvider'

const accountConnectServices: { [acc: string]: WebRTCService } = {}

export function getAccountConnectService(to: string) {
  return accountConnectServices[to] || null
}

function getRandomName() {
  return Math.floor(Math.random() * 10) + Math.random().toString(36).substring(3, 10)
}

interface UseWebRTCConnectWsProps {
  onMsg: (from: string, data: string | ArrayBuffer) => void
  onTrack?: (from: string, track: RTCTrackEvent) => void
}

export function useWebRTCConnectWs({ onMsg, onTrack }: UseWebRTCConnectWsProps) {
  const { send } = useWebSocket()

  const { dispatch, createOrGetStream } = useWebRTC()

  const [wsRandomName, setRandomName] = useState(localStorage.getItem('webrtc-ws-name') || '')

  useEffect(() => {
    // get name from local storage or generate new
    let name = localStorage.getItem('webrtc-ws-name')
    if (!name) {
      name = getRandomName()
      localStorage.setItem('webrtc-ws-name', name)
      setRandomName(name)
    }
  }, [])

  const createService = useCallback(async (from: string, to: string, isAnswering = false) => {
    dispatch({ type: 'ADD_ADDR', addr: to })

    const stream = await createOrGetStream()
    if (!stream) throw new Error('No media stream available')

    return new WebRTCService({
      onLocalSDP: async (sdp) => {
        console.log('Local SDP:', sdp)
        // Here you would typically send the SDP to the other peer
        dispatch({
          type: 'UPDATE_STATUS',
          addr: to,
          status: isAnswering ? ConnectionStatus.ANSWERING : ConnectionStatus.OFFERING,
        })

        send({
          action: 'send_message',
          payload: {
            from,
            to,
            content: sdp,
          }
        })

        dispatch({
          type: 'UPDATE_STATUS',
          addr: to,
          status: isAnswering ? ConnectionStatus.ANSWERED : ConnectionStatus.OFFERED,
        })
      },
      onMessage: (data) => {
        console.log('Received message:', data);
        onMsg(to, data)
        // dispatch({ type: 'ADD_MESSAGE', channel: to, message: {
        //   id: 0,
        //   text: data as string,
        //   sender: `${to.slice(0, 8)}...${to.slice(-4)}`,
        //   timestamp: Date.now(),
        // } });
      },
      onConnect: () => {
        dispatch({
          type: 'UPDATE_STATUS',
          addr: to,
          status: ConnectionStatus.CONNECTED,
        })
        console.log('Connected to:', to)
        // Notify the app that we are connected
        // This could be a custom event or a state update
        onMsg(to, '_connected_')
      },
      onClose: () => {
        console.log('Closed connection:', to)
        delete accountConnectServices[to]
        onMsg(to, '_closed_')
      },
      onTrack: (e) => {
        console.log('Received track from:', to, e)
        onTrack?.(to, e)
      }
    }, stream)
  }, [send, onMsg, onTrack, dispatch, createOrGetStream])

  const onWsMessage = useCallback(async (data: ChannelPayloadMap[`message-to-${string}`]) => {
    if (!wsRandomName) return
    const { from, content } = data

    const sdp = JSON.parse(content) as RTCSessionDescriptionInit

    if (!accountConnectServices[from]) {
      // received offer from a new address
      console.log('Got offer', content)
      dispatch({
        type: 'UPDATE_STATUS',
        addr: from,
        status: ConnectionStatus.OFFER_RECEIVED,
      })
      const service = await createService(wsRandomName, from, true)
      service.receiveOfferThenAnswer(sdp)

      accountConnectServices[from] = service
    } else {
      // received answer after making offer
      console.log('Got answer', sdp)
      dispatch({
        type: 'UPDATE_STATUS',
        addr: from,
        status: ConnectionStatus.ANSWER_RECEIVED,
      })
      const service = accountConnectServices[from]
      service.receiveSDP(sdp)
    }
  }, [wsRandomName, createService])

  useWebSocketSubscription(`message-to-${wsRandomName}`, onWsMessage)

  // Start offering connect to toAddr
  const offerConnect = useCallback(async (toAddr: string) => {
    if (!wsRandomName) return
    // already connected or connecting
    if (accountConnectServices[toAddr]) return

    dispatch({
      type: 'UPDATE_STATUS',
      addr: toAddr,
      status: ConnectionStatus.INIT,
    })

    const service = await createService(wsRandomName, toAddr)

    service.createChannel(`${toAddr}-chat`)
    service.createOffer()

    accountConnectServices[toAddr] = service
  }, [wsRandomName, createService])

  // WebRTC connection setup
  const { state: { addressList } } = useWebRTC()

  // send data to all addresses
  const sendAll = useCallback((data: string) => {
    console.log('sendAll', addressList, data)
    for (const addr of addressList) {
      getAccountConnectService(addr)?.sendMessage(data)
    }
  }, [addressList, getAccountConnectService])

  // send data to specific address
  const sendTo = useCallback((addr: string, data: string) => {
    console.log('sendTo', addr, data)
    getAccountConnectService(addr)?.sendMessage(data)
  }, [getAccountConnectService])

  return {
    offerConnect,
    sendAll,
    sendTo,
    wsRandomName,
  }
}
