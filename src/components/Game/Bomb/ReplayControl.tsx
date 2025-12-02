import { FaPause, FaPlay, FaStepBackward, FaStepForward } from 'react-icons/fa'
import { useCallback, useEffect, useState } from 'react'

import { IPFSService } from '@/lib/webRTC/IPFSService'
import { useNotification } from '@/providers/NotificationProvider'

import { BombGameReplay } from './BombGameReplay'
import { GameLoop } from './constant'
import { RecordedGame } from './types'

interface Props {
  gameReplay: BombGameReplay
  recordedHash: string
}

async function loadGameData(hash: string): Promise<RecordedGame> {
  // load from ipfs
  const ipfsService = IPFSService.getInstance()
  const gameData = await ipfsService.fetch<RecordedGame>(hash)
  return gameData
}

export const ReplayControl: React.FC<Props> = ({ gameReplay, recordedHash }) => {
  const [round, setRound] = useState(1)
  const [maxRound, setMaxRound] = useState(1)
  const [currentFrame, setCurrentFrame] = useState(0)
  const [maxFrame, setMaxFrame] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)

  const { setLoading, loading } = useNotification()

  useEffect(() => {
    if (recordedHash) {
      setLoading(true)
      loadGameData(recordedHash).then((data) => {
        console.log('Loaded game data for replay:', data)
        gameReplay.setRecordedGame(data)
        setMaxRound(Math.max(...Object.keys(data.data).map(k => Number(k))))
        gameReplay.jumpToRound(1)
        gameReplay.setPause(false)
        setLoading(false)
      })
    }
  }, [recordedHash, gameReplay])

  const handlePrevRound = useCallback(() => {
    if (round > 1) {
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
    const isAtEnd = currentFrame >= maxFrame && maxFrame > 0
    if (isAtEnd) {
      // Replay current round from beginning
      gameReplay.jumpToRound(round)
      gameReplay.setPause(false)
      setIsPlaying(true)
    } else {
      gameReplay.setPause(isPlaying)
      setIsPlaying(!isPlaying)
    }
  }, [isPlaying, gameReplay, currentFrame, maxFrame, round])

  const handleFrameChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const frame = parseInt(e.target.value, 10)
      setCurrentFrame(frame)
      gameReplay.jumpToFrame(frame)
    },
    [gameReplay],
  )

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFrame(gameReplay.getCurrentFrame())
      setMaxFrame(gameReplay.getMaxFrame())
      setRound(gameReplay.getCurrentRound())
      setIsPlaying(!gameReplay.isPaused())
    }, GameLoop)

    return () => clearInterval(interval)
  }, [gameReplay])

  const progressPercentage = maxFrame > 0 ? (currentFrame / maxFrame) * 100 : 0
  const isAtEnd = currentFrame >= maxFrame && maxFrame > 0

  return (
    <div className="absolute bottom-2 left-1/2 w-[98%] -translate-x-1/2 rounded-lg border border-gray-700/30 bg-gray-900/40 p-2 text-white shadow-lg sm:bottom-4 sm:w-[95%] sm:rounded-xl sm:border-gray-700/50 sm:bg-gradient-to-b sm:from-gray-900/70 sm:to-gray-950/75 sm:p-3 sm:shadow-2xl sm:backdrop-blur-md md:w-auto md:min-w-[650px] md:border-gray-700/20 md:bg-gray-900/20 md:p-2 md:backdrop-blur-none lg:min-w-[750px]">
      <div className={`flex items-center gap-1.5 sm:gap-3 transition-opacity ${loading ? 'opacity-50 pointer-events-none' : ''}`}>
        {/* Round Controls */}
        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          <button
            onClick={handlePrevRound}
            disabled={loading || round <= 1}
            className="group rounded-md bg-gray-800/40 p-1.5 transition-all hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-40 sm:rounded-lg sm:bg-gray-800/50 sm:p-2.5 md:p-3"
            aria-label="Previous round"
          >
            <FaStepBackward size={14} className="text-gray-300 transition-colors group-hover:text-white sm:text-base md:text-lg" />
          </button>
          <div className="flex min-w-[60px] flex-col items-center justify-center rounded-md bg-gray-800/40 px-1.5 py-1 sm:min-w-[85px] sm:rounded-lg sm:bg-gray-800/50 sm:px-3 sm:py-2 md:min-w-[100px]">
            <span className="text-[9px] text-gray-400 sm:text-xs">ROUND</span>
            <span className="text-xs font-bold sm:text-base md:text-lg">
              {loading ? '-' : round}<span className="text-gray-500">/{loading ? '-' : maxRound}</span>
            </span>
          </div>
          <button
            onClick={handleNextRound}
            disabled={loading || round >= maxRound}
            className="group rounded-md bg-gray-800/40 p-1.5 transition-all hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-40 sm:rounded-lg sm:bg-gray-800/50 sm:p-2.5 md:p-3"
            aria-label="Next round"
          >
            <FaStepForward size={14} className="text-gray-300 transition-colors group-hover:text-white sm:text-base md:text-lg" />
          </button>
        </div>

        {/* Play/Pause Control */}
        <button
          onClick={handlePlayPause}
          disabled={loading}
          className="group relative shrink-0 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 p-2.5 shadow-md transition-all hover:scale-105 hover:from-blue-400 hover:to-blue-500 hover:shadow-xl active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 sm:p-3.5 sm:shadow-lg md:p-4"
          aria-label={isAtEnd ? 'Replay' : isPlaying ? 'Pause' : 'Play'}
        >
          <div className="absolute inset-0 rounded-full bg-white/20 opacity-0 transition-opacity group-hover:opacity-100" />
          {isPlaying && !isAtEnd ? (
            <FaPause size={16} className="relative z-10 sm:text-xl md:text-2xl" />
          ) : (
            <FaPlay size={16} className="relative z-10 ml-0.5 sm:text-xl md:text-2xl" />
          )}
        </button>

        {/* Progress Bar */}
        <div className="flex min-w-0 flex-1 items-center gap-1.5 sm:gap-2">
          <span className="min-w-[32px] shrink-0 text-right text-[10px] font-medium text-gray-400 sm:min-w-[40px] sm:text-xs">
            {loading ? '-' : currentFrame}
          </span>
          <div className="relative h-1.5 min-w-0 flex-1 sm:h-2.5 md:h-3">
            {/* Background track */}
            <div className="pointer-events-none absolute left-0 top-0 h-full w-full rounded-full bg-gray-800/60 shadow-inner sm:bg-gray-800" />
            {/* Progress fill */}
            <div
              className="pointer-events-none absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-400 shadow-md transition-all"
              style={{ width: `${progressPercentage}%` }}
            />
            {/* Range input */}
            <input
              type="range"
              min="0"
              max={maxFrame}
              value={currentFrame}
              onChange={handleFrameChange}
              disabled={loading}
              className="absolute h-full w-full cursor-pointer appearance-none bg-transparent disabled:cursor-not-allowed [&::-moz-range-thumb]:h-3.5 [&::-moz-range-thumb]:w-3.5 [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:bg-blue-500 [&::-moz-range-thumb]:shadow-lg [&::-moz-range-thumb]:transition-transform [&::-moz-range-thumb]:hover:scale-125 [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:bg-blue-500 [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:hover:scale-125 sm:[&::-moz-range-thumb]:h-5 sm:[&::-moz-range-thumb]:w-5 sm:[&::-webkit-slider-thumb]:h-5 sm:[&::-webkit-slider-thumb]:w-5 md:[&::-moz-range-thumb]:h-6 md:[&::-moz-range-thumb]:w-6 md:[&::-webkit-slider-thumb]:h-6 md:[&::-webkit-slider-thumb]:w-6"
              aria-label="Seek timeline"
            />
          </div>
          <span className="min-w-[32px] shrink-0 text-left text-[10px] font-medium text-gray-400 sm:min-w-[40px] sm:text-xs">
            {loading ? '-' : maxFrame}
          </span>
        </div>
      </div>
    </div>
  )
}