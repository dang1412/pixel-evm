import { Color, Container, Graphics } from 'pixi.js'

import { PIXEL_SIZE } from '../utils'

import { BombMap } from './BombMap'
import { Explosion } from './Explosion'

export class Bomb {
  container = new Container()
  spark = new Graphics()
  timer = 3000

  private explosion: Explosion | undefined
  // private unsubTick: () => void


  constructor(private bombMap: BombMap, private x: number, private y: number) {
    // Draw the bomb body
    const bombBody = new Graphics()
        .circle(PIXEL_SIZE / 2, PIXEL_SIZE / 2, PIXEL_SIZE * 0.4)
        .fill(0x333333)
    this.container.addChild(bombBody)

    const view = bombMap.map.getView()

    const mainScene = view.getScene('main')
    if (!mainScene) throw new Error('Main scene not loaded yet!')

    mainScene.addContainer(this.container, x, y)

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

    // this.timer = 3000
    // this.unsubTick = view.subscribe('tick', (e: CustomEvent<number>) => {
    //   const delta = Math.min(e.detail, 20)
    //   if (this.explosion) {
    //     console.log('Exploding')
    //     if (!this.explosion.update(delta)) {
    //       console.log('Stopped')
    //       unsubTick()
    //     }
    //   } else {
    //     this.update(delta)
    //   }
    //   view.markDirty()
    // })
  }

  update(deltaTime: number) {
    // this.timer -= deltaTime
    // console.log(this.timer, deltaTime)
    
    const pulse = Math.abs(Math.sin(Date.now() / 100))
    this.spark.alpha = pulse
    this.spark.tint = new Color([1, pulse, 0]).toNumber()

    // if (this.timer <= 0) {
    //   this.explode()
    // }
  }

  remove() {
    // if (explosionSynth) {
    //   explosionSynth.triggerAttackRelease("8n");
    // }

    // bombs = bombs.filter(b => b !== this);
    
    // const randomBlastRadius = Math.floor(Math.random() * 5) + 1; 
    // explosions.push(new Explosion(this.gridX, this.gridY, randomBlastRadius));

    // this.explosion = new Explosion(this.bombMap, this.x, this.y, 3)
    
    // this.unsubTick()
    this.container.destroy()
  }
}
