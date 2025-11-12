import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { FaInfo, FaSpinner } from 'react-icons/fa'

import { useNotification } from '@/providers/NotificationProvider'
import { useWebRTC } from '@/lib/webRTC/WebRTCProvider'
import { useWebRTCConnectWs } from '@/lib/webRTC/hooks/useWebRTCConnectWs'

import { PixelMap } from '../pixelmap/PixelMap'
import { mockImages } from '../mock/images'

import { MenuModal } from '../MenuModal'
import { GuideModal } from '../GuideModal'
import { BombMap } from './BombMap'
import { ScoreboardModal } from './ScoreBoardModal'
import { GameState, PlayerState } from './types'
import { FloatScoreTable } from './FloatScoreTable'
import BombSelect from './BombSelect'
import { GuideSteps } from './GuideSteps'
import { BombShop } from './BombShop'
import { FaShop } from 'react-icons/fa6'

interface Props {}

const BombGameComponent: React.FC<Props> = (props) => {
  const bombMapRef = useRef<BombMap | undefined>(undefined)
  const [canvas, setCanvas] = useState<HTMLCanvasElement | null>(null)

  const { notify, loading, setLoading } = useNotification()

  const [ hostName, setHostName ] = useState<string>('')
  const [ players, setPlayers ] = useState<PlayerState[]>([])
  const [ gameState, setGameState ] = useState<GameState>()

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
      const bombMap = new BombMap(
        map,
        (players) => setPlayers(players),
        (state) => setGameState(state),
      )
      bombMapRef.current = bombMap
    }
  }, [canvas])

  const [isMenuModalOpen, setIsMenuModalOpen] = useState(true)
  const [isPlayerModalOpen, setIsPlayerModalOpen] = useState(false)

  // receive data from host/client
  const onMsg = useCallback((from: string, data: string | ArrayBuffer) => {
    const bombNetwork = bombMapRef.current?.bombNetwork
    if (!bombNetwork) return

    if (data === '_connected_') {
      setLoading(false)
      bombNetwork.connected(from)
      if (bombNetwork.isHost()) {
        notify('A player has connected: ' + from, 'info')
      } else {
        notify('Connected to host ' + from, 'info')
        setIsPlayerModalOpen(true)
        setHostName(from)
      }
    } else if (data === '_closed_') {
      notify('Connection closed: ' + from, 'info')
      if (bombNetwork.isHost()) {
        // remove player
        bombNetwork.removePlayer(from)
      }
    } else {
      bombNetwork.receiveMsg(from, data as string)
    }
  }, [])
  const { offerConnect, getAccountConnectService, wsRandomName } = useWebRTCConnectWs(onMsg)

  const createGame = useCallback(async () => {
    const bombMap = bombMapRef.current
    if (bombMap) {
      setIsMenuModalOpen(false)
      bombMap.bombNetwork.createGame()
      setIsPlayerModalOpen(true)
      setHostName(wsRandomName)
    }
  }, [wsRandomName])

  const joinGame = useCallback(async () => {
    const bombMap = bombMapRef.current
    if (bombMap) {
      bombMap.bombNetwork.joinGame()
    }
  }, [])

  const playerId = bombMapRef.current?.playerId

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

  // connect to server
  const connect = useCallback(async (addr: string) => {
    setLoading(true)
    offerConnect(addr)
    setIsMenuModalOpen(false)
  }, [offerConnect])

  // host actions
  const startRound = useCallback(() => {
    bombMapRef.current?.bombNetwork.getBombGame()?.startRound()
  }, [])

  const restart = useCallback(() => {
    bombMapRef.current?.bombNetwork.getBombGame()?.restart()
  }, [])

  useEffect(() => {
    if (!gameState || !playerId) return
    if (gameState.pausing) {
      setIsPlayerModalOpen(true)
      if (gameState.round > 0) {
        notify('Round ended. Wait for the new round.', 'info')
      }
    } else {
      setIsPlayerModalOpen(false)
      notify('Round started! Place your bombs!', 'info')
    }
  }, [gameState?.pausing, playerId])

  const openModal = useCallback(() => {
    if (gameState) {
      setIsPlayerModalOpen(true)
    } else {
      setIsMenuModalOpen(true)
    }
  }, [gameState])

  const [isGuideModalOpen, setIsGuideModalOpen] = useState(true)

  const playerState = useMemo(() => players.find(p => p.id === playerId), [players])

  const [isBombShopOpen, setIsBombShopOpen] = useState(false)

  return (
    <>
      <canvas ref={(c) => setCanvas(c)} className='' style={{border: '1px solid #ccc'}} />

      <div className='w-full absolute top-16 flex justify-end pointer-events-none px-4'>
        <div className="flex flex-col items-end space-y-2">
          {gameState && (
            <FloatScoreTable gameState={gameState} players={players} playerId={playerId} />
          )}
          <div className="pointer-events-auto">
            { loading && <FaSpinner size={24} className='animate-spin text-blue-500 mr-1' /> }
            {playerId && playerState && (
              <BombSelect
                onSelect={(type) => bombMapRef.current?.setBombType(type)}
                playerState={playerState}
                onOpenShop={() => setIsBombShopOpen(true)}
              />
            )}
          </div>
        </div>
      </div>

      {isMenuModalOpen && (
        <MenuModal
          onConnect={connect}
          onClose={() => setIsMenuModalOpen(false)}
          onStartServer={createGame}
          onInfoClick={() => setIsGuideModalOpen(true)}
        />
      )}

      {gameState && <ScoreboardModal
        isOpen={isPlayerModalOpen}
        hostName={hostName}
        players={players}
        playerId={playerId}
        gameState={gameState}
        isHost={bombMapRef.current?.bombNetwork.isHost() || false}
        onClose={() => setIsPlayerModalOpen(false)}
        onJoinGame={joinGame}
        onStart={startRound}
        onRestart={restart}
      />}

      <div className='fixed bottom-4 right-4 z-50 flex space-x-2'>
        <button
          onClick={openModal}
          className="bg-white shadow-lg rounded-full p-2 hover:bg-gray-100 transition"
        >
          <FaInfo className="w-4 h-4 text-gray-600" />
        </button>
      </div>

      {isGuideModalOpen && (
        <GuideModal
          steps={GuideSteps}
          onClose={() => setIsGuideModalOpen(false)}
        />
      )}

      {isBombShopOpen && playerState && (
        <BombShop
          bomMapRef={bombMapRef}
          playerState={playerState}
          onClose={() => setIsBombShopOpen(false)}
          />
      )}
    </>
  )
}

export default BombGameComponent
