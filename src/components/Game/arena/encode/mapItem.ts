import { MapItemType, RTCMessageType } from '../types'
import { createDecodeItemsFunc, createEncodeItemsFunc, createEncodeItemsViewFunc, setRTCMessageType } from './common'

export const PositionMapItemEncodeLength = 3

// Encode functions

export function encodeActionView(view: DataView, item: [number, MapItemType], offset = 0) {
  const [ pixel, type ] = item
  view.setUint16(offset, pixel)
  view.setUint8(offset + 2, type)

  return PositionMapItemEncodeLength
}

const encodeMapItemsView = createEncodeItemsViewFunc(encodeActionView)
export const encodeMapItems = createEncodeItemsFunc(encodeMapItemsView, PositionMapItemEncodeLength)

export function decodeMapItemView(view: DataView, offset = 0): [number, MapItemType] {
  const pixel = view.getUint16(offset)
  const type = view.getUint8(offset + 2) as MapItemType

  return [pixel, type]
}

// Decode

export const decodeMapItems = createDecodeItemsFunc(decodeMapItemView, PositionMapItemEncodeLength)

// Add RTCMessageType

export function encodeMapItemsWithType(items: [number, MapItemType][]): ArrayBuffer {
  const data = encodeMapItems(items)
  setRTCMessageType(data, RTCMessageType.MapItems)

  return data
}
