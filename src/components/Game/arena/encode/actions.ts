import { positionToXY, xyToPosition } from '../../utils'
import { ArenaAction, RTCMessageType } from '../types'
import { createDecodeItemFunc, createDecodeItemsFunc, createEncodeItemFunc, createEncodeItemsFunc, createEncodeItemsViewFunc, setRTCMessageType } from './common'

export const ActionEncodeLength = 3

// Encode functions

export function encodeActionView(view: DataView, action: ArenaAction, offset = 0) {
  const { id, actionType, target } = action
  view.setUint8(offset, id << 4 | actionType) // id top 4bit and actionType bottom 4bit

  const val = xyToPosition(target.x, target.y)
  view.setUint16(offset + 1, val) // val top 16bit

  return ActionEncodeLength
}

export const encodeAction = createEncodeItemFunc(encodeActionView, ActionEncodeLength)

const encodeActionsView = createEncodeItemsViewFunc(encodeActionView)
export const encodeActions = createEncodeItemsFunc(encodeActionsView, ActionEncodeLength)

// export function encodeActionsView(view: DataView, actions: ArenaAction[]): number {
//   view.setUint8(0, actions.length)

//   let offset = 1
//   for (const action of actions) {
//     encodeActionView(view, action, offset)
//     offset += ActionEncodeLength
//   }

//   return offset
// }

// export function encodeActions(actions: ArenaAction[]): ArrayBuffer {
//   const buffer = new ArrayBuffer(1 + ActionEncodeLength * actions.length)
//   const view = new DataView(buffer)
//   encodeActionsView(view, actions)

//   return buffer
// }

// Decode functions

export function decodeActionView(view: DataView, offset = 0): ArenaAction {
  const val1 = view.getUint8(offset)

  const id = val1 >> 4 // top 4bit
  const actionType = val1 & 0xF // bottom 4bit

  const pos = view.getUint16(offset + 1)
  const target = positionToXY(pos)

  return {
    id,
    actionType,
    target
  }
}

export const decodeAction = createDecodeItemFunc(decodeActionView)
export const decodeActions = createDecodeItemsFunc(decodeActionView, ActionEncodeLength)

// export function decodeActionsView(view: DataView): ArenaAction[] {
//   const actions: ArenaAction[] = []
//   const len = view.getUint8(0)

//   for (let i = 0; i < len; i++) {
//     const action = decodeActionView(view, 1 + i * ActionEncodeLength)
//     actions.push(action)
//   }

//   return actions
// }

// export function decodeAction(data: ArrayBuffer): ArenaAction {
//   const view = new DataView(data)
//   return decodeActionView(view)
// }

export function encodeActionWithType(action: ArenaAction): ArrayBuffer {
  const data = encodeAction(action)
  setRTCMessageType(data, RTCMessageType.Action)

  return data
}

export function encodeActionsWithType(actions: ArenaAction[]): ArrayBuffer {
  const data = encodeActions(actions)
  setRTCMessageType(data, RTCMessageType.Actions)

  return data
}
