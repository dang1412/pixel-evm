'use client'

import { useCallback, useEffect, useState } from 'react'

import { MonsterControl } from './Control'
import { useAdventure } from './hooks/useAdventure'
import { Address, RTCConnectState } from '@/lib/RTCConnectClients'
import { MenuModal } from './MenuModal'
import { ConnectingState } from './ConnectingState'
import { useWebRTCConnect } from './hooks/useWebRTCConnects'

interface Props {}

export const GameMap: React.FC<Props> = (props) => {
  const [canvas, setCanvas] = useState<HTMLCanvasElement | null>(null)

  const { offerConnect, sendAll, sendTo, connectStates } = useWebRTCConnect({
    onConnectStateChange(from, state) {
      // if (!adventures) return
      console.log('onConnectStateChange', from, state)

      if (adventures && state === RTCConnectState.Connected) {
        // Send all current states to client
        if (adventures.isServer) {
          adventures.sendStates(from)
        } else {
          // save the server address
          adventures.serverAddr = from
        }
      }
    },
    onReceiveData(from, data) {
      console.log('onReceiveData', from, data, adventures?.isServer)

      if (typeof data === 'string') {

      } else if (adventures) {
        if (adventures.isServer) {
          adventures.receiveActionData(data)
        } else {
          adventures.receiveUpdatesData(data)
        }
      }
    },
  })

  const [adventures] = useAdventure(canvas, sendAll, sendTo)

  // server run
  const startServer = useCallback(async () => {
    if (!adventures || adventures.isServer) return
    // await adventures.rtcClients.connectWallet()
    adventures.loadMonsters([
      {id: 1, pos: 5055, hp: 10, type: 1},
      {id: 2, pos: 5052, hp: 8, type: 2},
    ])

    adventures.startServer()

    setIsMenuModalOpen(false)
  }, [adventures])

  // connect to server
  const connect = useCallback(async (addr: string) => {
    offerConnect(addr as Address)
    setIsMenuModalOpen(false)
  }, [offerConnect])

  const [isMenuModalOpen, setIsMenuModalOpen] = useState(true)

  const [isConnectingStatesOpen, setIsConnectingStatesOpen] = useState(false)

  // open connecting states when any update
  useEffect(() => {
    if (connectStates) setIsConnectingStatesOpen(true)
  }, [connectStates])

  return (
    <>
      <canvas ref={(c) => setCanvas(c)} className='w-full' style={{border: '1px solid #ccc'}} />
      <MonsterControl onSetMode={(m) => {if (adventures) adventures.mode = m}} openConnectInfo={() => setIsConnectingStatesOpen(true)} />
      {isMenuModalOpen && <MenuModal onConnect={connect} onClose={() => setIsMenuModalOpen(false)} onStartServer={startServer} />}
      {isConnectingStatesOpen && <ConnectingState states={connectStates} onClose={() => setIsConnectingStatesOpen(false)} />}
    </>
  )
}

export default GameMap
