import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { FaSpinner } from 'react-icons/fa'
import { useSearchParams } from 'next/navigation'

import { useNotification } from '@/providers/NotificationProvider'

import { BombMap } from './BombMap'
import { ScoreboardModal } from './ScoreBoardModal'
import { GameState, PlayerState } from './types'
import { FloatScoreTable } from './FloatScoreTable'
import BombSelect from './BombSelect'
import { BombShop } from './BombShop'
import BombMapComponent from './BombMapComponent'
import { ReplayControl } from './ReplayControl'
import { BombGameReplay } from './BombGameReplay'

interface Props {}

const BombGameComponent: React.FC<Props> = (props) => {
  // const bombMapRef = useRef<BombMap | undefined>(undefined)

  const { notify, loading } = useNotification()

  const [ players, setPlayers ] = useState<PlayerState[]>([])
  const [ gameState, setGameState ] = useState<GameState>()
  const [ bombMap, setBombMap ] = useState<BombMap | null>(null)

  const onBombMapReady = useCallback((bombMap: BombMap) => {
    setBombMap(bombMap)
    bombMap.onGameStateUpdated = (state) => setGameState(state)
    bombMap.onPlayersUpdated = (players) => setPlayers(players)
  }, [])

  const [isScoreboardModalOpen, setIsScoreboardModalOpen] = useState(true)

  const playerId = bombMap?.playerId
  const playerState = useMemo(() => players.find(p => p.id === playerId), [players])

  useEffect(() => {
    if (!gameState || !playerId) return
    if (gameState.pausing) {
      setIsScoreboardModalOpen(true)
      if (gameState.round > 0) {
        if (gameState.roundEnded) {
          notify('Round ended. Wait for the new round.', 'info')
        } else {
          notify('Round paused.', 'info')
        }
      }
    } else {
      setIsScoreboardModalOpen(false)
      notify('Round is going! Place your bombs!', 'info')
    }
  }, [gameState?.pausing, playerId])

  const [isBombShopOpen, setIsBombShopOpen] = useState(false)

  const searchParams = useSearchParams()
  const replayGameId = searchParams.get('replayGameId')
  const replayGameRound = searchParams.get('round')

  const [gameReplay, setGameReplay] = useState<BombGameReplay | null>(null)

  // Game replay
  useEffect(() => {
    if (replayGameId && bombMap) {
      const gameReplay = bombMap.bombNetwork.createGameReplay()
      setGameReplay(gameReplay)
      setIsScoreboardModalOpen(false)
    }
  }, [replayGameId, replayGameRound, bombMap])

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
                onSelect={(type) => bombMap?.setBombType(type)}
                playerState={playerState}
                onOpenShop={() => setIsBombShopOpen(true)}
              />
            )}
          </div>
        </div>
      </div>

      {gameState && isScoreboardModalOpen && bombMap && (
        <ScoreboardModal
          bombMap={bombMap}
          players={players}
          playerId={playerId}
          gameState={gameState}
          replayGameId={ replayGameId || undefined }
          onClose={() => setIsScoreboardModalOpen(false)}
        />
      )}

      {isBombShopOpen && playerState && bombMap &&(
        <BombShop
          bombMap={bombMap}
          playerState={playerState}
          onClose={() => setIsBombShopOpen(false)}
          />
      )}

      {gameReplay && replayGameId && (
        <ReplayControl gameReplay={gameReplay} recordedHash={replayGameId} />
      )}
    </>
  )
}

export default BombGameComponent
