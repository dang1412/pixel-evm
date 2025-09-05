import { Container, Graphics } from 'pixi.js'
import { sound } from '@pixi/sound'

import { globalEventBus } from '@/lib/EventEmitter'
import { globalState } from '@/components/globalState'

import { PixelMap } from '../pixelmap/PixelMap'
import { PIXEL_SIZE, positionToXY, xyToPosition } from '../utils'
import { BoxClaimedEventArgs } from './api/watchBoxClaimed'

sound.add('coin', '/sounds/gift/coin.mp3')
sound.add('appear', '/sounds/gift/appear.mp3')

export class PixelGift {
  private positionBoxMap: Map<number, Container> = new Map() // position -> box image

  constructor(public map: PixelMap) {
    const view = map.getView()

    let isPicking = false

    const toggleBoxPicking = (pixel: number) => {
      const box = this.positionBoxMap.get(pixel)
      isPicking = !isPicking
      if (box) {
        const glow = box.getChildAt(0)
        glow.visible = isPicking ? true : false
        box.alpha = isPicking ? 0.6 : 1
        this.map.getView().markDirty()
      } else {
        isPicking = false
      }
    }

    view.subscribe('pixelclick', (event: CustomEvent<[number, number]>) => {
      if (view.activeScene !== 'main' || isPicking) {
        return
      }

      const [x, y] = event.detail
      const pos = xyToPosition(x, y)

      const box = this.positionBoxMap.get(pos)
      if (box) {
        toggleBoxPicking(pos)

        this.claimBox(pos)
          .then(() => {
            console.log('Claim done')
            isPicking = false
          })
          .catch((err) => {
            console.error('Claim box error:', err)
            toggleBoxPicking(pos)
          })
      }
    })

    view.subscribe('pixelmove', (e: CustomEvent<[number, number]>) => {
      const [x, y] = e.detail
      const pos = xyToPosition(x, y)
      if (this.positionBoxMap.has(pos)) {
        // set cursor to pointer
        if (!isPicking) document.body.style.cursor = 'pointer'
      } else {
        document.body.style.cursor = 'default'
      }
    })

    globalEventBus.on('boxClaimed', this.handleBoxClaimed.bind(this))
  }

  private handleBoxClaimed = ({ user, position, token }: BoxClaimedEventArgs) => {
    this.boxTaken(position, token, user === globalState.address)
  }

  hasBox(pos: number) {
    return this.positionBoxMap.has(pos)
  }

  // override with actual implementation
  async claimBox(pos: number) {}

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
      this.addBox(pos)
    }

    sound.play('appear')
  }

  addBox(pos: number) {
    if (this.positionBoxMap.has(pos)) return
    const main = this.map.getView().getScene('main')
    if (!main) return

    const { x, y } = positionToXY(pos)
    const box = main.addImage('/images/gift/gift-box.webp', { x, y, w: 1, h: 1 })

    // glow effect
    const glow = new Graphics()
    const p = PIXEL_SIZE / 2
    glow.circle(p, p, PIXEL_SIZE).fill({ color: 0xffd700, alpha: 0.4 }) // center, radius (adjust as needed)
    box.addChildAt(glow, 0)
    this.positionBoxMap.set(pos, box)

    setTimeout(() => {
      glow.visible = false
      // set glow color
      glow.clear()
      glow.circle(p, p, PIXEL_SIZE).fill({ color: 0xa0f5a0, alpha: 0.6 })
      this.map.getView().markDirty()
    }, 2000)
  }

  boxTaken(pos: number, amount: number, isOwned = false) {
    const box = this.positionBoxMap.get(pos)
    if (!box) return

    // play sound if owned
    if (isOwned && amount > 0) {
      sound.play('coin')
    }

    // remove box
    box.destroy()
    this.positionBoxMap.delete(pos)

    if (amount <= 0) return

    // draw token amount text
    const view = this.map.getView()
    const main = view.getScene('main')
    if (!main) return

    const { x, y } = positionToXY(pos)
    const text = main.addText(`+${amount}`, x, y, isOwned ? 0x00ff00 : 0xff1010)
    view
      .moveObject(text, x, y, x, y - 1, 30)
      .then(() => text.destroy())
  }
}
