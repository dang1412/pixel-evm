import { Sprite, Texture } from 'pixi.js'

export class PixiAnimation {
  private animationStopMap: {[uid: number]: () => void} = {}

  constructor(public tick: (func: (delta: number) => void) => () => void) {}

  animate(sprite: Sprite, frames: Texture[], tickPerFrame: number, onloop: () => void) {
    this.stopAnimation(sprite)

    let tickCount = 0
    let frameCount = 0
    const unsub = this.tick((delta) => {
      if (tickCount++ % tickPerFrame === 0) {
        if (frameCount >= frames.length) {
          // done 1 loop
          tickCount = 0
          frameCount = 0
          onloop()
        } else {
          const texture = frames[frameCount++]
          if (texture) {
            // next frame
            sprite.texture = texture
            // set anchor
            const {x, y} = texture.defaultAnchor || {x: 0, y: 0}
            sprite.anchor.set(x,y)
          }
        }
      }
    })

    this.animationStopMap[sprite.uid] = unsub

    return unsub
  }

  async animateOnce(sprite: Sprite, frames: Texture[], tickPerFrame: number): Promise<void> {
    return new Promise((res) => {
      const stop = this.animate(sprite, frames, tickPerFrame, () => {
        stop()
        res()
      })
    })
  }

  stopAnimation(sprite: Sprite) {
    if (this.animationStopMap[sprite.uid]) this.animationStopMap[sprite.uid]()
  }
}
