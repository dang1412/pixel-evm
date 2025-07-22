import { positionToXY, xyToPosition } from '../../utils'
import { CountDownItemOnMap, MapItemType, RTCMessageType } from '../types'
import { createDecodeItemsFunc, createEncodeItemsFunc, createEncodeItemsViewFunc, setRTCMessageType } from './common'

export const FireEncodeLength = 3

// Encode functions

export function encodeFireView(view: DataView, fire: CountDownItemOnMap, offset = 0) {
  const { pos, ownerId, living } = fire
  const pixel = xyToPosition(pos.x, pos.y)
  view.setUint16(offset, pixel)
  view.setUint8(offset + 2, ownerId << 4 | living)

  return FireEncodeLength
}

const encodeFiresView = createEncodeItemsViewFunc(encodeFireView)
export const encodeFires = createEncodeItemsFunc(encodeFiresView, FireEncodeLength)

export function decodeFireView(view: DataView, offset = 0): CountDownItemOnMap {
  const pixel = view.getUint16(offset)
  const pos = positionToXY(pixel)

  const val = view.getUint8(offset + 2)
  const ownerId = val >> 4
  const living = val & 0xF

  return { pos, ownerId, living }
}

// Decode

export const decodeFires = createDecodeItemsFunc(decodeFireView, FireEncodeLength)

// Add RTCMessageType

export function encodeFiresWithType(fires: CountDownItemOnMap[]): ArrayBuffer {
  const data = encodeFires(fires)
  setRTCMessageType(data, RTCMessageType.Fires)

  return data
}

export function encodeBombsWithType(bombs: CountDownItemOnMap[]): ArrayBuffer {
  const data = encodeFires(bombs)
  setRTCMessageType(data, RTCMessageType.Bombs)

  return data
}
