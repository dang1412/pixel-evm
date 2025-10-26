import { Container, Graphics } from 'pixi.js'

import { BombMap } from './BombMap'
import { PIXEL_SIZE } from '../utils'

const duration = 1500

/**
 * Represents the explosion animation using particles.
 */
export class Explosion {
  private particles: Particle[] = []

  private container = new Container()

  private duration = duration

  constructor(bombMap: BombMap, x: number, y: number) {
    const view = bombMap.map.getView()
    const main = view.getScene('main')
    if (!main) {
      throw new Error('main scene not initialized yet!')
    }

    main.addContainer(this.container, x, y)

    this.createParticles()
  }

  createParticles() {
    const maxParticles = 6
    const colors = [0xFFD700, 0xFFA500, 0xFF4500, 0xFFFFFF]

    // Center particles
    for (let i = 0; i < maxParticles; i++) {
      this.particles.push(this.createParticle(0, 0, colors))
    }
  }

  createParticle(x: number, y: number, colors: number[]) {
    const particle = new Particle(x, y, colors)
    this.particles.push(particle)
    this.container.addChild(particle.g)

    return particle
  }

  // return done or not
  update(delta: number) {
    this.duration -= delta
    if (this.duration <= 0) {
      this.container.destroy()
      return true
    }

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.update(delta)
    }

    return false
  }
}

class Particle {
  g = new Graphics()
  private vx = 0
  private vy = 0
  private life = duration

  private pixelX: number
  private pixelY: number

  constructor(private x: number, private y: number, private colors: number[]) {
    this.g
      .circle(0, 0, Math.random() * 8 + 4)
      .fill(colors[Math.floor(Math.random() * colors.length)])
      // .fill(colors[0])

    this.pixelX = x * PIXEL_SIZE
    this.pixelY = y * PIXEL_SIZE

    const randx = Math.random() - 0.5
    const randy = Math.random() - 0.5
    this.g.x = this.pixelX + PIXEL_SIZE / 2 + randx * PIXEL_SIZE;
    this.g.y = this.pixelY + PIXEL_SIZE / 2 + randy * PIXEL_SIZE;

    this.vx = -randx * 4;
    this.vy = -randy * 4;
  }

  update(delta: number) {
    const g = this.g

    g.x += this.vx
    if (g.x < this.pixelX || g.x > this.pixelX + PIXEL_SIZE) this.vx = -this.vx

    g.y += this.vy
    if (g.y < this.pixelY || g.y > this.pixelY + PIXEL_SIZE) this.vy = -this.vy

    g.scale.set(g.scale.x * 0.97)
    this.life -= delta
    g.alpha = this.life / duration
  }
}
