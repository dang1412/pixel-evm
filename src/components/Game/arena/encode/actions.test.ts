import { encodeAction, decodeAction, encodeActions, decodeActions, ActionEncodeLength } from './actions'
import { ActionType, ArenaAction, RTCMessageType } from '../types'
import { getRTCMessageType, setRTCMessageType } from './common'

describe('actions encode/decode', () => {
  const sampleAction: ArenaAction = {
    id: 3,
    actionType: ActionType.Move,
    target: { x: 12, y: 34 }
  }

  it('should encode and decode a single action correctly', () => {
    const encoded = encodeAction(sampleAction)
    expect(encoded.byteLength).toBe(ActionEncodeLength + 1)

    setRTCMessageType(encoded, RTCMessageType.Action)

    const decoded = decodeAction(encoded)
    expect(decoded).toEqual(sampleAction)

    const type = getRTCMessageType(encoded)
    expect(type).toBe(RTCMessageType.Action)
  })

  it('should encode and decode multiple actions correctly', () => {
    const actions: ArenaAction[] = [
      sampleAction,
      { id: 1, actionType: 2, target: { x: 5, y: 6 } },
      { id: 15, actionType: 0, target: { x: 0, y: 0 } }
    ]

    const encoded = encodeActions(actions)
    // 1 byte for length and 1 byte for RTCMessageType
    expect(encoded.byteLength).toBe(actions.length * ActionEncodeLength + 2)

    const decoded = decodeActions(encoded)
    expect(decoded).toEqual(actions)
  })

  it('should handle edge values for id and actionType', () => {
    const action: ArenaAction = {
      id: 15, // max 4 bits
      actionType: ActionType.Move, // max 4 bits
      target: { x: 10, y: 100 }
    }
    const encoded = encodeAction(action)
    const decoded = decodeAction(encoded)
    expect(decoded).toEqual(action)
  })

  it('should handle zero values for id, actionType, and target', () => {
    const action: ArenaAction = {
      id: 0,
      actionType: 0,
      target: { x: 0, y: 0 }
    }
    const encoded = encodeAction(action)
    const decoded = decodeAction(encoded)
    expect(decoded).toEqual(action)
  })
})
