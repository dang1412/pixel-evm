import { useState } from 'react'
import { FaBomb, FaRocket } from 'react-icons/fa'

import { BombType } from './types'

interface BombSelectProps {
  onSelect: (bombType: BombType) => void
}

const bombTypes = [
  { type: BombType.Standard, icon: FaBomb, label: 'Standard Bomb' },
  { type: BombType.Atomic, icon: FaRocket, label: 'Atomic Bomb' },
]

const BombSelect = ({ onSelect }: BombSelectProps) => {
  const [selected, setSelected] = useState(BombType.Standard);

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
            className={`flex flex-col items-center p-1 rounded-lg cursor-pointer transition-all
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
          </label>
        );
      })}
    </div>
  );
};

export default BombSelect;