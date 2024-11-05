import { encodeStates, decodeStates, encodeMonsterStateByteLen } from './states'
import { AdventureStates } from '../types'

describe('Test encode decode AdventureStates', () => {
  const states: AdventureStates = {
    posMonster: {1510: [1], 1610: [1], 3020: [2], 3120: [2]},
    monsters: {
      1: {id: 1, hp: 10, type: 0, pos: {x: 10, y: 15}, target: {x: 12, y: 16}},
      2: {id: 2, hp: 8, type: 0, pos: {x: 20, y: 30}, target: {x: 24, y: 20}},
    },
    coverPixels: {1: [1510, 1610], 2: [3020, 3120]}
  }

  test('AdventureStates', () => {
    const encoded = encodeStates(states)
    expect(encoded.byteLength).toBe(1 + Object.values(states.monsters).length * encodeMonsterStateByteLen)

    const decoded = decodeStates(encoded)
  
    expect(states.monsters).toEqual(decoded.monsters)
    expect(states.posMonster).toEqual(decoded.posMonster)
    expect(states.coverPixels).toEqual(decoded.coverPixels)
  })
})
