import { encodeAdventureStates, decodeAdventureStates, encodeActionsView, decodeActionsView } from './encode'
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
      { id: 1, val: 10, type: ActionType.MOVE },
      { id: 2, val: 15, type: ActionType.SHOOT },
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
      { id: 1, val: 20, type: ActionType.MOVE },
      { id: 2, val: 40, type: ActionType.SHOOT },
      { id: 4, val: 100, type: ActionType.WEAR },
    ]

    const data = new ArrayBuffer(10)
    const view = new DataView(data)

    const encodedLen = encodeActionsView(view, actions)
    expect(encodedLen).toBe(10)

    const decoded = decodeActionsView(view)
    expect(decoded).toEqual(actions)
  })
})
