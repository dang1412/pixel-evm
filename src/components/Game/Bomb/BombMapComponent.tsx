import { useCallback, useEffect, useRef, useState } from 'react'
import { FaInfo } from 'react-icons/fa'
import { useSearchParams } from 'next/navigation'

import { useNotification } from '@/providers/NotificationProvider'
import { useWebRTCConnectWs } from '@/lib/webRTC/hooks/useWebRTCConnectWs'

import { PixelMap } from '../pixelmap/PixelMap'
import { mockImages } from '../mock/images'

import { MenuModal } from '../MenuModal'
import { GuideModal } from '../GuideModal'
import { BombMap } from './BombMap'
import { GuideSteps } from './GuideSteps'
import { useWebSocket } from '@/providers/WebsocketProvider'

interface Props {
  onBombMapReady: (bombMap: BombMap) => void
}

const audioStream: {[name: string]: HTMLAudioElement} = {}

const BombMapComponent: React.FC<Props> = ({ onBombMapReady }) => {
  const bombMapRef = useRef<BombMap | undefined>(undefined)
  const [canvas, setCanvas] = useState<HTMLCanvasElement | null>(null)

  const { notify, setLoading } = useNotification()

  const [shouldShowInfoButton, setShouldShowInfoButton] = useState(true)

  const searchParams = useSearchParams()
  const connectToParam = searchParams.get('connectTo')

  // receive data from host/client
  const onMsg = useCallback((from: string, data: string | ArrayBuffer) => {
    const bombNetwork = bombMapRef.current?.bombNetwork
    if (!bombNetwork) return

    if (data === '_connected_') {
      setLoading(false)
      setShouldShowInfoButton(false)
    }

    bombNetwork.receiveMsg(from, data as string)
  }, [])

  const onTrack = useCallback((from: string, e: RTCTrackEvent) => {
    console.log('Received track from', from, 'streams:', e.streams)
    const audio = audioStream[from] || document.createElement('audio')
    audio.srcObject = e.streams[0]

    if (!audioStream[from]) {
      audio.autoplay = true
      audioStream[from] = audio
      document.body.appendChild(audio)
    }
  }, [])

  const { offerConnect, sendAll, sendTo, wsRandomName } = useWebRTCConnectWs({ onMsg, onTrack })

  useEffect(() => {
    if (canvas && bombMapRef.current === undefined) {
      // pixel map
      const map = new PixelMap(canvas, {
        // not open scene when click on image
        preOpenImageHook: (curScene, pixel, image) => false
      })
      map.addMainImages(mockImages)

      // initialize bombMap
      const bombMap = new BombMap(map)
      bombMap.bombNetwork.notify = notify
      bombMap.bombNetwork.myWsName = wsRandomName
      bombMapRef.current = bombMap

      onBombMapReady(bombMap)
    }
  }, [canvas])

  useEffect(() => {
    if (bombMapRef.current) {
      bombMapRef.current.bombNetwork.myWsName = wsRandomName
    }
  }, [wsRandomName])

  const [isConnectModalOpen, setIsConnectModalOpen] = useState(true)

  // update bombNetwork sendAll and sendTo functions
  useEffect(() => {
    const bombNetwork = bombMapRef.current?.bombNetwork
    if (bombNetwork) {
      bombNetwork.sendAll = sendAll
      bombNetwork.sendTo = sendTo
    }
  }, [sendAll, sendTo])

  const { send, subscribe } = useWebSocket()

  // make host
  const createGame = useCallback(async () => {
    const bombMap = bombMapRef.current
    if (bombMap && !bombMap.bombNetwork.isHost()) {
      // subscribe to bomb-game channel
      subscribe('bomb-game', (payload) => {
        if (payload.type === 'game_created') {
          bombMapRef.current?.bombNetwork.getBombGame()?.setGameId(payload.gameId)
        } 
        // else if (payload.type === 'top_rank') {
        //   console.log('Top Ranks:', payload.players)
        // }
      })

      // create game as host
      bombMap.bombNetwork.createGame(send)

      // close connect modal
      setIsConnectModalOpen(false)
      // not show info button
      setShouldShowInfoButton(false)
    }
  }, [send, subscribe])

  // connect to a host
  const connect = useCallback(async (addr: string) => {
    setLoading(true)
    offerConnect(addr)
    setIsConnectModalOpen(false)
  }, [offerConnect])

  // Auto-connect if connectTo parameter exists
  useEffect(() => {
    if (connectToParam) {
      setIsGuideModalOpen(false)
      connect(connectToParam)
    }
  }, [connectToParam, connect])

  const [isGuideModalOpen, setIsGuideModalOpen] = useState(true)

  return (
    <>
      <canvas ref={(c) => setCanvas(c)} className='' style={{border: '1px solid #ccc'}} />

      {isConnectModalOpen && (
        <MenuModal
          onConnect={connect}
          onClose={() => setIsConnectModalOpen(false)}
          onStartServer={createGame}
          onInfoClick={() => setIsGuideModalOpen(true)}
        />
      )}

      {shouldShowInfoButton && (
        <div className='fixed bottom-4 right-4 z-50 flex space-x-2'>
          <button
            onClick={() => setIsConnectModalOpen(true)}
            className="bg-white shadow-lg rounded-full p-2 hover:bg-gray-100 transition"
          >
            <FaInfo className="w-4 h-4 text-gray-600" />
          </button>
        </div>
      )}

      {isGuideModalOpen && (
        <GuideModal
          steps={GuideSteps}
          onClose={() => setIsGuideModalOpen(false)}
        />
      )}
    </>
  )
}

export default BombMapComponent
