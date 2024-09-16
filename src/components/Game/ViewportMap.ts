import { Assets, Container, Graphics, type Renderer, Sprite, WebGLRenderer, WebGPURenderer } from 'pixi.js'
import { Viewport } from 'pixi-viewport'
import { Minimap } from './Minimap'

const WORLD_WIDTH = 3000
const WORLD_HEIGHT = 3000
const PIXEL_SIZE = 30

interface PixelArea {
  x: number
  y: number
  w: number
  h: number
}

export class ViewportMap {
  renderer: Renderer
  viewport: Viewport | undefined
  container: Container | undefined

  wrapper: Container | undefined
  minimap: Minimap | undefined

  constructor() {
    this.renderer = new WebGLRenderer()
  }

  updateMinimap() {
    if (!this.viewport || !this.minimap || !this.container) return

    const { top, left, worldScreenWidth, worldScreenHeight, worldWidth, worldHeight } = this.viewport
    this.minimap.update(worldWidth, worldHeight, top, left, worldScreenWidth, worldScreenHeight, this.container)
  }

  resize(w: number, h: number) {
    if (!this.viewport) return
    console.log('resize', w, h)

    this.renderer.resize(w, h)
    this.viewport.resize(w, h)
    this.updateMinimap()
  }

  async init(canvas: HTMLCanvasElement) {
    const screenWidth = canvas.width
    const screenHeight = canvas.height
    console.log(screenWidth, screenHeight)
    await this.renderer.init({ canvas, width: screenWidth, height: screenHeight, antialias: true, backgroundColor: 0xffffff })
    const viewport = this.viewport = new Viewport({
      screenWidth,
      screenHeight,
      worldWidth: WORLD_WIDTH,    // update when open scene
      worldHeight: WORLD_HEIGHT,  // update when open scene
      passiveWheel: false,
      events: this.renderer.events,
    })

    const container = this.container = new Container()
    viewport.addChild(container)

    this.wrapper = new Container()
    this.minimap = new Minimap(this.renderer)
    this.minimap.container.position.set(10, 10)

    this.wrapper.addChild(viewport)
    this.wrapper.addChild(this.minimap.container)
    viewport
      .drag()
      .pinch()
      .decelerate({
        friction: 0.95
      })
      .wheel()
      .clamp({direction: 'all'})
      .clampZoom({minScale: 1, maxScale: 3})

    for (const [x, y] of [[160,160], [600, 600], [160, 600], [600, 160]]) {
      const rect = new Graphics()
      rect.rect(x, y, 120, 120)
      rect.fill('green')
      this.container.addChild(rect)
    }

    viewport.moveCenter(WORLD_WIDTH / 2, WORLD_HEIGHT / 2)

    this.updateMinimap()
    this.drawGrid()
    this.runUpdate()

    viewport.on('clicked', (e) => {
      console.log('clicked', e.screen, e.world)
    })

    viewport.on('zoomed', () => this.updateMinimap())
    viewport.on('moved', () => this.updateMinimap())

    viewport.on('drag-start', (e) => {
      console.log('drag-start', e.screen, e.world)
    })

    viewport.on('drag-end', (e) => {
      if (!this.viewport) return

      console.log('drag-end', e.screen, e.world)
      const { width, height, worldHeight, worldWidth, x, y, screenHeight, screenWidth, screenHeightInWorldPixels, screenWidthInWorldPixels } = viewport
      console.log(width, height, worldHeight, worldWidth, x, y, screenHeight, screenWidth, screenHeightInWorldPixels, screenWidthInWorldPixels)
    })

    canvas.addEventListener('mousedown', (e) => {
      const screenX = e.pageX - canvas.offsetLeft
      const screenY = e.pageY - canvas.offsetTop
      console.log(screenX, screenY)

      // continue calculate pixelX, pixelY follow the above formula
      const scaled = viewport.scaled
      const worldX = (screenX - viewport.x) / scaled
      const worldY = (screenY - viewport.y) / scaled

      console.log('Pixel xy', Math.floor(worldX / PIXEL_SIZE), Math.floor(worldY / PIXEL_SIZE))
    })

    return canvas
  }

  moveCenter() {
    this.viewport?.moveCenter(WORLD_WIDTH / 2, WORLD_HEIGHT / 2)
    this.updateMinimap()
  }

  async addImage(url: string, area: PixelArea) {
    if (!this.viewport || !this.container) return

    const texture = await Assets.load(url)
    const image = new Sprite(texture)

    image.x = area.x * PIXEL_SIZE
    image.y = area.y * PIXEL_SIZE
    image.width = area.w * PIXEL_SIZE
    image.height = area.h * PIXEL_SIZE

    this.container.addChild(image)

    this.viewport.dirty = true
  }

  private runUpdate() {
    if (!this.viewport || !this.wrapper) return

    if (this.viewport.dirty) {
      this.renderer.render(this.wrapper)
      this.viewport.dirty = false
    }

    requestAnimationFrame(() => this.runUpdate())
  }

  private drawGrid() {
    if (!this.viewport) return

    const g = new Graphics()
    this.viewport.addChild(g)
    // g.lineStyle(1, 0x888888, 0.4, undefined, true)
    // g.setStrokeStyle(1)
    //   .setFillStyle()

    const pixelWidth = WORLD_WIDTH / PIXEL_SIZE
    const pixelHeight = WORLD_HEIGHT / PIXEL_SIZE

    // draw vertical lines
    for (let i = 0; i <= pixelWidth; i++) {
      const pos = i * PIXEL_SIZE
      g.moveTo(pos, 0)
      g.lineTo(pos, WORLD_HEIGHT)
      // g.fill(0xff3300)
      g.stroke({ width: 0.4, color: 0x888888,  })
    }

    // draw horizon lines
    for (let i = 0; i <= pixelHeight; i++) {
      const pos = i * PIXEL_SIZE
      g.moveTo(0, pos)
      g.lineTo(WORLD_WIDTH, pos)
      // g.fill(0xff3300)
      g.stroke({ width: 0.4, color: 0x888888 })
    }
  }
}