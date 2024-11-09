
import { encodeAction, decodeAction, ActionEncodeLength } from './actions'
import { ActionType, AdventureAction } from '../types'

describe('Test encode decode Actions', () => {
  // const states: AdventureStates = {
  //   posMonster: {10: 1, 15: 2},
  //   monsters: {
  //     1: {id: 1, hp: 10, type: 1, pos: 10},
  //     2: {id: 2, hp: 8, type: 2, pos: 15},
  //   },
  // }
  const action: AdventureAction = { id: 1, pos: {x: 10.5, y: 15.6}, type: ActionType.MOVE }

  test('action', () => {
    const encoded = encodeAction(action)
    expect(encoded.byteLength).toBe(ActionEncodeLength)
  
    const decoded = decodeAction(encoded)
  
    expect(decoded).toEqual(action)
  })
})
