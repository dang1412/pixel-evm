import { useCallback, useEffect, useState } from 'react'

import { BombGameReplay } from './BombGameReplay'
import { GameLoop } from './constant'

interface Props {
  gameReplay: BombGameReplay
  maxRound: number
}

export const ReplayControl: React.FC<Props> = ({ gameReplay, maxRound }) => {
  const [round, setRound] = useState(1)
  const [currentFrame, setCurrentFrame] = useState(0)
  const [maxFrame, setMaxFrame] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)

  const handlePrevRound = useCallback(() => {
    if (round > 0) {
      const newRound = round - 1
      setRound(newRound)
      gameReplay.jumpToRound(newRound)
    }
  }, [round, gameReplay])

  const handleNextRound = useCallback(() => {
    if (round < maxRound) {
      const newRound = round + 1
      setRound(newRound)
      gameReplay.jumpToRound(newRound)
    }
  }, [round, maxRound, gameReplay])

  const handlePlayPause = useCallback(() => {
    gameReplay.setPause(isPlaying)
    setIsPlaying(!isPlaying)
  }, [isPlaying, gameReplay])

  const handleFrameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const frame = parseInt(e.target.value, 10)
    setCurrentFrame(frame)
    gameReplay.jumpToFrame(frame)
  }, [gameReplay])

  // Update current frame and max frame periodically
  useEffect(() => {
    const interval = setInterval(() => {
      const frame = gameReplay.getCurrentFrame()
      const max = gameReplay.getMaxFrame()
      const currentRound = gameReplay.getCurrentRound()
      setCurrentFrame(frame)
      setMaxFrame(max)
      setRound(currentRound)
      setIsPlaying(!gameReplay.isPaused())
    }, GameLoop)

    return () => clearInterval(interval)
  }, [gameReplay])

  return (
    <div className="replay-control bg-gray-800 text-white p-4 rounded-lg shadow-lg">
      {/* Round Control */}
      <div className="flex items-center justify-center gap-4 mb-4">
        <button
          onClick={handlePrevRound}
          disabled={round <= 1}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg transition-colors"
        >
          ← Prev Round
        </button>
        <span className="text-lg font-semibold min-w-[120px] text-center">
          Round {round} / {maxRound}
        </span>
        <button
          onClick={handleNextRound}
          disabled={round >= maxRound}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg transition-colors"
        >
          Next Round →
        </button>
      </div>

      {/* Play/Pause Control */}
      <div className="flex items-center justify-center mb-4">
        <button
          onClick={handlePlayPause}
          className="px-6 py-3 bg-green-600 hover:bg-green-700 rounded-lg transition-colors font-semibold"
        >
          {isPlaying ? '⏸ Pause' : '▶ Play'}
        </button>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-gray-400">
          <span>Frame: {currentFrame}</span>
          <span>Max: {maxFrame}</span>
        </div>
        <input
          type="range"
          min="0"
          max={maxFrame}
          value={currentFrame}
          onChange={handleFrameChange}
          className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
          style={{
            background: `linear-gradient(to right, #2563eb 0%, #2563eb ${(currentFrame / maxFrame) * 100}%, #374151 ${(currentFrame / maxFrame) * 100}%, #374151 100%)`
          }}
        />
      </div>
    </div>
  )
}