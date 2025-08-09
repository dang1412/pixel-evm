import { Container, Sprite, Text } from 'pixi.js'

import { PixiAnimation } from '../Animation'
import { loadMultiPackSpritesheet } from '../helpers/loadSpriteSheet'

import { PixelArenaMap } from './PixelArenaMap'
import { CountDownItemOnMap } from './types'
import { createAnimation } from '../helpers/createAnimation'

const loadFireAnimation = loadMultiPackSpritesheet('/animations/fire3-0.json', 'flame')

export class ArenaFire {
  private animation: PixiAnimation
  private container: Container
  private text = new Text()

  constructor(private arenaMap: PixelArenaMap, private fire: CountDownItemOnMap) {
    // animation
    this.animation = createAnimation(arenaMap.getView())
    const scene = this.arenaMap.getScene()!
    const { x, y } = this.fire.pos
    this.container = scene.addImage('', {x: x - 2.2, y: y - 3.2, w: 5, h: 5})
    this.init()
  }

  setFire(f: CountDownItemOnMap) {
    this.fire = f
    this.drawLiving()
  }

  getPos() {
    return this.fire.pos
  }

  private async init() {
    const frames = await loadFireAnimation
    const sprite = this.container.getChildAt(0) as Sprite
    this.animation.animate(sprite, frames, 3, () => {})
    this.drawLiving()
  }

  private drawLiving() {
    this.text.destroy()
    const text = new Text({
      text: this.fire.living,
      style: {
        fontFamily: 'Arial',
        fontSize: 12,
        fontWeight: 'bold',
        fill: '#9c2020ff',
      }
    })
    text.x = 80
    text.y = 110
    this.container.addChild(text)
    this.text = text

    if (this.fire.living === 2) {
      this.container.alpha = 0.8
    } else if (this.fire.living === 1) {
      this.container.alpha = 0.6
    } else {
      this.container.alpha = 1
    }
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