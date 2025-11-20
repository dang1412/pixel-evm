import { Container, Graphics, Text } from 'pixi.js'
import { BombMap } from './BombMap'
import { PIXEL_SIZE } from '../utils'

const flashAnimationTime = 800
const appearAnimationTime = 600

export class MapItem {
  private container = new Container()

  constructor(private bombMap: BombMap, private x: number, private y: number, private points: number) {
    const view = bombMap.map.getView()
    const mainScene = view.getScene('main')
    if (!mainScene) throw new Error('Main scene not loaded yet!')

    // Determine star size based on points
    const starScale = this.getStarScale(points)

    // Randomly choose between multiple color schemes
    const colorSchemes = [
      { glow: 0xFFD700, fill: 0xFFD700, stroke: 0xFF4500, text: 0x32CD32 }, // Gold theme
      { glow: 0xFF1493, fill: 0x00FFFF, stroke: 0xFF00FF, text: 0xFFFF00 }, // Cyan/Magenta theme
      { glow: 0xFF69B4, fill: 0xFF1493, stroke: 0xFF69B4, text: 0xFFFFFF }, // Hot Pink theme
      { glow: 0x7B68EE, fill: 0x9370DB, stroke: 0x4B0082, text: 0x00FF00 }, // Purple theme
      { glow: 0xFF6347, fill: 0xFF0000, stroke: 0x8B0000, text: 0xFFD700 }, // Ruby theme
      { glow: 0x00CED1, fill: 0x48D1CC, stroke: 0x20B2AA, text: 0xFF69B4 }, // Turquoise theme
    ]
    const colors = colorSchemes[Math.floor(Math.random() * colorSchemes.length)]

    // Glow effect
    const glow = new Graphics()
    glow.circle(PIXEL_SIZE / 2, PIXEL_SIZE / 2, PIXEL_SIZE * starScale)
        .fill({ color: colors.glow, alpha: 0.5 })
    this.container.addChild(glow)

    // Draw a star for the item
    const star = new Graphics()
    star.star(
      PIXEL_SIZE / 2, // x
      PIXEL_SIZE / 2, // y
      5,              // number of points
      (PIXEL_SIZE / 2.2) * starScale, // radius
      (PIXEL_SIZE / 4.5) * starScale, // inner radius
      0               // rotation
    )
    .fill(colors.fill) // Gold or Silver
    .stroke({ width: 2 * starScale, color: colors.stroke }) // Orange-Red or Royal Blue outline

    this.container.addChild(star)

    // Add text for the points
    const text = new Text({
      text: `${points}`,
      style: {
        fontSize: 40 * Math.max(starScale, 1), // Render at a higher font size for crispness
        fill: colors.text,
        align: 'center',
        stroke: { color: 0x000000, width: 2, join: 'round' }, // Add a stroke for better visibility
      },
    })
    text.scale.set(0.2) // Scale it down to an appropriate size
    text.anchor.set(0.5)
    text.position.set(PIXEL_SIZE / 2, PIXEL_SIZE / 2)
    this.container.addChild(text)

    mainScene.addContainer(this.container, x, y)

    this.container.scale.set(0)
    this.appear()
  }

  appear() {
    const view = this.bombMap.map.getView()
    const unsub = view.subscribe('tick', (e: CustomEvent<number>) => {
      const delta = Math.min(e.detail, 40)
      animateAppear(delta)
    })

    let appearElapsedTime = 0
    const glow = this.container.getChildAt(0) as Graphics

    const animateAppear = (delta: number) => {
      appearElapsedTime += delta
      let progress = appearElapsedTime / appearAnimationTime
      if (progress > 1) progress = 1

      const c4 = (2 * Math.PI) / 3
      const scale = progress === 0
        ? 0
        : progress === 1
        ? 1
        : Math.pow(2, -10 * progress) * Math.sin((progress * 10 - 0.75) * c4) + 1
      
      this.container.scale.set(scale)
      glow.alpha = Math.sin(progress * Math.PI) * 0.7

      if (progress === 1) {
        unsub()
        glow.destroy()
      }
    }
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

  private getStarScale(points: number): number {
    // Linear interpolation: points 0->100 maps to scale 0.6->1.4
    // Formula: scale = 0.6 + (points / 100) * (1.4 - 0.6)
    return 0.8 + (points / 100) * 0.6
  }
}
