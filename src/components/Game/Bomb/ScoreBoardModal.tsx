import React, { useCallback, useEffect, useState } from 'react'
import { FaQrcode, FaTimes } from 'react-icons/fa'

import { BombType, GameState, PlayerState } from './types'
import { BombMap } from './BombMap'
import { useWebSocket } from '@/providers/WebsocketProvider'
import { BombGameMsg } from '@/providers/bombTypes'
import { ShareHostQr } from './ShareHostQr'
import { CountInput } from './CountInput'

interface ScoreboardModalProps {
  // hostName: string;
  bombMapRef: React.RefObject<BombMap | undefined>
  players: PlayerState[];
  playerId?: number;
  gameState: GameState;
  onClose: () => void;
}

/**
 * Renders a modal scoreboard displaying player states.
 * @param {object} props
 * @param {boolean} props.isOpen - Whether the modal should be visible.
 * @param {function} props.onClose - Function to call when the modal should be closed.
 * @param {Array<object>} props.players - Array of player state objects.
 */
export const ScoreboardModal: React.FC<ScoreboardModalProps> = (
  { 
    bombMapRef, players, playerId, gameState, onClose,
  }
) => {
  const [playerName, setPlayerName] = useState('')

  const isHost = bombMapRef.current?.bombNetwork.isHost() || false

  // join game
  const handleJoinGame = useCallback(() => {
    const name = playerName.trim()
    if (name) {
      bombMapRef.current?.bombNetwork.joinGame(name)
    }
  }, [playerName, bombMapRef])

  // start round
  const startRoundOrRestart = useCallback(() => {
    if (gameState.round < 5) {
      bombMapRef.current?.bombNetwork.getBombGame()?.startRound()
    } else {
      bombMapRef.current?.bombNetwork.getBombGame()?.restart()
    }
  }, [bombMapRef, gameState])

  const hostWsName = bombMapRef.current?.bombNetwork.hostWsName
  const myWsName = bombMapRef.current?.bombNetwork.myWsName
  const shareHostUrl = `https://pixelonbase.com/bomb?connectTo=${hostWsName}`

  const { send, subscribe } = useWebSocket()

  const [highScore, setHighScore] = useState(0)
  const [highScoreTime, setHighScoreTime] = useState('')
  const [highScoreRound, setHighScoreRound] = useState(gameState.round)

  // listen to bomb_game channel for high score updates
  useEffect(() => {
    const unsubscribe = subscribe('bomb-game', (payload) => {
      if (payload.type === 'high_score') {
        console.log('Top Ranks:', payload.score)
        setHighScore(payload.score.score)
        setHighScoreTime(new Date(payload.score.ts).toLocaleString())
      }
    })

    return unsubscribe
  }, [subscribe])

  // request high score update when round changes
  useEffect(() => {
    const bombGameMsg: BombGameMsg = { type: 'get_high_score', payload: { client: myWsName || '', round: highScoreRound } }
    send({ action: 'bomb_game', msg: bombGameMsg})
  }, [send, highScoreRound])

  const [showHostQr, setShowHostQr] = useState(false)

  return (
    // <!-- Modal Overlay -->
    <>
      <div
        className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4"
      >
        {/* <!-- Modal Content --> */}
        <div
          className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-2xl mx-auto overflow-hidden"
          onClick={(e) => e.stopPropagation()} // Prevent overlay click from triggering when clicking content
        >
          {/* <!-- Modal Header --> */}
          <div className="flex relative justify-between items-center p-5 border-b border-gray-200 dark:border-gray-700">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
                Scoreboard ({hostWsName})
                
              </h2>
              {gameState && (
                <p className="text-sm text-gray-500 dark:text-gray-300">
                  Round: {gameState.round} | ⏱️ {gameState.timeLeft}s
                </p>
              )}
            </div>
            {/* add button with FaQr */}
            <button
              onClick={() => setShowHostQr(true)}
              className="ml-3 flex items-center gap-1 px-3 py-1 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors rounded-lg"
              aria-label="Show Host QR Code"
            >
              <FaQrcode className="w-4 h-4" />
              <span>Share</span>
            </button>
            <button
              onClick={onClose}
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors rounded-full p-1"
              aria-label="Close modal"
            >
              <FaTimes />
            </button>
          </div>

          {/* <!-- Modal Body - Table --> */}
          <div className="p-4">
            <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-left">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                    >
                      Player
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                    >
                      Score
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                    >
                      Bombs
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                    >
                      Blast Radius
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white font-semibold dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {players.length > 0 ? (
                    players.map((player) => {
                      const isCurrentPlayer = player.id === playerId;
                      return (
                        <tr
                          key={player.id}
                          className={`${
                            isCurrentPlayer
                              ? 'bg-blue-100 dark:bg-blue-900' // Highlight class
                              : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                          }`}
                        >
                          <td
                            className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                              isCurrentPlayer
                                ? 'text-blue-900 dark:text-blue-100 font-bold'
                                : 'text-gray-900 dark:text-white'
                            }`}
                          >
                            {player.name}
                          </td>
                          <td
                            className={`px-6 py-4 whitespace-nowrap text-sm ${
                              isCurrentPlayer
                                ? 'text-blue-800 dark:text-blue-200'
                                : 'text-gray-500 dark:text-gray-300'
                            }`}
                          >
                            {player.score}
                          </td>
                          <td
                            className={`px-6 py-4 whitespace-nowrap text-sm ${
                              isCurrentPlayer
                                ? 'text-blue-800 dark:text-blue-200'
                                : 'text-gray-500 dark:text-gray-300'
                            }`}
                          >
                            {player.bombs[BombType.Standard]}/{player.bombs[BombType.Atomic]}
                          </td>
                          <td
                            className={`px-6 py-4 whitespace-nowrap text-sm ${
                              isCurrentPlayer
                                ? 'text-blue-800 dark:text-blue-200'
                                : 'text-gray-500 dark:text-gray-300'
                            }`}
                          >
                            {player.r}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-300"
                      >
                        No players found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
                  ({myWsName}) Highscore: <span className="font-bold text-blue-600 dark:text-blue-400">{highScore}</span>
                </p>
                <CountInput min={0} max={5} onChange={setHighScoreRound} />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {highScoreTime}
              </p>
            </div>
          </div>

          {/* <!-- Modal Footer --> */}
          <div className="flex justify-between items-center p-5 border-t border-gray-200 dark:border-gray-700">
            <div>
              {isHost && gameState.pausing && (
                <button
                  onClick={startRoundOrRestart}
                  className="px-4 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 font-semibold rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none transition-colors"
                >
                  {gameState.round === 0 ? 'Start' : gameState.round < 5 ? 'Next' : 'Restart'}
                </button>
              )}
            </div>

            {!playerId && <div className="flex items-center gap-2">
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Your name"
                className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white w-32 sm:w-auto"
                onKeyUp={(e) => {
                  if (e.key === 'Enter') {
                    handleJoinGame()
                  }
                }}
              />
              <button
                onClick={handleJoinGame}
                disabled={!playerName.trim()}
                className="px-4 py-2 text-sm bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed whitespace-nowrap"
              >
                Join
              </button>
            </div>}
          </div>
        </div>
      </div>
      {showHostQr && <ShareHostQr url={shareHostUrl} onClose={() => setShowHostQr(false)} />}
    </>
  )
}