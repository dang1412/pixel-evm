import { useCallback } from 'react'
import { FaPlay, FaPause, FaForward, FaRedo, FaStepForward, FaCloudUploadAlt, FaSpinner } from 'react-icons/fa'

import { useNotification } from '@/providers/NotificationProvider'
import { BombGame } from './BombGame'

interface Props {
  game: BombGame
}

export const HostControlBar: React.FC<Props> = ({ game }) => {
  const { round, pausing, timeLeft } = game.state

  const { loading, setLoading, notify } = useNotification()

  const handlePlayPause = useCallback(() => {
    game.playPause()
  }, [game])

  const handleNextRound = useCallback(() => {
    game.nextRound()
  }, [game])

  const handleRestart = useCallback(() => {
    game.restart()
  }, [game])

  const handleUpload = useCallback(async () => {
    notify('Uploading recorded game...')
    setLoading(true)
    const cid = await game.uploadRecordedGame()
    setLoading(false)
    notify(`Recorded game uploaded successfully! CID: ${cid}`)
  }, [game, notify])

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

        {/* Upload Button */}
        <button
          onClick={handleUpload}
          disabled={loading || !game.state.roundEnded}
          title="Upload Recorded Game"
          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-blue-600"
        >
          {loading && <FaSpinner className='animate-spin text-blue-500 mr-1 inline' /> }
          <FaCloudUploadAlt className="text-sm" />
        </button>
      </div>
    </div>
  )
}