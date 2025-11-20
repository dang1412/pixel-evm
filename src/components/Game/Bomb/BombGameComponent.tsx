import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { FaSpinner } from 'react-icons/fa'

import { useNotification } from '@/providers/NotificationProvider'

import { BombMap } from './BombMap'
import { ScoreboardModal } from './ScoreBoardModal'
import { GameState, PlayerState } from './types'
import { FloatScoreTable } from './FloatScoreTable'
import BombSelect from './BombSelect'
import { BombShop } from './BombShop'
import BombMapComponent from './BombMapComponent'

interface Props {}

const BombGameComponent: React.FC<Props> = (props) => {
  const bombMapRef = useRef<BombMap | undefined>(undefined)

  const { notify, loading } = useNotification()

  const [ players, setPlayers ] = useState<PlayerState[]>([])
  const [ gameState, setGameState ] = useState<GameState>()

  const onBombMapReady = useCallback((bombMap: BombMap) => {
    bombMapRef.current = bombMap
    bombMap.onGameStateUpdated = (state) => setGameState(state)
    bombMap.onPlayersUpdated = (players) => setPlayers(players)
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
    </>
  )
}

export default BombGameComponent
