import { encodeAdventureStates, decodeAdventureStates } from './encode'
import { AdventureStates } from './types'

test('test encode and decode adventure states', () => {
  const states: AdventureStates = {
    monsterPos: {1: 10, 2: 15},
    posMonster: {10: 1, 15: 2},
    monsters: {
      1: {id: 1, hp: 10, type: 1},
      2: {id: 2, hp: 8, type: 2}
    }
  }

  const encoded = encodeAdventureStates(states)
  console.log(encoded.byteLength)

  const decoded = decodeAdventureStates(encoded)

  expect(states.monsterPos).toEqual(decoded.monsterPos)
  expect(states.posMonster).toEqual(decoded.posMonster)
  expect(states.monsters).toEqual(decoded.monsters)
})