import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { FaSpinner } from 'react-icons/fa'
import { useSearchParams } from 'next/navigation'

import { useNotification } from '@/providers/NotificationProvider'
import { IPFSService } from '@/lib/webRTC/IPFSService'

import { BombMap } from './BombMap'
import { ScoreboardModal } from './ScoreBoardModal'
import { GameState, PlayerState, RecordedGame } from './types'
import { FloatScoreTable } from './FloatScoreTable'
import BombSelect from './BombSelect'
import { BombShop } from './BombShop'
import BombMapComponent from './BombMapComponent'
import { ReplayControl } from './ReplayControl'
import { BombGameReplay } from './BombGameReplay'

async function loadGameData(hash: string): Promise<RecordedGame> {
  // load from ipfs
  const ipfsService = IPFSService.getInstance()
  const gameData = await ipfsService.fetch<RecordedGame>(hash)
  return gameData
}

interface Props {}

const BombGameComponent: React.FC<Props> = (props) => {
  const bombMapRef = useRef<BombMap | undefined>(undefined)

  const { notify, loading } = useNotification()

  const [ players, setPlayers ] = useState<PlayerState[]>([])
  const [ gameState, setGameState ] = useState<GameState>()
  const [ isBombMapReady, setIsBombMapReady ] = useState(false)

  const onBombMapReady = useCallback((bombMap: BombMap) => {
    bombMapRef.current = bombMap
    bombMap.onGameStateUpdated = (state) => setGameState(state)
    bombMap.onPlayersUpdated = (players) => setPlayers(players)
    setIsBombMapReady(true)
  }, [])

  const [isScoreboardModalOpen, setIsScoreboardModalOpen] = useState(true)

  const playerId = bombMapRef.current?.playerId
  const playerState = useMemo(() => players.find(p => p.id === playerId), [players])

  useEffect(() => {
    if (!gameState || !playerId) return
    if (gameState.pausing) {
      setIsScoreboardModalOpen(true)
      if (gameState.round > 0) {
        notify('Round ended. Wait for the new round.', 'info')
      }
    } else {
      setIsScoreboardModalOpen(false)
      notify('Round started! Place your bombs!', 'info')
    }
  }, [gameState?.pausing, playerId])

  const [isBombShopOpen, setIsBombShopOpen] = useState(false)

  const searchParams = useSearchParams()
  const replayGameId = searchParams.get('replayGameId')
  const replayGameRound = searchParams.get('round')

  const [gameReplay, setGameReplay] = useState<BombGameReplay | null>(null)

  // Game replay
  useEffect(() => {
    if (replayGameId && isBombMapReady) {
      const bombMap = bombMapRef.current
      if (bombMap) {
        const gameReplay = bombMap.bombNetwork.createGameReplay()
        setGameReplay(gameReplay)
        setIsScoreboardModalOpen(false)
        // load data from json
        loadGameData(replayGameId).then((data) => {
          console.log('Loaded game data:', data)
          gameReplay.setRecordedGame(data)
          gameReplay.jumpToRound(Number(replayGameRound) || 1)
          gameReplay.setPause(false)
        })
      }
    }
  }, [replayGameId, replayGameRound, isBombMapReady])

  return (
    <>
      <BombMapComponent onBombMapReady={onBombMapReady} />

      <div className='w-full absolute top-16 flex justify-end pointer-events-none px-4'>
        <div className="flex flex-col items-end space-y-2">
          {gameState && (
            <FloatScoreTable
              gameState={gameState}
              players={players}
              playerId={playerId}
              onExpandClick={() => setIsScoreboardModalOpen(true)}
            />
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

      {gameState && isScoreboardModalOpen && (
        <ScoreboardModal
          bombMapRef={bombMapRef}
          players={players}
          playerId={playerId}
          gameState={gameState}
          onClose={() => setIsScoreboardModalOpen(false)}
        />
      )}

      {isBombShopOpen && playerState && (
        <BombShop
          bombMapRef={bombMapRef}
          playerState={playerState}
          onClose={() => setIsBombShopOpen(false)}
          />
      )}

      {gameReplay && (
        <div>
          <ReplayControl gameReplay={gameReplay} maxRound={5} />
        </div>
      )}
    </>
  )
}

export default BombGameComponent
