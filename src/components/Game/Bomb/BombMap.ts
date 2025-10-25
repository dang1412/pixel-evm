import { PixelMap } from '../pixelmap/PixelMap'
import { positionToXY, xyToPosition } from '../utils'

import { Bomb } from './Bomb'
import { BombGame } from './BombGame'
import { Explosion } from './Explosion'
import { MapItem } from './MapItem'
import { GameState, ItemState } from './types'

export class BombMap {
  bombMap = new Map<number, Bomb>()
  explosionMap = new Map<number, Explosion>()
  itemMap = new Map<number, MapItem>()

  bombGame: BombGame | undefined

  constructor(public map: PixelMap, private onScore: (score: number) => void) {
    const view = map.getView()

    view.subscribe('pixelclick', async (event: CustomEvent<[number, number]>) => {
      if (view.activeScene !== 'main') {
        return
      }

      const [x, y] = event.detail

      if (this.bombGame) {
        this.bombGame.addBomb(x, y)
        // for smooth UX, add bomb before receiving from logic
        this.addBomb(x, y)
      }
    })

    // update bombs and explosions animation
    view.subscribe('tick', (e: CustomEvent<number>) => {
      const delta = Math.min(e.detail, 20)
      for (const bomb of this.bombMap.values()) {
        bomb.update(delta)
      }

      for (const [pos, explosion] of this.explosionMap) {
        const done = explosion.update(delta)
        if (done) {
          this.explosionMap.delete(pos)
        }
      }

      view.markDirty()
    })
  }

  async initialize() {
    await this.map.getView().initialize

    new Bomb(this, 50, 50)
  }

  update(state: GameState) {
    for (const pos of state.bombs) {
      const { x, y } = positionToXY(pos)
      this.addBomb(x, y)
    }

    for (const pos of state.explosions) {
      const bomb = this.bombMap.get(pos)
      if (bomb) {
        this.bombMap.delete(pos)
        bomb.explode()
      }
      const { x, y } = positionToXY(pos)
      this.explosionMap.set(pos, new Explosion(this, x, y, 3))
    }
  }

  addItem(pos: number, item: ItemState) {
    const { x, y } = positionToXY(pos)
    this.itemMap.set(pos, new MapItem(this, x, y, item.points))
  }

  removeItems(positions: number[]) {
    for (const pos of positions) {
      const item = this.itemMap.get(pos)
      if (item) {
        this.itemMap.delete(pos)
        item.remove()
      }
    }
  }

  updateScore(score: number) {
    console.log('Update score', score)
    this.onScore(score)
  }

  private addBomb(x: number, y: number) {
    const pos = xyToPosition(x, y)
    if (this.bombMap.has(pos)) return

    console.log('Add bomb', pos, x, y)
    this.bombMap.set(pos, new Bomb(this, x, y))
  }

  private addExplosion(x: number, y: number) {
  }
}
