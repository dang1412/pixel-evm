import { AdventureAction } from '../types'

export function encodeActionsView(view: DataView, actions: AdventureAction[]): number {
  view.setUint8(0, actions.length)

  let offset = 1
  for (const action of actions) {
    encodeActionView(view, action, offset)
    offset += 3
  }

  return offset
}

export function encodeActionView(view: DataView, action: AdventureAction, offset = 0) {
  const { id, val, type } = action
  view.setUint8(offset, id)
  view.setUint16(offset + 1, ((val & 0x3FFF) << 2) | type & 0x3)
}

export function encodeAction(action: AdventureAction): ArrayBuffer {
  const buffer = new ArrayBuffer(3)
  const view = new DataView(buffer)
  encodeActionView(view, action)

  return buffer
}

export function decodeActionsView(view: DataView): AdventureAction[] {
  const actions: AdventureAction[] = []
  const len = view.getUint8(0)

  for (let i = 0; i < len; i++) {
    const action = decodeActionView(view, i * 3 + 1)
    actions.push(action)
  }

  return actions
}

export function decodeActionView(view: DataView, offset = 0): AdventureAction {
  const id = view.getUint8(offset)
  const val2 = view.getUint16(offset + 1)

  return {
    id,
    val: val2 >> 2,
    type: val2 & 0x3
  }
}

export function decodeAction(data: ArrayBuffer): AdventureAction {
  const view = new DataView(data)
  return decodeActionView(view)
}
