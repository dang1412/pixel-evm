import { PointData } from 'pixi.js'
import { ActionType } from './types'
import { FaBomb, FaCrosshairs, FaFire, FaWalking } from 'react-icons/fa'

interface MonsterControlSelectProps {
  p: PointData
  onSelect: (index: number) => void
}

const actionOptions: { type: ActionType; icon: React.ReactNode; label: string }[] = [
  { type: ActionType.Move, icon: <FaWalking />, label: 'Move' },
  { type: ActionType.Shoot, icon: <FaCrosshairs />, label: 'Shoot' },
  { type: ActionType.ShootBomb, icon: <FaBomb />, label: 'Bomb' },
  { type: ActionType.ShootFire, icon: <FaFire />, label: 'Fire' },
]

// const icons = [
//   // Replace with your preferred SVGs or icon components
//   (
//     <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
//       <path d="M12 4v16m8-8H4" />
//     </svg>
//   ),
//   (
//     <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
//       <circle cx="12" cy="12" r="10" />
//     </svg>
//   ),
//   (
//     <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
//       <rect x="4" y="4" width="16" height="16" rx="2" />
//     </svg>
//   ),
//   (
//     <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
//       <polygon points="12,2 22,22 2,22" />
//     </svg>
//   ),
// ]

const MonsterControlSelect: React.FC<MonsterControlSelectProps> = ({ p, onSelect }) => {
  return (
    <div
      className="absolute z-50 flex gap-1 bg-white rounded-lg shadow-lg p-1"
      style={{ left: p.x, top: p.y }}
    >
      {actionOptions.map((action, idx) => (
        // <button
        //   key={idx}
        //   className="p-2 rounded-full hover:bg-gray-200 transition-colors"
        //   onClick={() => onSelect?.(idx)}
        //   type="button"
        // >
        //   {action.icon}
        // </button>
        <label
          key={idx}
          className={`flex flex-col items-center cursor-pointer p-1 rounded transition bg-gray-700 text-gray-300 hover:bg-gray-600`}
          onClick={() => onSelect(action.type)}
        >
          <span className='relative text-xl mb-1'>
            {action.icon}
          </span>
        </label>
      ))}
    </div>
  )
}

export default MonsterControlSelect