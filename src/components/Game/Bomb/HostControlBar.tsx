import { useCallback } from 'react'
import { BombGame } from './BombGame'
import { FaPlay, FaPause, FaForward, FaRedo, FaStepForward } from 'react-icons/fa'

interface Props {
  game: BombGame
}

export const HostControlBar: React.FC<Props> = ({ game }) => {
  const { round, pausing, timeLeft } = game.state

  const handlePlayPause = useCallback(() => {
    game.playPause()
  }, [game])

  const handleNextRound = useCallback(() => {
    game.nextRound()
  }, [game])

  const handleRestart = useCallback(() => {
    game.restart()
  }, [game])

  return (
    <div className="w-full border-t border-gray-300 bg-white">
      <div className="flex items-center justify-center gap-3 px-6 py-2">
        {/* Play/Pause Button */}
        <button
          onClick={handlePlayPause}
          disabled={game.state.timeLeft === 0}
          title={pausing ? "Play" : "Pause"}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-700 text-sm font-medium rounded transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-gray-200"
        >
          {pausing ? (
            <>
              <FaPlay className="text-sm" />
            </>
          ) : (
            <>
              <FaPause className="text-sm" />
            </>
          )}
        </button>

        {/* Next Round Button */}
        <button
          onClick={handleNextRound}
          disabled={!game.canGoNextRound()}
          title="Next Round"
          className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-700 text-sm font-medium rounded transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-gray-200"
        >
          <FaStepForward className="text-sm" />
        </button>

        {/* Restart Button */}
        <button
          onClick={handleRestart}
          disabled={!pausing || (round === 1 && timeLeft === 100)}
          title="Restart"
          className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-red-600"
        >
          <FaRedo className="text-sm" />
        </button>
      </div>
    </div>
  )
}