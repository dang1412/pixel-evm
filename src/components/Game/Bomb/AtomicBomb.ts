import { Container, Graphics } from 'pixi.js'
 
import { PIXEL_SIZE } from '../utils'
 
import { BombMap } from './BombMap'
import { AtomicExplode } from './AtomicExplode'
 
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
 
export class AtomicBomb {
  private container = new Container()
  private spark = new Graphics()
  private bombColor: number

  constructor(private bombMap: BombMap, private x: number, private y: number, private ownerId: number) {
    const view = bombMap.map.getView()

    const mainScene = view.getScene('main')
    if (!mainScene) throw new Error('Main scene not loaded yet!')

    mainScene.addContainer(this.container, x, y)

    // rotate the bomb 45 degrees around its visual center
    // this.container.pivot.set(PIXEL_SIZE / 2, PIXEL_SIZE / 2)
    // this.container.rotation = Math.PI / 4

    // this.bombColor = BOMB_COLORS[(this.ownerId - 1) % BOMB_COLORS.length]
    this.bombColor = BOMB_COLORS[Math.floor(Math.random() * BOMB_COLORS.length)]
    this.draw()
  }

  private draw() {
    const bombColor = this.bombColor

    // Fat ellipse bomb body
    const bombBody = new Graphics()
    bombBody
      .ellipse(PIXEL_SIZE / 2, PIXEL_SIZE / 2, PIXEL_SIZE * 0.35, PIXEL_SIZE * 0.5)
      .fill(bombColor)
      .stroke({ width: 1, color: 0x222222, alpha: 1 })
    this.container.addChild(bombBody)

    // Draw left wing
    const leftWing = new Graphics()
    leftWing
      .rect(
        PIXEL_SIZE * 0.1,   // x
        PIXEL_SIZE * 0.3,   // y
        PIXEL_SIZE * 0.15,  // width
        PIXEL_SIZE * 0.4    // height
      )
      .fill({ color: bombColor })
    // leftWing.rotation = -Math.PI * 0.25  // Rotate 45 degrees outward
    // leftWing.pivot.set(PIXEL_SIZE * 0.25, PIXEL_SIZE * 0.5)
    this.container.addChild(leftWing)

    // Draw right wing
    const rightWing = new Graphics()
    rightWing
      .rect(
        PIXEL_SIZE * 0.75,  // x
        PIXEL_SIZE * 0.3,   // y
        PIXEL_SIZE * 0.15,  // width
        PIXEL_SIZE * 0.4    // height
      )
      .fill(bombColor)
    // rightWing.rotation = Math.PI * 0.25  // Rotate 45 degrees outward
    // rightWing.pivot.set(PIXEL_SIZE * 0.75, PIXEL_SIZE * 0.5)
    this.container.addChild(rightWing)

    // Highlight to emphasize volume/weight
    const highlight = new Graphics()
    highlight
      .ellipse(
        PIXEL_SIZE / 2 - PIXEL_SIZE * 0.12,
        PIXEL_SIZE / 2 - PIXEL_SIZE * 0.06,
        PIXEL_SIZE * 0.12,
        PIXEL_SIZE * 0.30,
      )
      .fill({ color: 0xFFFFFF, alpha: 0.12 })
    this.container.addChild(highlight)

    // Draw the pulsing spark on the fuse
    this.spark.clear()
    this.spark
      .circle(PIXEL_SIZE * 0.5, PIXEL_SIZE * 0.1, 4)
      .fill({ color: 0xFF3300, alpha: 1 })
    this.container.addChild(this.spark)
  }

  update() {
    const pulse = Math.abs(Math.sin(Date.now() / 100))
    // pulse the spark alpha and tint (RGB: 255, green = pulse*255, 0)
    this.spark.alpha = pulse
    const green = Math.floor(pulse * 255)
    this.spark.tint = (255 << 16) | (green << 8) | 0
  }

  remove() {
    this.container.destroy()
    new AtomicExplode(this.bombMap, this.x, this.y)
  }
 }
