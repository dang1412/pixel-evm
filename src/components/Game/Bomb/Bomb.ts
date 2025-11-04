import { Color, Container, Graphics } from 'pixi.js'

import { PIXEL_SIZE } from '../utils'

import { BombMap } from './BombMap'

const BOMB_COLORS = [
  0x333333, // Lighter Dark Grey
  0x333366, // Lighter Dark Blue
  0x336633, // Lighter Dark Green
  0x663366, // Lighter Dark Purple
  0x666633, // Lighter Dark Yellow (Olive)
  0x336666  // Lighter Dark Cyan (Teal)
]

// const BOMB_COLORS = [
//   0x333333, // Dark
//   0x00004A, // Dark Blue
//   0x003300, // Dark Green
//   0x4A004A, // Dark Purple
//   0x4A4A00, // Dark Yellow (Olive)
//   0x004A4A  // Dark Cyan (Teal)
// ]

export class Bomb {
  private container = new Container()
  private spark = new Graphics()

  constructor(private bombMap: BombMap, x: number, y: number, private ownerId: number) {
    const view = bombMap.map.getView()

    const mainScene = view.getScene('main')
    if (!mainScene) throw new Error('Main scene not loaded yet!')

    mainScene.addContainer(this.container, x, y)

    this.draw()
  }

  private draw() {
    const bombColor = BOMB_COLORS[(this.ownerId - 1) % BOMB_COLORS.length]
    // random bomb color
    // const bombColor = BOMB_COLORS[Math.floor(Math.random() * BOMB_COLORS.length)]
    // Draw the bomb body
    const bombBody = new Graphics()
      .circle(PIXEL_SIZE / 2, PIXEL_SIZE / 2, PIXEL_SIZE * 0.4)
      .fill(bombColor)
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
