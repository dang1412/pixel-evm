import React, { useEffect, useMemo, useRef, useState } from 'react'
import { FaBomb, FaRocket, FaFire, FaEye, FaTimes, FaOptinMonster } from 'react-icons/fa'
import { MapItemType, MonsterState, MonsterType } from './types'
import { monsterInfos } from './constants'
import { PointData } from 'pixi.js'

type MonsterCardProps = {
  monsters: MonsterState[]
  selectedMonsterId: number
  // actionType: ActionType
  onSelectMonster: (id: number) => void
}

const actionOptions: { type: MapItemType.Bomb | MapItemType.Fire | MapItemType.Rocket; icon: React.ReactNode; label: string }[] = [
  // { type: ActionType.Move, icon: <FaWalking />, label: 'Move' },
  // { type: ActionType.Shoot, icon: <FaCrosshairs />, label: 'Shoot' },
  { type: MapItemType.Rocket, icon: <FaRocket />, label: 'Rocket' },
  { type: MapItemType.Fire, icon: <FaFire />, label: 'Fire' },
  { type: MapItemType.Bomb, icon: <FaBomb />, label: 'Bomb' },
]

const emptyMonster: MonsterState = {
  ownerId: 0,
  vehicle: MapItemType.None,
  id: 0, hp: 0, pos: { x: 0, y: 0 } as PointData,
  weapons: { [MapItemType.Rocket]: 0, [MapItemType.Fire]: 0, [MapItemType.Bomb]: 0 },
  type: MonsterType.Axie,
}

const MonsterCard: React.FC<MonsterCardProps> = ({
  monsters,
  selectedMonsterId,
  onSelectMonster,
}) => {
  const selectedMonster = useMemo(() => monsters.find(m => m.id === selectedMonsterId), [monsters, selectedMonsterId])
  const { id, hp, pos, weapons } = selectedMonster || emptyMonster
  const name = `monster-${id}`
  // const imageUrl = monsterInfos[state.type]?.image || ''

  const [isVisible, setIsVisible] = useState(true)

  // const handleActionChange = (action: ActionType) => {
  //   onActionChange?.(action)
  // }

  const toggleVisibility = () => {
    setIsVisible((prev) => !prev)
  }

  const imageRefs = useRef<(HTMLImageElement | null)[]>([])

  useEffect(() => {
    const idx = monsters.findIndex(m => m.id === selectedMonsterId)
    if (idx !== -1 && imageRefs.current[idx]) {
      imageRefs.current[idx]?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
    }
  }, [selectedMonsterId, monsters])

  const setImageRef = (idx: number, el: HTMLImageElement | null) => {
    imageRefs.current[idx] = el
  }

  return (
    <div>
      {!isVisible && <FaOptinMonster
        onClick={toggleVisibility}
        className="text-gray-700 cursor-pointer mb-1 text-2xl flex items-center justify-center"
        aria-label="Show"
      />}
      {isVisible && (
        <div className='bg-gray-800 rounded-lg shadow-lg p-4 flex flex-col items-center w-52'>
          <FaTimes
            className="absolute top-1 right-1 bg-gray-700 text-white rounded-full p-1 hover:bg-gray-600 z-10 cursor-pointer"
            onClick={toggleVisibility}
            aria-label="Close"
            size={20}
          />
          <div className='w-full overflow-x-auto'>
            <div className='flex flex-row space-x-2'>
              {monsters.map((m, idx) => (
                <img
                  key={idx}
                  ref={el => setImageRef(idx, el)}
                  src={monsterInfos[m.type].image}
                  className={`w-22 h-16 rounded-md mb-4 border-2 flex-shrink-0 cursor-pointer ${
                    m.id === selectedMonsterId ? 'border-blue-500' : 'border-gray-700'
                  }`}
                  onClick={() => onSelectMonster(m.id)}
                />
              ))}
            </div>
          </div>
          <div className='text-large font-bold text-white mb-2'>
            {name} ({pos.x}, {pos.y})
          </div>
          <div className='flex items-center mb-4'>
            <span className='text-green-400 font-semibold mr-2'>HP:</span>
            <span className='text-white'>{hp}</span>
          </div>
          <div className='flex space-x-2'>
            {actionOptions.map((option) => (
              <label
                key={option.type}
                className={`flex flex-col items-center cursor-pointer p-2 rounded transition bg-gray-700 text-gray-300 hover:bg-gray-600`}
              >
                {/* <input
                  type='radio'
                  name='monster-action'
                  value={option.type}
                  checked={actionType === option.type}
                  onChange={() => handleActionChange(option.type)}
                  className='hidden'
                /> */}
                <span className='relative text-xl mb-1'>
                  {option.icon}
                  {weapons[option.type] > 0 && <span className="absolute -bottom-1 -right-1 bg-blue-500 text-white text-xs rounded-full px-1">
                    {weapons[option.type]}
                  </span>}
                </span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default MonsterCard