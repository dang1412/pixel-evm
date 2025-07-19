import { PointData } from 'pixi.js'
import { ActionType, MapItemType, MonsterState } from './types'
import { FaBomb, FaSkull, FaRocket, FaCrosshairs, FaFire, FaWalking } from 'react-icons/fa'

interface MonsterControlSelectProps {
  p: PointData
  monster: MonsterState
  onSelect: (index: number) => void
}

const actionOptions: { type: ActionType; icon: React.ReactNode; label: string }[] = [
  { type: ActionType.Move, icon: <FaWalking />, label: 'Move' },
  { type: ActionType.Shoot, icon: <FaCrosshairs />, label: 'Shoot' },
  { type: ActionType.FinalBlow, icon: <FaSkull />, label: 'Dead' },
  { type: ActionType.ShootRocket, icon: <FaRocket />, label: 'Rocket' },
  { type: ActionType.ShootFire, icon: <FaFire />, label: 'Fire' },
  { type: ActionType.ShootBomb, icon: <FaBomb />, label: 'Bomb' },
]

function isShowAction(hp: number, type: ActionType, num = 0) {
  if (type === ActionType.Move || type === ActionType.Shoot) return true

  if (type === ActionType.FinalBlow && hp === 1) return true

  return num > 0
}

const MonsterControlSelect: React.FC<MonsterControlSelectProps> = ({ p, onSelect, monster }) => {
  const rocket = monster.weapons[MapItemType.Rocket]
  const fire = monster.weapons[MapItemType.Fire]
  const bomb = monster.weapons[MapItemType.Bomb]
  const nums: any = {
    [ActionType.ShootRocket]: rocket,
    [ActionType.ShootFire]: fire,
    [ActionType.ShootBomb]: bomb,
  }
  return (
    <div
      className="absolute z-50 flex gap-1 bg-white rounded-lg shadow-lg p-1"
      style={{ left: p.x, top: p.y }}
    >
      {actionOptions.map((action, idx) => isShowAction(monster.hp, action.type, nums[action.type]) ? (
        <label
          key={idx}
          className={`flex flex-col items-center cursor-pointer p-1 rounded transition bg-gray-700 text-gray-300 hover:bg-gray-600`}
          onClick={() => onSelect(action.type)}
        >
          <span className='relative text-xl mb-1'>
            {action.icon}
            {nums[action.type] && <span
              className="absolute bottom-0 right-0 text-xs bg-gray-800 text-white rounded-full px-1"
              style={{ transform: 'translate(40%, 40%)' }}
            >
              {nums[action.type]}
            </span>}
          </span>
        </label>
      ): '')}
    </div>
  )
}

export default MonsterControlSelect