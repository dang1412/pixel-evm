import { useMemo } from 'react'

import { GameState, PlayerState } from './types'

interface Props {
  gameState: GameState
  players: PlayerState[]
  playerId?: number
}

export const FloatScoreTable: React.FC<Props> = ({ gameState, players, playerId }) => {
  const sortedPlayers = useMemo(() => players.sort((a, b) => b.score - a.score), [players])
  const top3 = useMemo(() => sortedPlayers.slice(0, 3), [sortedPlayers])

  const currentPlayerIndex = useMemo(
    () => playerId ? sortedPlayers.findIndex(p => p.id === playerId) : -1,
    [sortedPlayers, playerId]
  )

  const currentPlayer = useMemo(() => sortedPlayers[currentPlayerIndex], [sortedPlayers, currentPlayerIndex])

  const isOutTop3 = currentPlayerIndex > 2

  return (
    <div className="absolute text-sm top-16 right-2 bg-white/90 backdrop-blur-sm shadow-lg rounded-lg p-4 min-w-[150px]">
      <div className="flex text-sm justify-between items-center mb-2 border-b pb-2">
        <div><span className='font-semibold'>Round</span> {gameState.round}</div>
        <div className='font-semibold'>⏱️ {gameState.timeLeft / 1000}s</div>
      </div>
      
      <div className="space-y-2 font-medium">
        {top3.map((player, index) => (
          <div 
            key={player.id}
            className={`flex justify-between items-center ${
              player.id === playerId ? 'bg-blue-100 rounded p-1' : ''
            }`}
          >
            <div className="flex items-center">
              {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
              <span className="truncate">{index + 1}</span>
            </div>
            <div className="font-medium">{player.id}</div>
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
              <div className="font-medium">{currentPlayer.score || 0}</div>
            </div>
          </>
        )}
      </div>

      {/* Show current player if not in top 3 */}
      {/* {playerId && !players
        .sort((a, b) => (b.score || 0) - (a.score || 0))
        .slice(0, 3)
        .find(p => p.id === playerId) && (
        <>
          <div className="my-2 border-t"></div>
          <div className="flex justify-between items-center bg-blue-100 rounded p-1">
            <div className="flex items-center gap-2">
              <span className="truncate">{playerId}</span>
            </div>
            <div className="font-medium">{score || 0}</div>
          </div>
        </>
      )} */}

      {/* {loading && (
        <div className="absolute inset-0 bg-white/50 flex items-center justify-center">
          <FaSpinner size={24} className="animate-spin text-blue-500" />
        </div>
      )} */}
    </div>
  )
}