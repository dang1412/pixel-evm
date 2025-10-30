import { useCallback, useEffect, useRef, useState } from 'react'
import { useAccount } from 'wagmi'
import { FaInfo, FaSpinner } from 'react-icons/fa'

import { useNotification } from '@/providers/NotificationProvider'

import { PixelMap } from '../pixelmap/PixelMap'
import { mockImages } from '../mock/images'

import { BombMap } from './BombMap'
import { MenuModal } from '../MenuModal'
import { ScoreboardModal } from './ScoreBoardModal'
import { useWebRTC } from '@/lib/webRTC/WebRTCProvider'
import { getAccountConnectService, useWebRTCConnectWs } from '@/lib/webRTC/hooks/useWebRTCConnectWs'
import { PlayerState } from './types'

interface Props {}

const BombGameComponent: React.FC<Props> = (props) => {
  // const bombNetworkRef = useRef<BombNetwork | undefined>(undefined)
  const bombMapRef = useRef<BombMap | undefined>(undefined)
  const [canvas, setCanvas] = useState<HTMLCanvasElement | null>(null)

  const { notify, loading, setLoading } = useNotification()

  const [ players, setPlayers ] = useState<PlayerState[]>([])

  // sync boxes when boxes data or scene changes

  useEffect(() => {
    if (canvas && bombMapRef.current === undefined) {
      // pixel map
      const map = new PixelMap(canvas, {
        // not open scene when click on image
        preOpenImageHook: (curScene, pixel, image) => false
      })
      map.addMainImages(mockImages)

      // initialize bombMap
      const bombMap = new BombMap(map, (players) => setPlayers(players))
      bombMapRef.current = bombMap
    }
  }, [canvas])

  const [isMenuModalOpen, setIsMenuModalOpen] = useState(true)
  const [isPlayerModalOpen, setIsPlayerModalOpen] = useState(false)

  const createGame = useCallback(async () => {
    const bombMap = bombMapRef.current
    if (bombMap) {
      setIsMenuModalOpen(false)
      bombMap.bombNetwork.createGame()
      setIsPlayerModalOpen(true)
    }
  }, [])

  const joinGame = useCallback(async () => {
    const bombMap = bombMapRef.current
    if (bombMap) {
      bombMap.bombNetwork.joinGame()
    }
  }, [])

  const playerId = bombMapRef.current?.playerId
  const score = bombMapRef.current?.score

  // WebRTC connection setup
  const { state: { addressList } } = useWebRTC()

  // send data to all addresses
  const sendAll = useCallback((data: string) => {
    console.log('sendAll', addressList, data)
    for (const addr of addressList) {
      getAccountConnectService(addr)?.sendMessage(data)
    }
  }, [addressList])

  // send data to specific address
  const sendTo = useCallback((addr: string, data: string) => {
    console.log('sendTo', addr, data)
    getAccountConnectService(addr)?.sendMessage(data)
  }, [])

  // update bombNetwork sendAll and sendTo functions
  useEffect(() => {
    const bombNetwork = bombMapRef.current?.bombNetwork
    if (bombNetwork) {
      bombNetwork.sendAll = sendAll
      bombNetwork.sendTo = sendTo
    }
  }, [sendAll, sendTo])

  // receive data from host/client
  const onMsg = useCallback((from: string, data: string | ArrayBuffer) => {
    const bombNetwork = bombMapRef.current?.bombNetwork
    if (!bombNetwork) return

    if (data === '_connected_') {
      setLoading(false)
      bombNetwork.connected(from)
    } else {
      bombNetwork.receiveMsg(from, data as string)
    }
  }, [])

  const { offerConnect } = useWebRTCConnectWs(onMsg)

  // connect to server
  const connect = useCallback(async (addr: string) => {
    setLoading(true)
    offerConnect(addr)
    setIsMenuModalOpen(false)
  }, [offerConnect])

  return (
    <>
      <canvas ref={(c) => setCanvas(c)} className='' style={{border: '1px solid #ccc'}} />

      <div className='w-full absolute top-16 flex items-center justify-center'>
        { loading && <FaSpinner size={24} className='animate-spin text-blue-500 mr-1' /> }
        <div className='text-gray-800 font-semibold'>Score: {score}</div>
      </div>

      {isMenuModalOpen && <MenuModal onConnect={connect} onClose={() => setIsMenuModalOpen(false)} onStartServer={createGame} />}

      <ScoreboardModal
        isOpen={isPlayerModalOpen}
        players={players}
        playerId={playerId}
        onClose={() => setIsPlayerModalOpen(false)}
        onJoinGame={joinGame} 
      />

      <button
        onClick={() => setIsPlayerModalOpen(true)}
        className="fixed bottom-4 right-4 z-50 bg-white shadow-lg rounded-full p-2 hover:bg-gray-100 transition"
      >
        <FaInfo className="w-4 h-4 text-gray-600" />
      </button>
    </>
  )
}

export default BombGameComponent
