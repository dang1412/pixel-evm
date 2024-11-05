import { position10ToXY, positionToXY, xyToPosition, xyToPosition10 } from '../../utils'
import { getMonsterPixels } from '../gamelogic/utils'
import { AdventureStates, MonsterState } from '../types'

export const encodeMonsterStateByteLen = 7

export function encodeMonstersView(view: DataView, monsters: MonsterState[]): number {
  view.setUint8(0, monsters.length)

  let offset = 1
  for (const { id, hp, type, target: {x: tx, y: ty}, pos: {x: px, y: py} } of monsters) {
    view.setUint8(offset, id) // id 8bit
    view.setUint8(offset + 1, ((hp & 0x0F) << 4) | type & 0x0F) // hp: 4bit ,type: 4bit
    view.setUint16(offset + 2, xyToPosition(tx, ty)) // target: 16bit

    const pos = xyToPosition10(px, py)
    view.setUint16(offset + 4, pos >> 8) // pos top 16bit
    view.setUint8(offset + 6, pos & 0xFF) // pos bottom 8bit

    offset += encodeMonsterStateByteLen
  }

  return offset
}

export function decodeMonstersView(view: DataView): MonsterState[] {
  const monsters: MonsterState[] = []

  const len = view.getUint8(0)
  let offset = 1
  for (let i = 0; i < len; i++) {
    const id = view.getUint8(offset) // id 8bit
    const val2 = view.getUint8(offset + 1) // 1byte hp and type
    const target = view.getUint16(offset + 2) // target 16bit

    const val3 = view.getUint16(offset + 4) // pos top 16bit
    const val4 = view.getUint8(offset + 6) // pos bottom 8bit
    const pos = val3 << 8 | val4  // pos

    offset += encodeMonsterStateByteLen

    monsters.push({
      id,
      hp: val2 >> 4,
      type: val2 & 0x0F,
      target: positionToXY(target),
      pos: position10ToXY(pos)
    })
  }

  return monsters
}

export function encodeStates(states: AdventureStates): ArrayBuffer {
  const monsters = Object.values(states.monsters)
  const buffer = new ArrayBuffer(1 + monsters.length * encodeMonsterStateByteLen)
  const view = new DataView(buffer)

  encodeMonstersView(view, monsters)

  return buffer
}

export function decodeStates(data: ArrayBuffer): AdventureStates {
  const states: AdventureStates = { posMonster: {}, monsters: {}, coverPixels: {} }

  const view = new DataView(data)
  const monsters = decodeMonstersView(view)

  for (const monster of monsters) {
    states.monsters[monster.id] = monster
    const coverPixels = getMonsterPixels(monster.pos.x, monster.pos.y, monster.type)
    states.coverPixels[monster.id] = coverPixels
    for (const pixel of coverPixels) {
      states.posMonster[pixel] = [monster.id]
    }
  }

  return states
}
