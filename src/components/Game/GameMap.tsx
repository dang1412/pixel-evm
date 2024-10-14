'use client'

import { useCallback, useState } from 'react'
import { MonsterControl } from './Control'
import { useAdventure } from './hooks/useAdventure'
import { Address } from '@/lib/RTCConnectClients'
import { MenuModal } from './MenuModal'

interface Props {}

const MAP_H = 800

export const GameMap: React.FC<Props> = (props) => {
  const [canvas, setCanvas] = useState<HTMLCanvasElement | null>(null)
  const adventures = useAdventure(canvas)

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

  return (
    <>
      <canvas ref={(c) => setCanvas(c)} style={{border: '1px solid #ccc', width: '100%', height: MAP_H}} />
      <MonsterControl onSetMode={(m) => {if (adventures) adventures.mode = m}} />
      {isMenuModalOpen && <MenuModal onConnect={connect} onClose={() => setIsMenuModalOpen(false)} onStartServer={startServer} />}
    </>
  )
}

export default GameMap
