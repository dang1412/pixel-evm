import { Container } from 'pixi.js'

import { PixelArenaMap } from './PixelArenaMap'
import { CountDownItemOnMap } from './types'

export class ArenaBomb {
  private container: Container

  constructor(private arenaMap: PixelArenaMap, private bomb: CountDownItemOnMap) {
    // TODO get the right game scene
    const scene = this.arenaMap.map.getActiveScene()!

    this.container = scene.addImage('/images/bomb.png', {x: bomb.pos.x - 0.4, y: bomb.pos.y - 0.4, w: 1.6, h: 1.6})
  }

  update(living: number) {
    this.bomb.living = living
    if (living === 0) this.explode()
  }

  private explode() {
    this.container.destroy()
    this.arenaMap.animateExplode(this.bomb.pos.x, this.bomb.pos.y)
  }
}
