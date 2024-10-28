import { DragEvent } from 'react'

import { Assets, Container, Graphics, type Renderer, Sprite, Texture, WebGLRenderer } from 'pixi.js'
import { Viewport } from 'pixi-viewport'

import { Minimap } from './Minimap'

export const PIXEL_SIZE = 40

const MAP_W = 100
const MAP_H = 100

const WORLD_HEIGHT = PIXEL_SIZE * MAP_H
const WORLD_WIDTH = PIXEL_SIZE * MAP_W

export function positionToXY(p: number): [number, number] {
  const x = p % MAP_W
  const y = Math.floor(p / MAP_W)

  return [x, y]
}

export function xyToPosition(x: number, y: number): number {
  return y * MAP_W + x
}

export interface PixelArea {
  x: number
  y: number
  w: number
  h: number
}

export interface ViewportMapOptions {
  onDrop?: (data: DataTransfer, px: number, py: number) => void
}

export class ViewportMap {
  renderer: Renderer
  viewport: Viewport | undefined
  container: Container

  wrapper: Container
  minimap: Minimap | undefined

  eventTarget = new EventTarget()

  constructor(public canvas: HTMLCanvasElement, public options: ViewportMapOptions = {}) {
    this.renderer = new WebGLRenderer()
    this.wrapper = new Container()
    this.container = new Container()
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

  async init() {
    const canvas = this.canvas

    const screenWidth = 100
    const screenHeight = 100
    await this.renderer.init({ canvas, width: 100, height: 100, antialias: true, backgroundColor: 0xffffff })
    
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
      .clampZoom({minScale: 1, maxScale: 20})

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
      // console.log('clicked', e.screen, e.world)
    })

    viewport.on('zoomed', () => this.updateMinimap())
    viewport.on('moved', () => this.updateMinimap())

    viewport.on('drag-start', (e) => {
      // console.log('drag-start', e.screen, e.world)
    })

    viewport.on('drag-end', (e) => {
      if (!this.viewport) return

      // console.log('drag-end', e.screen, e.world)
      const { width, height, worldHeight, worldWidth, x, y, screenHeight, screenWidth, screenHeightInWorldPixels, screenWidthInWorldPixels } = viewport
      console.log(width, height, worldHeight, worldWidth, x, y, screenHeight, screenWidth, screenHeightInWorldPixels, screenWidthInWorldPixels)
    })

    const mousedown = (e: MouseEvent) => {
      const [px, py, rawx, rawy] = this.getPixelXY(e)
      this.eventTarget.dispatchEvent(new CustomEvent<[number, number, number, number]>('pixeldown', {detail: [px, py, rawx, rawy]}))
      console.log('Pixel down xy', px, py)
    }

    const mouseup = (e: MouseEvent) => {
      const [px, py] = this.getPixelXY(e)
      this.eventTarget.dispatchEvent(new CustomEvent<[number, number]>('pixelup', {detail: [px, py]}))
      console.log('Pixel up xy', px, py)
    }

    let curx = -1, cury = -1
    const mousemove = (e: MouseEvent) => {
      const [px, py] = this.getPixelXY(e)
      if (curx !== px || cury !== py) {
        this.eventTarget.dispatchEvent(new CustomEvent<[number, number]>('pixelmove', {detail: [px, py]}))
        curx = px
        cury = py
      }
    }

    // pixel down
    // canvas.addEventListener('mousedown', mousedown)
    canvas.addEventListener('pointerdown', mousedown)

    // pixel up
    // canvas.addEventListener('mouseup', mouseup)
    canvas.addEventListener('pointerup', mouseup)

    // pixel move
    // canvas.addEventListener('mousemove', mousemove)
    canvas.addEventListener('pointermove', mousemove)

    canvas.addEventListener('dragover', (e) => e.preventDefault())
    canvas.addEventListener('drop', (e) => {
      const [px, py, rawx, rawy] = this.getPixelXY(e)
      console.log('Dropped', e.dataTransfer, px, py)
      if (e.dataTransfer && this.options.onDrop) this.options.onDrop(e.dataTransfer, px, py)
    })

    return canvas
  }

  // subcribe
  subscribe(type: string, func: (e: CustomEvent) => void) {
    this.eventTarget.addEventListener(type, func as EventListener)

    return () => this.eventTarget.removeEventListener(type, func as EventListener)
  }

  // subcribe once
  subscribeOnce(type: string, func: (e: CustomEvent) => void) {
    const unsub = this.subscribe(type, (e) => {
      func(e)
      unsub()
    })
  }

  getPixelXY(e: {pageX: number, pageY: number}): [number, number, number, number] {
    const canvas = this.canvas
    const viewport = this.viewport
    if (!viewport) return [0, 0, 0, 0]

    const screenX = e.pageX - canvas.offsetLeft
    const screenY = e.pageY - canvas.offsetTop

    // continue calculate pixelX, pixelY follow the above formula
    const scaled = viewport.scaled
    const worldX = (screenX - viewport.x) / scaled
    const worldY = (screenY - viewport.y) / scaled

    const [px, py] = [Math.floor(worldX / PIXEL_SIZE), Math.floor(worldY / PIXEL_SIZE)]

    return [px, py, screenX, screenY]
  }

  moveCenter() {
    this.viewport?.moveCenter(WORLD_WIDTH / 2, WORLD_HEIGHT / 2)
    this.updateMinimap()
  }

  markDirty() {
    if (this.viewport) this.viewport.dirty = true
  }

  pauseDrag() {
    if (this.viewport) this.viewport.plugins.pause('drag')
  }

  resumeDrag() {
    if (this.viewport) this.viewport.plugins.resume('drag')
  }

  getPixelSize(): number {
    return PIXEL_SIZE
  }

  async animate(area: PixelArea, frameCount: number, prefix = '', slow = 3): Promise<void> {
    const container = await this.addImage('', area)
    const sprite = container.getChildAt(0) as Sprite

    let count = 0
    const unsub = this.subscribe('tick', () => {
      if (count % slow === 0) {
        // next frame
        const frameNum = count / slow
        const frameStr = (frameNum < 10 ? `0` : '') + `${frameNum}`
        
        console.log('Render animation', frameNum)
        // update to next frame
        const t = Texture.from(`${prefix}${frameStr}.png`)
        sprite.texture = t
        
        if (frameNum === frameCount) {
          // stop animation
          container.parent.removeChild(container)
          unsub()
          count = 0
        }
      }
      count ++
      this.markDirty()
    })

    // kick-off animation
    this.markDirty()
  }

  addImage(url: string, area: PixelArea, container?: Container): Container {
    if (!this.viewport || !this.container) return new Container()

    // create container
    container = container ? container : new Container()

    container.x = area.x * PIXEL_SIZE
    container.y = area.y * PIXEL_SIZE

    // add image
    const image = new Sprite(url ? Texture.from(url) : undefined)
    if (area.w && area.h) {
      image.width = area.w * PIXEL_SIZE
      image.height = area.h * PIXEL_SIZE
    }
    container.addChild(image)

    this.container.addChild(container)

    this.viewport.dirty = true

    return container
  }

  private runUpdate() {
    if (!this.viewport || !this.wrapper) return

    if (this.viewport.dirty) {
      this.renderer.render(this.wrapper)
      this.viewport.dirty = false
      this.eventTarget.dispatchEvent(new Event('tick'))
    }

    requestAnimationFrame(() => this.runUpdate())
  }

  private drawGrid() {
    if (!this.viewport) return

    const g = new Graphics()
    this.viewport.addChild(g)

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