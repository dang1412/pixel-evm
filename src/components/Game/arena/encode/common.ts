// Encode functions

export type EncodeItemFunction<T> = (view: DataView, item: T, offset?: number) => number

export type EncodeItemsFunction<T> = (view: DataView, items: T[]) => number

export function createEncodeItemsViewFunc<T>(encodeItem: EncodeItemFunction<T>): EncodeItemsFunction<T> {

  return (view: DataView, items: T[]): number => {
    view.setUint8(0, items.length)

    let offset = 1
    for (const item of items) {
      const bytesNum = encodeItem(view, item, offset)
      offset += bytesNum
    }

    return offset
  }
}

export function createEncodeItemFunc<T>(encodeItem: EncodeItemFunction<T>, objEncodeLength: number) {

  return (item: T): ArrayBuffer => {

    const buffer = new ArrayBuffer(objEncodeLength)
    const view = new DataView(buffer)
    encodeItem(view, item)

    return buffer
  }
}

export function createEncodeItemsFunc<T>(encodeItems: EncodeItemsFunction<T>, objEncodeLength: number) {

  return (items: T[]): ArrayBuffer => {

    const buffer = new ArrayBuffer(1 + objEncodeLength * items.length)
    const view = new DataView(buffer)
    encodeItems(view, items)

    return buffer
  }
}

// Decode functions

export type DecodeItemFunction<T> = (view: DataView, offset?: number) => T
export type DecodeItemsFunction<T> = (view: ArrayBuffer) => T[]

export function createDecodeItemFunc<T>(decodeItem: DecodeItemFunction<T>): (view: ArrayBuffer) => T{

  return (data: ArrayBuffer) => decodeItem(new DataView(data))
}

export function createDecodeItemsFunc<T>(decodeItem: DecodeItemFunction<T>, itemEncodeLength: number): DecodeItemsFunction<T> {

  return function decodeItemsData(data: ArrayBuffer): T[] {
    const view = new DataView(data)
    const items: T[] = []
    const len = view.getUint8(0)

    for (let i = 0; i < len; i++) {
      const item = decodeItem(view, 1 + i * itemEncodeLength)
      items.push(item)
    }

    return items
  }
}
