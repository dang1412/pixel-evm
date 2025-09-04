import { Container } from 'pixi.js'

import { PixelMap } from '../pixelmap/PixelMap'
import { positionToXY, xyToPosition } from '../utils'
import { BoxClaimedEventArgs } from './api/watchBoxClaimed'
import { globalEventBus } from '@/lib/EventEmitter'

export class PixelGift {
  private positionBoxMap: Map<number, Container> = new Map() // position -> box image

  constructor(public map: PixelMap) {
    const view = map.getView()

    view.subscribe('pixelclick', (event: CustomEvent<[number, number]>) => {
      if (view.activeScene !== 'main') {
        return
      }

      const [x, y] = event.detail
      const pos = xyToPosition(x, y)

      if (this.positionBoxMap.has(pos)) {
        this.claimBox(pos)
      }
    })

    globalEventBus.on('boxClaimed', this.handleBoxClaimed.bind(this))
  }

  private handleBoxClaimed = ({ user, position, token }: BoxClaimedEventArgs) => {
    this.boxTaken(position, token)
  }

  hasBox(pos: number) {
    return this.positionBoxMap.has(pos)
  }

  // override with actual implementation
  claimBox(pos: number) {}

  syncBoxes(positions: number[]) {
    const newPositions = new Set(positions)
    // remove boxes that are no longer active
    for (const pos of this.positionBoxMap.keys()) {
      if (!newPositions.has(pos)) {
        this.boxTaken(pos, 0)
      }
    }

    // get main scene
    const main = this.map.getView().getScene('main')
    if (!main) return

    // add new boxes
    for (const pos of positions) {
      // if (!this.positionBoxMap.has(pos)) {
      //   const { x, y } = positionToXY(pos)
      //   const box = main.addImage('/images/gift/gift-box.webp', { x, y, w: 1, h: 1 })
      //   this.positionBoxMap.set(pos, box)
      // }
      this.addBox(pos)
    }
  }

  addBox(pos: number) {
    if (this.positionBoxMap.has(pos)) return
    const main = this.map.getView().getScene('main')
    if (!main) return

    const { x, y } = positionToXY(pos)
    const box = main.addImage('/images/gift/gift-box.webp', { x, y, w: 1, h: 1 })
    this.positionBoxMap.set(pos, box)
  }

  boxTaken(pos: number, amount: number) {
    const box = this.positionBoxMap.get(pos)
    if (box) {
      box.destroy()
      this.positionBoxMap.delete(pos)
    }

    if (amount <= 0) return

    // draw token amount text
    const view = this.map.getView()
    const main = view.getScene('main')
    if (!main) return

    const { x, y } = positionToXY(pos)
    const text = main.addText(`+${amount}`, x, y)
    view
      .moveObject(text, x, y, x, y - 1)
      .then(() => text.destroy())
  }
}
