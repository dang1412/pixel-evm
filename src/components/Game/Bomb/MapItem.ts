import { Color, Container, Graphics, Text } from 'pixi.js'

import { BombMap } from './BombMap'
import { PIXEL_SIZE, positionToXY } from '../utils'
import { starColorSchemes } from './constant'
import { ItemState, ItemType } from './types'

const flashAnimationTime = 800
const appearAnimationTime = 600
const fattenAnimationTime = 800

export class MapItem {
  private container = new Container()
  private star: Graphics | null = null

  constructor(private bombMap: BombMap, private state: ItemState) {
    const { pos, points, colorIndex } = state
    const view = bombMap.map.getView()
    const mainScene = view.getScene('main')
    if (!mainScene) throw new Error('Main scene not loaded yet!')

    // Determine star size based on points
    const starScale = this.getStarScale(points)

    const colors = starColorSchemes[colorIndex]

    // Glow effect
    const glow = new Graphics()
    glow.circle(PIXEL_SIZE / 2, PIXEL_SIZE / 2, PIXEL_SIZE * starScale)
        .fill({ color: colors.glow, alpha: 0.5 })
    this.container.addChild(glow)

    // Draw a star for the item
    const star = new Graphics()
    const isExplode = this.state.type === ItemType.StarExplode
    // Initially render all stars as slim; StarExplode becomes fat on activate()
    const outerRadius = this.drawStar(star, starScale, colors, 0)

    this.container.addChild(star)
    this.star = star

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

    // If StarExplode, add a fuse like a bomb
    if (isExplode) {
      // spark sits exactly at the top tip of the star
      const centerX = PIXEL_SIZE / 2
      const centerY = PIXEL_SIZE / 2
      const sparkX = centerX
      const sparkY = centerY - outerRadius - 3

      const spark = new Graphics()
        .circle(sparkX, sparkY, 4)
        .fill(0xFF0000)
      // add spark last so it renders on top
      this.container.addChild(spark)
    }

    const { x, y } = positionToXY(pos)
    mainScene.addContainer(this.container, x, y)

    this.container.scale.set(0)
    this.appear()
  }

  private appear() {
    const view = this.bombMap.map.getView()
    const unsub = view.subscribe('tick', (e: CustomEvent<number>) => {
      // if (this.bombMap.pausing) return
      const delta = Math.min(e.detail, 40)
      animateAppear(delta)
    })

    const colors = starColorSchemes[this.state.colorIndex]

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
        if (this.state.type === ItemType.StarBonus) {
          glow.alpha = 0.5
          glow.clear()
          glow.circle(PIXEL_SIZE / 2, PIXEL_SIZE / 2, PIXEL_SIZE * 3 / 4 )
            .fill({ color: colors.glow, alpha: 0.5 })
        } 
      }
    }
  }

  remove(point: number) {
    // remove glow
    this.container.removeChildAt(0)
    // stop animation if any
    this.stopActivate?.()
    // explode
    this.explode(point)
    // clear star
    this.star?.clear()
  }

  private stopActivate: (() => void) | null = null

  activate() {
    // add some animation later
    const isExplode = this.state.type === ItemType.StarExplode
    const spark = isExplode ? this.container.getChildAt(3) as Graphics : null
    if (isExplode && this.star && spark) {
      // Animate the star becoming fatter on activation
      const starScale = this.getStarScale(this.state.points)
      const colors = starColorSchemes[this.state.colorIndex]

      let fattenElapsedTime = 0
      const view = this.bombMap.map.getView()
      const unsub = view.subscribe('tick', (e: CustomEvent<number>) => {
        if (this.bombMap.pausing) return
        const delta = Math.min(e.detail, 40)
        
        // Animate the star getting fatter
        fattenElapsedTime += delta
        let progress = Math.min(fattenElapsedTime / fattenAnimationTime, 1)
        
        // Ease out cubic for smooth animation
        const easeOut = 1 - Math.pow(1 - progress, 3)
        
        // Redraw star with interpolated fatness (0 = slim, 1 = fat)
        this.star!.clear()
        this.drawStar(this.star!, starScale, colors, easeOut)
        
        // Make the spark flicker
        const pulse = Math.abs(Math.sin(Date.now() / 100))
        spark.alpha = pulse
        spark.tint = new Color([1, pulse, 0]).toNumber()
      })

      this.stopActivate = () => {
        unsub()
        spark.alpha = 0
      }
    }
  }

  private drawStar(star: Graphics, starScale: number, colors: typeof starColorSchemes[number], fatness: number) {
    // Fatness: 0 = slim, 1 = fat (interpolate for animation)
    
    // Interpolate between slim and fat values
    const slimOuterRadius = (PIXEL_SIZE / 2.2) * starScale
    const fatOuterRadius = (PIXEL_SIZE / 2) * starScale
    const outerRadius = slimOuterRadius + (fatOuterRadius - slimOuterRadius) * fatness
    
    const slimInnerRadius = (PIXEL_SIZE / 4.5) * starScale
    const fatInnerRadius = fatOuterRadius * 0.6
    const innerRadius = slimInnerRadius + (fatInnerRadius - slimInnerRadius) * fatness
    
    const slimStrokeWidth = 2 * starScale
    const fatStrokeWidth = 2.5 * starScale
    const strokeWidth = slimStrokeWidth + (fatStrokeWidth - slimStrokeWidth) * fatness

    star
      .star(
        PIXEL_SIZE / 2, // x
        PIXEL_SIZE / 2, // y
        5,              // number of points
        outerRadius,    // radius
        innerRadius,    // inner radius (larger for fat star)
        0               // rotation
      )
      .fill(colors.fill)
      .stroke({ width: strokeWidth, color: colors.stroke })
    
    return outerRadius
  }

  private explode(point: number) {
    const view = this.bombMap.map.getView()
    if (point <= 0) {
      // just destroy the next tick, no animation
      view.subscribeOnce('tick', () => {
        this.container.destroy()
      })
      return
    }

    const flash = new Graphics()
    flash.circle(0, 0, PIXEL_SIZE / 3)
      .fill({ color: 0xFF0000, alpha: 0.9})
    flash.pivot.set(0, 0)
    flash.x = PIXEL_SIZE / 2
    flash.y = PIXEL_SIZE / 2
    flash.scale.set(1)
    this.container.addChild(flash)

    
    const unsub = view.subscribe('tick', (e: CustomEvent<number>) => {
      if (this.bombMap.pausing) return
      const delta = Math.min(e.detail, 40)
      animateFlash(delta)
    })

    let flashElapsedTime = 0

    const text = this.container.getChildAt(1) as Text
    text.text = `${point}`

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
