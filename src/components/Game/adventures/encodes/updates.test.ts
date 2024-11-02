import { encodeUpdates, decodeUpdates } from './updates'
import { ActionType, AdventureStateUpdates } from '../types'

describe('Test encode decode AdventureStateUpdates', () => {
  const updates: AdventureStateUpdates = {
    monsters: {
      1: {id: 1, hp: 10, type: 0, pos: {x: 10, y: 15}, target: {x: 12, y: 16}},
      2: {id: 2, hp: 8, type: 0, pos: {x: 20, y: 30}, target: {x: 24, y: 20}},
    },
    actions: [
      { id: 1, val: 10, type: ActionType.MOVE },
      { id: 2, val: 15, type: ActionType.SHOOT },
    ]
  }

  test('AdventureStateUpdates', () => {
    const encoded = encodeUpdates(updates)
    expect(encoded?.byteLength).toBe(22)
  
    const decoded = encoded ? decodeUpdates(encoded) : undefined
  
    expect(decoded?.monsters).toEqual(updates.monsters)
    expect(decoded?.actions).toEqual(updates.actions)
  })
})
