import { encodeStates, decodeStates, encodeMonsterStateByteLen } from './states'
import { AdventureStates } from '../types'

describe('Test encode decode AdventureStates', () => {
  const states: AdventureStates = {
    posMonster: {10: 1, 15: 2},
    monsters: {
      1: {id: 1, hp: 10, type: 0, pos10: 10, target: 20},
      2: {id: 2, hp: 8, type: 1, pos10: 15, target: 16},
    },
    coverPixels: {}
  }

  test('AdventureStates', () => {
    const encoded = encodeStates(states)
    expect(encoded.byteLength).toBe(1 + Object.values(states.monsters).length * encodeMonsterStateByteLen)
  
    const decoded = decodeStates(encoded)
  
    expect(states.posMonster).toEqual(decoded.posMonster)
    expect(states.monsters).toEqual(decoded.monsters)
  })
})
