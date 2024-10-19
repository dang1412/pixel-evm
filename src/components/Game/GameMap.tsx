'use client'

import { useCallback, useEffect, useState } from 'react'

import { MonsterControl } from './Control'
import { useAdventure } from './hooks/useAdventure'
import { Address, RTCConnectState } from '@/lib/RTCConnectClients'
import { MenuModal } from './MenuModal'
import { ConnectingState } from './ConnectingState'

interface Props {}

export const GameMap: React.FC<Props> = (props) => {
  const [canvas, setCanvas] = useState<HTMLCanvasElement | null>(null)
  const [adventures, states] = useAdventure(canvas)

  const startServer = useCallback(async () => {
    if (!adventures || adventures.isServer) return
    await adventures.rtcClients.connectWallet()
    adventures.loadMonsters([
      {id: 1, pos: 5055, hp: 10, type: 1},
      {id: 2, pos: 5052, hp: 8, type: 2},
    ])

    adventures.startServer()

    setIsMenuModalOpen(false)
  }, [adventures])

  const connect = useCallback(async (addr: string) => {
    if (!adventures) return
    await adventures.rtcClients.connectWallet()
    adventures.connectToServer(addr as Address)

    setIsMenuModalOpen(false)
  }, [adventures])

  const [isMenuModalOpen, setIsMenuModalOpen] = useState(true)

  const [isConnectingStatesOpen, setIsConnectingStatesOpen] = useState(false)

  // open connecting states when any update
  useEffect(() => {
    if (states) setIsConnectingStatesOpen(true)
  }, [states])

  return (
    <>
      <canvas ref={(c) => setCanvas(c)} className='w-full' style={{border: '1px solid #ccc'}} />
      <MonsterControl onSetMode={(m) => {if (adventures) adventures.mode = m}} openConnectInfo={() => setIsConnectingStatesOpen(true)} />
      {isMenuModalOpen && <MenuModal onConnect={connect} onClose={() => setIsMenuModalOpen(false)} onStartServer={startServer} />}
      {isConnectingStatesOpen && <ConnectingState states={states} onClose={() => setIsConnectingStatesOpen(false)} />}
    </>
  )
}

export default GameMap
