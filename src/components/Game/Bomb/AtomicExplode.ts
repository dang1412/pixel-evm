import { Color, Container, Graphics } from 'pixi.js'

import { PIXEL_SIZE } from '../utils'
import { BombMap } from './BombMap'

export class AtomicExplode {
  private container = new Container()

  constructor(private bombMap: BombMap, x: number, y: number, private color: number = 0xFF0000) {
    const mainScene = bombMap.map.getView().getScene('main')
    if (!mainScene) throw new Error('Main scene not loaded yet!')

    mainScene.addContainer(this.container, x, y)
    this.play()
  }

  private play() {
    const explosionTime = 800 // 1 giây cho toàn bộ hiệu ứng
    const flashTime = explosionTime * 0.2 // Thời gian hào quang
    const shockwaveMaxRadius = PIXEL_SIZE * 10 // Sóng lan rộng bao xa
    // dark green for atomic bomb
    // const color = 0x333333
    // const color = 0xFF0000
    let elapsedTime = 0

    // 1. Hào quang trung tâm (rất nhanh)
    const flash = new Graphics()
    flash.circle(0, 0, PIXEL_SIZE * 1.5) // Hào quang lớn
      .fill({ color: this.color, alpha: 0.9 }) // Màu trắng
    flash.x = flash.y = PIXEL_SIZE / 2
    flash.scale.set(0.5)
    flash.alpha = 1.0
    this.container.addChild(flash)

    // 2. Sóng xung kích lan rộng
    const shockwave = new Graphics()
    shockwave.x = shockwave.y = PIXEL_SIZE / 2
    this.container.addChild(shockwave)

    const view = this.bombMap.map.getView()
    const unsub = view.subscribe('tick', (e: CustomEvent<number>) => {
      const delta = Math.min(e.detail, 40)
      animateBomb(delta)
    })
    
    const animateBomb = (delta: number) => {
      elapsedTime += delta;
      let progress = elapsedTime / explosionTime
      if (progress > 1) progress = 1

      // Dùng easeOutCubic để hiệu ứng bắt đầu nhanh và chậm dần
      const easeOutCubic = 1 - Math.pow(1 - progress, 3)
      
      // 1. Hào quang 
      if (elapsedTime <= flashTime) {
        const flashProgress = elapsedTime / flashTime
        flash.alpha = 1.0 - flashProgress; // Mờ dần nhanh
        flash.scale.set(0.5 + flashProgress * 2.5) // Phồng to
      } else if (flash.parent) {
        flash.destroy() // Xóa hào quang
      }

      // 2. Sóng xung kích
      const currentRadius = easeOutCubic * shockwaveMaxRadius;
      const currentAlpha = 1.0 - easeOutCubic // Mờ dần khi lan rộng
      const currentWidth = 1 + (1 - easeOutCubic) * 10 // Mỏng dần khi lan rộng

      shockwave.clear() // Xóa vòng tròn cũ
      shockwave
        .circle(0, 0, currentRadius) // Vẽ vòng tròn mới
        .stroke({ width: currentWidth, color: this.color, alpha: currentAlpha })

      if (progress === 1) {
        unsub()
        shockwave.destroy() // Xóa sóng
        this.container.destroy()
      }
    }
  }
}