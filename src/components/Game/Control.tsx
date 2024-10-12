import { ActionMode } from './adventures/Adventures'
import { FaGun } from 'react-icons/fa6'
import { FaRunning } from 'react-icons/fa'
import { useState } from 'react'

interface Props {
  onSetMode: (mode: ActionMode) => void
}

function getClass(selected: boolean) {
  const head = selected ? 'text-white bg-blue-700 hover:bg-blue-800' : 'text-blue-700 border border-blue-700 hover:bg-blue-700 hover:text-white'

  return `${head} font-medium rounded-lg p-2.5 text-center inline-flex items-center me-2`
}

export const MonsterControl: React.FC<Props> = ({ onSetMode }) => {

  const [mode, setMode] = useState(ActionMode.MOVE)

  const setMove = () => {
    setMode(ActionMode.MOVE)
    onSetMode(ActionMode.MOVE)
  }

  const setShoot = () => {
    setMode(ActionMode.SHOOT)
    onSetMode(ActionMode.SHOOT)
  }

  return (
    <div className='flex fixed bottom-2 left-2'>
      <button
        type="button"
        className={getClass(mode === ActionMode.MOVE)}
        onClick={setMove}
      >
        <FaRunning className='w-12 h-12' />
      </button>
      <button 
        type="button"
        className={getClass(mode === ActionMode.SHOOT)}
        onClick={setShoot}
      >
        <FaGun className='w-12 h-12' />
      </button>
    </div>
  )
}
