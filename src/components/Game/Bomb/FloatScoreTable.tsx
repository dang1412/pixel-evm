import { useMemo } from 'react'

import { GameState, PlayerState } from './types'
import { CountDown } from './CountDown'

interface Props {
  gameState: GameState
  players: PlayerState[]
  playerId?: number
  onExpandClick?: () => void
}

export const FloatScoreTable: React.FC<Props> = ({ gameState, players, playerId, onExpandClick }) => {
  const sortedPlayers = useMemo(() => players.sort((a, b) => b.score - a.score), [players])
  const top3 = useMemo(() => sortedPlayers.slice(0, 3), [sortedPlayers])

  const currentPlayerIndex = useMemo(
    () => playerId ? sortedPlayers.findIndex(p => p.id === playerId) : -1,
    [sortedPlayers, playerId]
  )

  const currentPlayer = useMemo(() => sortedPlayers[currentPlayerIndex], [sortedPlayers, currentPlayerIndex])

  const isOutTop3 = currentPlayerIndex > 2

  return (
    <>
      <div className="text-sm bg-white/80 shadow-lg rounded-lg p-2 min-w-[150px] pointer-events-none">
        <div className="flex text-sm justify-between items-center mb-2 border-b pb-2">
          <span className='font-semibold'>Round {gameState.round}</span>
          {/* <div className='font-semibold'>⏱️ {gameState.timeLeft}s</div> */}
          <CountDown time={gameState.timeLeft} isPaused={gameState.pausing} />
          {onExpandClick && (
            <button 
              onClick={onExpandClick}
              className="pointer-events-auto hover:bg-gray-200 rounded p-1 transition-colors"
              aria-label="Expand score table"
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                width="16" 
                height="16" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              >
                <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>
              </svg>
            </button>
          )}
        </div>

        <div className="space-y-2 font-medium">
          {top3.map((player, index) => (
            <div 
              key={player.id}
              className={`flex justify-between items-center p-1 ${
                player.id === playerId ? 'bg-blue-100 rounded' : ''
              }`}
            >
              <div className="flex items-center">
                {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                <span className="truncate">{index + 1}</span>
              </div>
              <div className="font-medium">{player.name}</div>
              <div className="font-medium">{player.score || 0}</div>
            </div>
          ))}

          {/* Current player outside top 3 */}
          {isOutTop3 && (
            <>
              <div className="my-2 border-t"></div>
              <div className="flex justify-between items-center bg-blue-100 rounded p-1">
                <div className="flex items-center gap-1">
                  <span className="truncate">{currentPlayerIndex + 1}</span>
                </div>
                <div className="font-medium">{currentPlayer.name}</div>
                <div className="font-medium">{currentPlayer.score || 0}</div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  )
}