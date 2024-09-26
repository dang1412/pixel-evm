import { AdventureStates, AdventureMonster } from './types'

export function encodeAdventureStates(state: AdventureStates): ArrayBuffer {
  const { monsterPos } = state
  const monsterPosArr: [number, number][] = []
  for (const idstr of Object.keys(monsterPos)) {
    const id = Number(idstr)
    monsterPosArr.push([id, monsterPos[id]])
  }

  const monsters = Object.values(state.monsters)

  const byteLen = 2 + monsterPosArr.length * 3 + monsters.length * 2
  const buffer = new ArrayBuffer(byteLen)
  
  // encode monsterPosArr
  const view = new DataView(buffer)
  const offset = encodeMonsterPos(view, monsterPosArr)

  // encode monsters
  const view2 = new DataView(buffer, offset)
  encodeMonsters(view2, monsters)

  return buffer
}

function encodeMonsterPos(view: DataView, monsterPosArr: [number, number][]): number {
  view.setUint8(0, monsterPosArr.length)

  let offset = 1
  for (const [id, pos] of monsterPosArr) {
    view.setUint8(offset, id)
    view.setUint16(offset + 1, pos)
    offset += 3
  }

  return offset
}

function encodeMonsters(view: DataView, monsters: AdventureMonster[]): number {
  view.setUint8(0, monsters.length)

  let offset = 1
  for (const { id, hp, type } of monsters) {
    view.setUint8(offset, id)
    view.setUint8(offset + 1, (hp & 0x0F << 4) | type & 0x0F)
    offset += 2
  }

  return offset
}

export function decodeAdventureStates(buffer: ArrayBuffer): AdventureStates {
  const states: AdventureStates = {
    monsterPos: {},
    posMonster: {},
    monsters: {}
  }

  const view = new DataView(buffer)
  const monsterPosArr = decodeMonsterPos(view)

  for (const [id, pos] of monsterPosArr) {
    states.monsterPos[id] = pos
    states.posMonster[pos] = id
  }

  const view2 = new DataView(buffer, 1 + monsterPosArr.length * 3)
  const monsters = decodeMonsters(view2)

  for (const monster of monsters) {
    states.monsters[monster.id] = monster
  }

  return states
}

function decodeMonsterPos(view: DataView): [number, number][] {
  const monsterPosArr: [number, number][] = []

  const len = view.getUint8(0)

  for (let i = 0; i < len; i++) {
    const id = view.getUint8(i * 3 + 1)
    const pos = view.getUint16(i * 3 + 2)
    monsterPosArr.push([id, pos])
  }

  return monsterPosArr
}

function decodeMonsters(view: DataView): AdventureMonster[] {
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
