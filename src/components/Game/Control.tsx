import { FaGun } from 'react-icons/fa6'
import { FaConnectdevelop, FaRunning } from 'react-icons/fa'
import { useState } from 'react'
import clsx from 'clsx'

import { ActionMode } from './adventures/Adventures'

interface Props {
  onSetMode: (mode: ActionMode) => void
  openConnectInfo: () => void
}

function getClass(selected: boolean) {
  const head = selected ? 'text-white bg-blue-700 ' : 'text-blue-700 border border-blue-700'

  return head
}

export const MonsterControl: React.FC<Props> = ({ onSetMode, openConnectInfo }) => {

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
    <div className='fixed flex w-full justify-between items-center bottom-0 p-2'>
      <div className="flex space-x-2">
        <button
          type="button"
          className={clsx(getClass(mode === ActionMode.MOVE), 'font-medium rounded-lg p-2 hover:bg-blue-700 hover:text-white')}
          onClick={setMove}
        >
          <FaRunning className='w-8 h-8' />
        </button>
        <button
          type="button"
          className={clsx(getClass(mode === ActionMode.SHOOT), 'font-medium rounded-lg p-2 hover:bg-blue-700 hover:text-white')}
          onClick={setShoot}
        >
          <FaGun className='w-8 h-8' />
        </button>
      </div>
      <div className="flex space-x-2">
        <button 
          type="button"
          className="font-medium rounded-lg p-2"
          onClick={openConnectInfo}
        >
          <FaConnectdevelop className='w-6 h-6' />
        </button>
      </div>
    </div>
  )
}
