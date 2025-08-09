import { Container } from 'pixi.js'

import { PixelArenaMap } from './PixelArenaMap'
import { CountDownItemOnMap } from './types'
import { Text } from 'pixi.js'

export class ArenaBomb {
  private container: Container
  private text = new Text()

  constructor(private arenaMap: PixelArenaMap, private bomb: CountDownItemOnMap) {
    // TODO get the right game scene
    const scene = this.arenaMap.getScene()!

    this.container = scene.addImage('/images/bomb.png', {x: bomb.pos.x - 0.4, y: bomb.pos.y - 0.4, w: 1.6, h: 1.6})
    this.drawLiving()
  }

  private drawLiving() {
    this.text.destroy()
    const text = new Text({
      text: this.bomb.living,
      style: {
        fontFamily: 'Arial',
        fontSize: 12,
        fontWeight: 'bold',
        fill: 'red',
        // align: 'center',
        // stroke: {
        //   color: '#fc1111',
        //   width: 1
        // },
      }
    })
    text.x = 34
    text.y = 30
    this.container.addChild(text)
    this.text = text
  }

  update(living: number) {
    this.bomb.living = living
    this.drawLiving()
    if (living === 0) this.explode()
  }

  isExploded() {
    return this.bomb.living <= 0
  }

  private explode() {
    this.container.destroy()
    this.arenaMap.animateExplode(this.bomb.pos.x, this.bomb.pos.y)
  }
}
