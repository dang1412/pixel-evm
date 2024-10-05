import { AdventureStates, MonsterState } from '../types'

export function encodeMonstersView(view: DataView, monsters: MonsterState[]): number {
  view.setUint8(0, monsters.length)

  let offset = 1
  for (const { id, hp, type, pos } of monsters) {
    view.setUint8(offset, id)
    view.setUint8(offset + 1, ((hp & 0x0F) << 4) | type & 0x0F)
    view.setUint16(offset + 2, pos)
    offset += 4
  }

  return offset
}

export function decodeMonstersView(view: DataView): MonsterState[] {
  const monsters: MonsterState[] = []

  const len = view.getUint8(0)
  for (let i = 0; i < len; i++) {
    const id = view.getUint8(1 + i * 4) // 1byte
    const val2 = view.getUint8(2 + i * 4) // 1byte
    const pos = view.getUint16(3 + i * 4) // 2bytes
    monsters.push({
      id,
      hp: val2 >> 4,
      type: val2 & 0x0F,
      pos
    })
  }

  return monsters
}

export function encodeStates(states: AdventureStates): ArrayBuffer {
  const monsters = Object.values(states.monsters)
  const buffer = new ArrayBuffer(1 + monsters.length * 4)
  const view = new DataView(buffer)

  encodeMonstersView(view, monsters)

  return buffer
}

export function decodeStates(data: ArrayBuffer): AdventureStates {
  const states: AdventureStates = { posMonster: {}, monsters: {} }

  const view = new DataView(data)
  const monsters = decodeMonstersView(view)

  for (const monster of monsters) {
    states.monsters[monster.id] = monster
    states.posMonster[monster.pos] = monster.id
  }

  return states
}
