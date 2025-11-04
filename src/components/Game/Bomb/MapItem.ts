import { Container, Graphics, Text } from 'pixi.js'
import { BombMap } from './BombMap'
import { PIXEL_SIZE } from '../utils'

const flashAnimationTime = 800

export class MapItem {
  private container = new Container()

  constructor(private bombMap: BombMap, private x: number, private y: number, private points: number) {
    const view = bombMap.map.getView()
    const mainScene = view.getScene('main')
    if (!mainScene) throw new Error('Main scene not loaded yet!')

    // Draw a star for the item
    const star = new Graphics()
    star.star(
      PIXEL_SIZE / 2, // x
      PIXEL_SIZE / 2, // y
      5,              // number of points
      PIXEL_SIZE / 2.2, // radius
      PIXEL_SIZE / 4.5, // inner radius
      0               // rotation
    )
    .fill(0xFFD700) // Gold color
    .stroke({ width: 2, color: 0xFF4500 }) // Orange-Red outline

    this.container.addChild(star)

    // Add text for the points
    const text = new Text({
      text: `${points}`,
      style: {
        fontSize: 40, // Render at a higher font size for crispness
        fill: 0x32CD32,
        align: 'center',
        stroke: { color: 0x000000, width: 2, join: 'round' }, // Add a stroke for better visibility
      },
    })
    text.scale.set(0.2) // Scale it down to an appropriate size
    text.anchor.set(0.5)
    text.position.set(PIXEL_SIZE / 2, PIXEL_SIZE / 2)
    this.container.addChild(text)

    mainScene.addContainer(this.container, x, y)
  }

  remove() {
    // this.container.destroy()
    this.explode()
    const star = this.container.getChildAt(0) as Graphics
    star.clear()
  }

  explode() {
    const flash = new Graphics()
    flash.circle(0, 0, PIXEL_SIZE / 3)
      .fill({ color: 0xFF0000, alpha: 0.9})
    flash.pivot.set(0, 0)
    flash.x = PIXEL_SIZE / 2
    flash.y = PIXEL_SIZE / 2
    flash.scale.set(1)
    this.container.addChild(flash)

    const view = this.bombMap.map.getView()
    const unsub = view.subscribe('tick', (e: CustomEvent<number>) => {
      const delta = Math.min(e.detail, 40)
      animateFlash(delta)
    })

    let flashElapsedTime = 0

    const text = this.container.getChildAt(1) as Text

    const animateFlash = (delta: number) => {
      flashElapsedTime += delta
      let progress = flashElapsedTime / flashAnimationTime
      if (progress > 1) progress = 1

      const easeOut = 1 - Math.pow(1 - progress, 3)
      
      flash.scale.set(1 + easeOut * 2.5)
      flash.alpha = 1 - easeOut

      text.scale.set(0.2 + easeOut * 0.4)
      text.alpha = 1.2 - easeOut

      if (progress === 1) {
        unsub()
        this.container.destroy()
      }
    }
  }
}
