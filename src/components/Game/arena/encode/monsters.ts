import { MapItemType, MonsterState, RTCMessageType } from '../types'
import { createEncodeItemsViewFunc, createEncodeItemsFunc, createDecodeItemsFunc, setRTCMessageType } from './common'

export const MonsterEncodeLength = 7

// Encode functions

// State that sends to client
// export interface MonsterState {
//   id: number  // 8bit
//   ownerId: number  // 4bit
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
  const { id, ownerId, type, hp, vehicle, pos, weapons } = monster

  view.setUint8(offset, id) // id 8bit
  view.setUint8(offset + 1, ownerId << 4 | type) // ownerId top 4bit and type bottom 4bit

  view.setUint8(offset + 2, hp << 4 | vehicle) // hp and vehicle in 4bit each

  view.setUint8(offset + 3, pos.x)
  view.setUint8(offset + 4, pos.y)
  // const posVal = xyToPosition(pos.x, pos.y)
  // view.setUint16(offset + 2, posVal) // pos 16bit

  const rocketCount = weapons[MapItemType.Rocket]
  const fireCount = weapons[MapItemType.Fire]
  const bombCount = weapons[MapItemType.Bomb]
  view.setUint8(offset + 5, rocketCount << 4 | fireCount) // weapons in 8bit

  view.setUint8(offset + 6, bombCount)

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
  const id = view.getUint8(offset)

  const val1 = view.getUint8(offset + 1)
  const ownerId = val1 >> 4 // top 4bit
  const type = val1 & 0xF // bottom 4bit

  const val2 = view.getUint8(offset + 2)
  const hp = val2 >> 4 // top 4bit
  const vehicle = val2 & 0xF // bottom 4bit

  const x = view.getUint8(offset + 3)
  const y = view.getUint8(offset + 4)
  const pos = { x, y }

  const val4 = view.getUint8(offset + 5)
  const rocketCount = val4 >> 4 // top 4bit
  const fireCount = val4 & 0xF // bottom 4bit

  const bombCount = view.getUint8(offset + 6)

  return {
    ownerId,
    id,
    type,
    hp,
    vehicle,
    pos,
    weapons: {
      [MapItemType.Rocket]: rocketCount,
      [MapItemType.Fire]: fireCount,
      [MapItemType.Bomb]: bombCount,
    }
  }
}

export const decodeMonstersData = createDecodeItemsFunc<MonsterState>(decodeMonsterView, MonsterEncodeLength)

export function encodeMonstersWithType(monsters: MonsterState[]): ArrayBuffer {
  const data = encodeMonsters(monsters)
  setRTCMessageType(data, RTCMessageType.MonsterStates)

  return data
}
