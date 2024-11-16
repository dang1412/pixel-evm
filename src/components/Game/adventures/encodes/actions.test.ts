
import { encodeAction, decodeAction, ActionEncodeLength } from './actions'
import { ActionType, AdventureAction } from '../types'
import { AttackType } from '../gamelogic/types'

describe('Test encode decode Actions', () => {
  // const states: AdventureStates = {
  //   posMonster: {10: 1, 15: 2},
  //   monsters: {
  //     1: {id: 1, hp: 10, type: 1, pos: 10},
  //     2: {id: 2, hp: 8, type: 2, pos: 15},
  //   },
  // }
  

  test('action move', () => {
    const action: AdventureAction = { id: 1, pos: {x: 10.5, y: 15.6}, type: ActionType.MOVE }
    const encoded = encodeAction(action)
    expect(encoded.byteLength).toBe(ActionEncodeLength)
  
    const decoded = decodeAction(encoded)
  
    expect(decoded).toEqual(action)
  })

  test('action shoot', () => {
    const action: AdventureAction = { id: 1, pos: {x: AttackType.A1, y: 100}, type: ActionType.SHOOT }
    const encoded = encodeAction(action)
    expect(encoded.byteLength).toBe(ActionEncodeLength)
  
    const decoded = decodeAction(encoded)
  
    expect(decoded).toEqual(action)
  })
})
