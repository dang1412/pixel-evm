import { useMemo, useState } from 'react'
import { FaBomb, FaRocket } from 'react-icons/fa'

import { BombType, PlayerState } from './types'

interface BombSelectProps {
  playerState: PlayerState
  onSelect: (bombType: BombType) => void
}

const bombTypes = [
  { type: BombType.Standard, icon: FaBomb, label: 'Standard Bomb' },
  { type: BombType.Atomic, icon: FaRocket, label: 'Atomic Bomb' },
]

const types = [BombType.Standard, BombType.Atomic]

function getRemainingBombs({ totalBombs, usedBombs }: PlayerState) {
  const remaining: { [type: number]: number } = {}
  for (const type of types) {
    remaining[type] = totalBombs[type] - usedBombs[type]
  }

  console.log('remaining', remaining)
  return remaining
}

const BombSelect = ({ playerState, onSelect }: BombSelectProps) => {
  const [selected, setSelected] = useState(BombType.Standard)

  const remainingBombs = useMemo(() => getRemainingBombs(playerState), [playerState])
  // const remainingBombs = getRemainingBombs(playerState)

  const handleSelect = (bombType: BombType) => {
    setSelected(bombType)
    onSelect(bombType)
  }

  return (
    <div className="flex space-x-1">
      {bombTypes.map((bomb) => {
        const Icon = bomb.icon
        return (
          <label
            key={bomb.type}
            className={`flex flex-col items-center p-1 rounded-lg cursor-pointer transition-all relative
              ${
                selected === bomb.type
                  ? 'bg-blue-100 border-2 border-blue-500'
                  : 'bg-gray-100 border-2 border-transparent hover:bg-gray-200'
              }`}
          >
            <input
              type="radio"
              name="bombType"
              value={bomb.type}
              checked={selected === bomb.type}
              onChange={() => handleSelect(bomb.type)}
              className="hidden"
            />
            <Icon className={`text-xl ${
              selected === bomb.type ? 'text-blue-500' : 'text-gray-600'
            }`} />
            <span className="absolute bottom-0 right-0 bg-gray-700/60 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
              {remainingBombs[bomb.type]}
            </span>
          </label>
        );
      })}
    </div>
  );
};

export default BombSelect;