import { positionToXY, xyToPosition } from '../../utils'
import { ActionType, MapItemType, MonsterState } from '../types'
import { createEncodeItemsViewFunc, createEncodeItemsFunc, createDecodeItemsFunc } from './common'

export const MonsterEncodeLength = 5

// Encode functions

// State that sends to client
// export interface MonsterState {
//   id: number  // 4bit
//   type: MonsterType // 4bit
//   hp: number  // 4bit
//   vehicle: VehicleType  // 4bit
//   pos: PointData // 16bit
//   weapons: { // 8bit
//     [ActionType.ShootBomb]: number,
//     [ActionType.ShootFire]: number,
//   }
// }

export function encodeMonsterView(view: DataView, monster: MonsterState, offset = 0) {
  const { id, type, hp, vehicle, pos, weapons } = monster
  view.setUint8(offset, id << 4 | type) // id top 4bit and type bottom 4bit

  view.setUint8(offset + 1, hp << 4 | 0) // hp and vehicle in 4bit each

  const posVal = xyToPosition(pos.x, pos.y)
  view.setUint16(offset + 2, posVal) // pos 16bit

  const bombCount = weapons[MapItemType.Bomb]
  const fireCount = weapons[MapItemType.Fire]
  view.setUint8(offset + 4, bombCount << 4 | fireCount) // weapons in 8bit

  return MonsterEncodeLength
}

// export function encodeMonstersView(view: DataView, monsters: MonsterState[]): number {
//   view.setUint8(0, monsters.length)

//   let offset = 1
//   for (const monster of monsters) {
//     encodeMonsterView(view, monster, offset)
//     offset += MonsterEncodeLength
//   }

//   return offset
// }

const encodeMonstersView = createEncodeItemsViewFunc<MonsterState>(encodeMonsterView)
export const encodeMonsters = createEncodeItemsFunc<MonsterState>(encodeMonstersView, MonsterEncodeLength)

// Decode functions

export function decodeMonsterView(view: DataView, offset = 0): MonsterState {
  const val1 = view.getUint8(offset)
  const id = val1 >> 4 // top 4bit
  const type = val1 & 0xF // bottom 4bit

  const val2 = view.getUint8(offset + 1)
  const hp = val2 >> 4 // top 4bit
  const vehicle = val2 & 0xF // bottom 4bit

  const posVal = view.getUint16(offset + 2)
  const pos = positionToXY(posVal)

  const val4 = view.getUint8(offset + 4)
  const bombCount = val4 >> 4 // top 4bit
  const fireCount = val4 & 0xF // bottom 4bit

  return {
    ownerId: 1,
    id,
    type,
    hp,
    vehicle: undefined,
    pos,
    weapons: {
      [MapItemType.Bomb]: bombCount,
      [MapItemType.Fire]: fireCount,
    }
  }
}

export const decodeMonstersData = createDecodeItemsFunc<MonsterState>(decodeMonsterView, MonsterEncodeLength)
