import { position10ToXY, xyToPosition10 } from '../../utils'
import { AdventureAction } from '../types'

export const ActionEncodeLength = 4

export function encodeActionsView(view: DataView, actions: AdventureAction[]): number {
  view.setUint8(0, actions.length)

  let offset = 1
  for (const action of actions) {
    encodeActionView(view, action, offset)
    offset += ActionEncodeLength
  }

  return offset
}

export function encodeActionView(view: DataView, action: AdventureAction, offset = 0) {
  const { id, pos, type } = action
  const val = xyToPosition10(pos.x, pos.y)
  view.setUint8(offset, id)
  view.setUint16(offset + 1, val  >> 4) // val top 16bit
  view.setUint8(offset + 3, (val  & 0xF) << 4 | (type & 0xF)) // val bottom 4bit and type 4bit
}

export function encodeAction(action: AdventureAction): ArrayBuffer {
  const buffer = new ArrayBuffer(ActionEncodeLength)
  const view = new DataView(buffer)
  encodeActionView(view, action)

  return buffer
}

export function decodeActionsView(view: DataView): AdventureAction[] {
  const actions: AdventureAction[] = []
  const len = view.getUint8(0)

  for (let i = 0; i < len; i++) {
    const action = decodeActionView(view, i * ActionEncodeLength + 1)
    actions.push(action)
  }

  return actions
}

export function decodeActionView(view: DataView, offset = 0): AdventureAction {
  const id = view.getUint8(offset)
  const val2 = view.getUint16(offset + 1)
  const val3 = view.getUint8(offset + 3)

  const val = (val2 << 4) | (val3 >> 4)
  const pos = position10ToXY(val)

  return {
    id,
    pos,
    type: val3 & 0xF
  }
}

export function decodeAction(data: ArrayBuffer): AdventureAction {
  const view = new DataView(data)
  return decodeActionView(view)
}
