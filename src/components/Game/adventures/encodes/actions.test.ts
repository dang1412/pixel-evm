
import { encodeAction, decodeAction } from './actions'
import { ActionType, AdventureAction, AdventureStates } from '../types'

describe('Test encode decode Actions', () => {
  // const states: AdventureStates = {
  //   posMonster: {10: 1, 15: 2},
  //   monsters: {
  //     1: {id: 1, hp: 10, type: 1, pos: 10},
  //     2: {id: 2, hp: 8, type: 2, pos: 15},
  //   },
  // }
  const action: AdventureAction = { id: 1, val: 10, type: ActionType.MOVE }

  test('action', () => {
    const encoded = encodeAction(action)
    expect(encoded.byteLength).toBe(3)
  
    const decoded = decodeAction(encoded)
  
    expect(decoded).toEqual(action)
  })
})
