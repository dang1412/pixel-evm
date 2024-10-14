'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { ViewportMap } from './ViewportMap'
import { Adventures, ActionMode } from './adventures/Adventures'
import { MonsterControl } from './Control'
import { useAdventure } from './hooks/useAdventure'
import { Address } from '@/lib/RTCConnectClients'

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
  }, [adventures])

  const [addr, setAddr] = useState('')

  const connect = useCallback(async () => {
    if (!adventures) return
    await adventures.rtcClients.connectWallet()
    adventures.connectToServer(addr as Address)
  }, [addr])

  return (
    <>
      <div className='flex flex-row text-center items-center'>
        <button
          className="text-white bg-green-700 hover:bg-green-800 focus:ring-4 focus:ring-green-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-1 ml-2"
          onClick={startServer}
        >
          Start Server
        </button>
        <div className="relative">
          <input 
            className="block w-96 p-4 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:outline-none"
            placeholder="0x"
            value={addr}
            onChange={(e) => setAddr(e.target.value)}
          />
          <button
            className="text-white absolute end-2.5 bottom-2.5 bg-sky-700 hover:bg-sky-800 focus:ring-4 focus:ring-sky-300 font-medium rounded-lg text-sm px-4 py-2"
            onClick={connect}
          >
            Connect
          </button>
        </div>
      </div>
      <canvas ref={(c) => setCanvas(c)} style={{border: '1px solid #ccc', width: '100%', height: MAP_H}} />
      <MonsterControl onSetMode={(m) => {if (adventures) adventures.mode = m}} />
    </>
  )
}

export default GameMap
