import { encodeStates, decodeStates } from './states'
import { AdventureStates } from '../types'

describe('Test encode decode AdventureStates', () => {
  const states: AdventureStates = {
    posMonster: {10: 1, 15: 2},
    monsters: {
      1: {id: 1, hp: 10, type: 1, pos: 10},
      2: {id: 2, hp: 8, type: 2, pos: 15},
    },
  }

  test('AdventureStates', () => {
    const encoded = encodeStates(states)
    expect(encoded.byteLength).toBe(1 + Object.values(states.monsters).length * 4)
  
    const decoded = decodeStates(encoded)
  
    expect(states.posMonster).toEqual(decoded.posMonster)
    expect(states.monsters).toEqual(decoded.monsters)
  })
})
