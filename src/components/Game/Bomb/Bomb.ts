import { Color, Container, Graphics } from 'pixi.js'

import { PIXEL_SIZE } from '../utils'

import { BombMap } from './BombMap'

export class Bomb {
  private container = new Container()
  private spark = new Graphics()

  constructor(bombMap: BombMap, x: number, y: number, private ownerId: number) {
    const view = bombMap.map.getView()

    const mainScene = view.getScene('main')
    if (!mainScene) throw new Error('Main scene not loaded yet!')

    mainScene.addContainer(this.container, x, y)

    this.draw()
  }

  private draw() {
    // Draw the bomb body
    const bombBody = new Graphics()
      .circle(PIXEL_SIZE / 2, PIXEL_SIZE / 2, PIXEL_SIZE * 0.4)
      .fill(0x333333)
    this.container.addChild(bombBody)

    // Draw the fuse
    const fuse = new Graphics()
      .moveTo(PIXEL_SIZE / 2, PIXEL_SIZE / 2)
      .lineTo(PIXEL_SIZE * 0.7, PIXEL_SIZE * 0.3)
      .stroke({ width: 3, color: 0x999999 })
    this.container.addChild(fuse)

    // Draw the pulsing spark on the fuse
    this.spark
      .circle(PIXEL_SIZE * 0.7, PIXEL_SIZE * 0.3, 4)
      .fill(0xFF0000)
    this.container.addChild(this.spark)
  }

  update() {
    const pulse = Math.abs(Math.sin(Date.now() / 100))
    this.spark.alpha = pulse
    this.spark.tint = new Color([1, pulse, 0]).toNumber()
  }

  remove() {
    this.container.destroy()
  }
}
