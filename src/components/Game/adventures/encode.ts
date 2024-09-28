import { AdventureStates, AdventureMonster, AdventureAction } from './types'

export function encodeAdventureStates(state: AdventureStates): ArrayBuffer {
  const { monsterPos, actions } = state
  const monsterPosArr: [number, number][] = []
  for (const idstr of Object.keys(monsterPos)) {
    const id = Number(idstr)
    monsterPosArr.push([id, monsterPos[id]])
  }

  const monsters = Object.values(state.monsters)

  // bytes length
  const byteLen = 3 + monsterPosArr.length * 3 + monsters.length * 2 + actions.length * 3
  const buffer = new ArrayBuffer(byteLen)

  // encode monsterPosArr
  const view = new DataView(buffer)
  const offset = encodeMonsterPos(view, monsterPosArr)

  // encode monsters
  const view2 = new DataView(buffer, offset)
  const offset2 = encodeMonsters(view2, monsters)

  // encode actions
  const view3 = new DataView(buffer, offset + offset2)
  encodeActions(view3, actions)

  return buffer
}

export function encodeMonsterPos(view: DataView, monsterPosArr: [number, number][]): number {
  view.setUint8(0, monsterPosArr.length)

  let offset = 1
  for (const [id, pos] of monsterPosArr) {
    view.setUint8(offset, id)
    view.setUint16(offset + 1, pos)
    offset += 3
  }

  return offset
}

export function encodeMonsters(view: DataView, monsters: AdventureMonster[]): number {
  view.setUint8(0, monsters.length)

  let offset = 1
  for (const { id, hp, type } of monsters) {
    view.setUint8(offset, id)
    view.setUint8(offset + 1, ((hp & 0x0F) << 4) | type & 0x0F)
    offset += 2
  }

  return offset
}

export function encodeActions(view: DataView, actions: AdventureAction[]): number {
  view.setUint8(0, actions.length)

  let offset = 1
  for (const { id, to, type } of actions) {
    view.setUint8(offset, id)
    view.setUint16(offset + 1, ((to & 0x7FFF) << 1) | type & 0x1)
    offset += 3
  }

  return offset
}

export function decodeActions(view: DataView): AdventureAction[] {
  const actions: AdventureAction[] = []
  const len = view.getUint8(0)

  for (let i = 0; i < len; i++) {
    const id = view.getUint8(i * 3 + 1)
    const val2 = view.getUint16(i * 3 + 2)
    actions.push({
      id,
      to: val2 >> 1,
      type: val2 & 0x1
    })
  }

  return actions
}

export function decodeAdventureStates(buffer: ArrayBuffer): AdventureStates {
  const states: AdventureStates = {
    monsterPos: {},
    posMonster: {},
    monsters: {},
    actions: []
  }

  // monster positions
  const view = new DataView(buffer)
  const monsterPosArr = decodeMonsterPos(view)

  for (const [id, pos] of monsterPosArr) {
    states.monsterPos[id] = pos
    states.posMonster[pos] = id
  }

  // monsters
  const view2 = new DataView(buffer, 1 + monsterPosArr.length * 3)
  const monsters = decodeMonsters(view2)

  for (const monster of monsters) {
    states.monsters[monster.id] = monster
  }

  // actions
  const view3 = new DataView(buffer, 2 + monsterPosArr.length * 3 + monsters.length * 2)
  states.actions = decodeActions(view3)

  return states
}

export function decodeMonsterPos(view: DataView): [number, number][] {
  const monsterPosArr: [number, number][] = []

  const len = view.getUint8(0)

  for (let i = 0; i < len; i++) {
    const id = view.getUint8(i * 3 + 1)
    const pos = view.getUint16(i * 3 + 2)
    monsterPosArr.push([id, pos])
  }

  return monsterPosArr
}

export function decodeMonsters(view: DataView): AdventureMonster[] {
  const monsters: AdventureMonster[] = []

  const len = view.getUint8(0)

  for (let i = 0; i < len; i++) {
    const id = view.getUint8(i * 2 + 1)
    const val2 = view.getUint8(i * 2 + 2)
    monsters.push({
      id,
      hp: (val2 >> 4) & 0x0F,
      type: val2 & 0x0F,
    })
  }

  return monsters
}
