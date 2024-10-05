import { encodeUpdates, decodeUpdates } from './updates'
import { ActionType, AdventureStateUpdates } from '../types'

describe('Test encode decode AdventureStateUpdates', () => {
  const updates: AdventureStateUpdates = {
    monsters: {
      1: {id: 1, hp: 10, type: 1, pos: 10},
      2: {id: 2, hp: 8, type: 2, pos: 15}
    },
    actions: [
      { id: 1, val: 10, type: ActionType.MOVE },
      { id: 2, val: 15, type: ActionType.SHOOT },
    ]
  }

  test('AdventureStateUpdates', () => {
    const encoded = encodeUpdates(updates)
    expect(encoded.byteLength).toBe(16)
  
    const decoded = decodeUpdates(encoded)
  
    expect(decoded.monsters).toEqual(updates.monsters)
    expect(decoded.actions).toEqual(updates.actions)
  })
})
