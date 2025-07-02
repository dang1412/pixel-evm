import React, { useState } from 'react'
import { FaWalking, FaCrosshairs, FaBomb, FaFire } from 'react-icons/fa'
import { ActionType, MonsterState } from './types'
import { monsterInfos } from './constants'

type MonsterCardProps = {
  state: MonsterState
  actionType: ActionType
  onActionChange?: (action: ActionType) => void
}

// type MonsterAction = 'move' | 'shoot' | 'shootbomb' | 'shootfire'

const actionOptions: { type: ActionType; icon: React.ReactNode; label: string }[] = [
  { type: ActionType.Move, icon: <FaWalking />, label: 'Move' },
  { type: ActionType.Shoot, icon: <FaCrosshairs />, label: 'Shoot' },
  { type: ActionType.ShootBomb, icon: <FaBomb />, label: 'Bomb' },
  { type: ActionType.ShootFire, icon: <FaFire />, label: 'Fire' },
]

const MonsterCard: React.FC<MonsterCardProps> = ({
  state,
  actionType,
  onActionChange,
}) => {
  const { id, hp, pos } = state
  const name = `monster-${id}`

  // const [selectedAction, setSelectedAction] = useState(ActionType.Move)
  const imageUrl = monsterInfos[state.type]?.image || ''

  const handleActionChange = (action: ActionType) => {
    // setSelectedAction(action)
    onActionChange?.(action)
  }

  return (
    <div className='bg-gray-800 rounded-lg shadow-lg p-4 flex flex-col items-center w-52'>
      <img
        src={imageUrl}
        className='w-22 h-16 rounded-md mb-4 border-2 border-gray-700'
      />
      <div className='text-large font-bold text-white mb-2'>{name} ({pos.x}, {pos.y})</div>
      <div className='flex items-center mb-4'>
        <span className='text-green-400 font-semibold mr-2'>HP:</span>
        <span className='text-white'>{hp}</span>
      </div>
      <div className='flex space-x-2'>
        {actionOptions.map((option) => (
          <label
            key={option.type}
            className={`flex flex-col items-center cursor-pointer p-2 rounded transition
              ${
                actionType === option.type
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
          >
            <input
              type='radio'
              name='monster-action'
              value={option.type}
              checked={actionType === option.type}
              onChange={() => handleActionChange(option.type)}
              className='hidden'
            />
            <span className='text-xl mb-1'>{option.icon}</span>
            {/* <span className='text-xs'>{option.label}</span> */}
          </label>
        ))}
      </div>
    </div>
  )
}

export default MonsterCard