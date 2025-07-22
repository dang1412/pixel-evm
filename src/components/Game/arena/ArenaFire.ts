import { Container, Sprite } from 'pixi.js'

import { PixiAnimation } from '../Animation'
import { loadMultiPackSpritesheet } from '../helpers/loadSpriteSheet'

import { PixelArenaMap } from './PixelArenaMap'
import { CountDownItemOnMap } from './types'

const fireAnimation = loadMultiPackSpritesheet('/animations/fire3-0.json', 'flame')

export class ArenaFire {
  private animation: PixiAnimation
  private container?: Container

  constructor(private arenaMap: PixelArenaMap, private fire: CountDownItemOnMap) {
    // animation
    this.animation = new PixiAnimation((f) => {
      const unsub = arenaMap.map.subscribe('tick', (e: CustomEvent<number>) => {
        f(e.detail)
        arenaMap.map.markDirty()
      })

      return unsub
    })
    this.init()
  }

  setFire(f: CountDownItemOnMap) {
    this.fire = f
  }

  getPos() {
    return this.fire.pos
  }

  private async init() {
    const scene = this.arenaMap.map.getActiveScene()
    if (!scene) return

    const { x, y } = this.fire.pos

    const frames = await fireAnimation
    const container = scene.addImage('', {x: x - 2.2, y: y - 3.2, w: 5, h: 5})
    const sprite = container.getChildAt(0) as Sprite
    this.animation.animate(sprite, frames, 3, () => {})

    this.container = container
  }

  // next() {
  //   this.fire.living --
  //   if (this.fire.living <= 0) {
  //     this.stop()
  //   }
  // }

  isStopped() {
    return this.fire.living <= 0
  }

  stop() {
    if (!this.container) return

    const sprite = this.container.getChildAt(0) as Sprite
    this.animation.stopAnimation(sprite)

    this.container.destroy()
  }
}