'use client'

import { useCallback, useEffect, useState } from 'react'

import { useAdventure } from './hooks/useAdventure'
import { Address, RTCConnectState } from '@/lib/RTCConnectClients'
import { MenuModal } from './MenuModal'
import { ConnectingState } from './ConnectingState'
// import { useWebRTCConnect } from './hooks/useWebRTCConnects'

import { getAccountConnectService, useWebRTCConnect } from '@/lib/webRTC/hooks/useWebRTCConnect'
import { useWebRTC } from '@/lib/webRTC/WebRTCProvider'

interface Props {}

export const GameMap: React.FC<Props> = (props) => {
  const [canvas, setCanvas] = useState<HTMLCanvasElement | null>(null)

  // const { offerConnect, sendAll, sendTo, connectStates } = useWebRTCConnect({
  //   onConnectStateChange(from, state) {
  //     // if (!adventures) return
  //     console.log('onConnectStateChange', from, state)

  //     if (adventures && state === RTCConnectState.Connected) {
  //       // Send all current states to client
  //       if (adventures.isServer) {
  //         adventures.sendStates(from)
  //       } else {
  //         // save the server address
  //         adventures.serverAddr = from
  //       }
  //     }
  //   },
  //   onReceiveData(from, data) {
  //     console.log('onReceiveData', from, data, adventures?.isServer)

  //     if (typeof data === 'string') {

  //     } else if (adventures) {
  //       if (adventures.isServer) {
  //         // server
  //         adventures.receiveActionData(data)
  //       } else {
  //         // client
  //         adventures.receiveUpdatesData(data)
  //       }
  //     }
  //   },
  // })

  const { state: { addressList } } = useWebRTC()

  console.log('GameMap addressList', addressList)

  // send data to all connected addresses
  const sendAll = useCallback((data: string | ArrayBuffer) => {
    console.log('sendAll', addressList, data)
    for (const addr of addressList) {
      getAccountConnectService(addr)?.sendMessage(data)
    }
  }, [addressList])

  // send data to specific address
  const sendTo = useCallback((addr: Address, data: string | ArrayBuffer) => {
    console.log('sendTo', addr, data)
    getAccountConnectService(addr)?.sendMessage(data)
  }, [])

  const adventuresRef = useAdventure(canvas, sendAll, sendTo)

  const onMsg = useCallback((from: string, data: string | ArrayBuffer) => {
    const adventures = adventuresRef.current
    if (!adventures) return
    console.log('onMsg', from, data, adventures?.isServer)
    if (typeof data === 'string') {
      // Handle string data (e.g., commands)
      if (data === '_connected_') {
        // connected to server
        if (!adventures.isServer) {
          adventures.serverAddr = from
          adventures.isServer = false // set as client
          console.log('Connected to server:', from)
        }
      }
    } else {
      // Handle binary data (e.g., game updates)
      if (adventures.isServer) {
        // server
        adventures.receiveActionData(data)
      } else {
        // client
        adventures.receiveUpdatesData(data)
      }
    }
  }, [])

  const { offerConnect } = useWebRTCConnect(onMsg)

  // server run
  const startServer = useCallback(async () => {
    const adventures = adventuresRef.current
    if (!adventures || adventures.isServer) return
    adventures.startServer()

    setIsMenuModalOpen(false)
  }, [])

  // connect to server
  const connect = useCallback(async (addr: string) => {
    offerConnect(addr as Address)
    setIsMenuModalOpen(false)
  }, [offerConnect])

  const [isMenuModalOpen, setIsMenuModalOpen] = useState(true)

  const [isConnectingStatesOpen, setIsConnectingStatesOpen] = useState(false)

  // open connecting states when any update
  // useEffect(() => {
  //   if (Object.keys(connectStates).length) setIsConnectingStatesOpen(true)
  // }, [connectStates])

  return (
    <>
      <canvas ref={(c) => setCanvas(c)} className='' style={{border: '1px solid #ccc'}} />
      {/* <MonsterControl onSetMode={(m) => {if (adventures) adventures.mode = m}} openConnectInfo={() => setIsConnectingStatesOpen(true)} /> */}
      {isMenuModalOpen && <MenuModal onConnect={connect} onClose={() => setIsMenuModalOpen(false)} onStartServer={startServer} />}
      {/* {isConnectingStatesOpen && <ConnectingState states={connectStates} onClose={() => setIsConnectingStatesOpen(false)} />} */}
    </>
  )
}

export default GameMap
