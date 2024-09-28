import { encodeAdventureStates, decodeAdventureStates, encodeActions, decodeActions } from './encode'
import { ActionType, AdventureAction, AdventureStates } from './types'

describe('Test encode decode', () => {
  const states: AdventureStates = {
    monsterPos: {1: 10, 2: 15},
    posMonster: {10: 1, 15: 2},
    monsters: {
      1: {id: 1, hp: 10, type: 1},
      2: {id: 2, hp: 8, type: 2}
    },
    actions: [
      { id: 1, to: 10, type: ActionType.MOVE },
      { id: 2, to: 15, type: ActionType.SHOOT },
    ]
  }

  test('test encode and decode adventure states', () => {
    const encoded = encodeAdventureStates(states)
    console.log(encoded.byteLength)
  
    const decoded = decodeAdventureStates(encoded)
  
    expect(states.monsterPos).toEqual(decoded.monsterPos)
    expect(states.posMonster).toEqual(decoded.posMonster)
    expect(states.monsters).toEqual(decoded.monsters)
    expect(states.actions).toEqual(decoded.actions)
  })

  test('test actions', () => {
    const actions: AdventureAction[] = [
      { id: 1, to: 20, type: 0 },
      { id: 2, to: 40, type: 1 },
      { id: 4, to: 100, type: 1 },
    ]

    const data = new ArrayBuffer(10)
    const view = new DataView(data)

    const encodedLen = encodeActions(view, actions)
    expect(encodedLen).toBe(10)

    const decoded = decodeActions(view)
    expect(decoded).toEqual(actions)
  })
})
