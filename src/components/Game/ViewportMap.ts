import { Container, Graphics, type Renderer, Sprite, Texture, WebGLRenderer } from 'pixi.js'
import { Viewport } from 'pixi-viewport'

import { Minimap } from './Minimap'
import { MAP_H, MAP_W, PIXEL_SIZE } from './utils'
import { ViewportScene } from './ViewportScene'

const WORLD_HEIGHT = PIXEL_SIZE * MAP_H
const WORLD_WIDTH = PIXEL_SIZE * MAP_W

export interface PixelArea {
  x: number
  y: number
  w: number
  h: number
}

export interface ViewportMapOptions {
  onDrop?: (data: DataTransfer, px: number, py: number) => void
}

export interface DragOptions {
  onDrop: (x: number, y: number) => void
  onMove?: (x: number, y: number) => void
  w?: number
  h?: number
}

export class ViewportMap {
  renderer: Renderer
  viewport: Viewport | undefined

  wrapper: Container
  minimap: Minimap | undefined

  eventTarget = new EventTarget()

  scenes: {[name: string]: ViewportScene} = {}
  activeScene = ''

  constructor(public canvas: HTMLCanvasElement, public options: ViewportMapOptions = {}) {
    this.renderer = new WebGLRenderer()
    this.wrapper = new Container()
  }

  addScene(name: string, pixelWidth: number, pixelHeight: number, bgUrl = ''): ViewportScene {
    const scene = new ViewportScene(this, pixelWidth, pixelHeight, bgUrl)
    this.scenes[name] = scene

    if (!this.activeScene) {
      this.activate(name)
    }

    this.eventTarget.dispatchEvent(new CustomEvent('sceneadded', { detail: name }))

    return scene
  }

  getActiveScene(): ViewportScene | undefined {
    const scene = this.scenes[this.activeScene]
    return scene
  }

  activate(name: string) {
    if (this.activeScene === name) return

    const scene = this.scenes[name]
    if (scene && this.viewport) {
      const prev = this.getActiveScene()
      if (prev) {
        this.viewport.removeChild(prev.container)
      }
      console.log('Activate', name)
      this.activeScene = name
      this.viewport.addChild(scene.container)

      const newWorldWidth = PIXEL_SIZE * scene.pixelWidth
      const newWorldHeight = PIXEL_SIZE * scene.pixelHeight
      const { screenWidth, screenHeight, worldWidth, worldHeight } = this.viewport
      console.log(screenWidth, screenHeight, worldWidth, worldHeight, '---', newWorldWidth, newWorldHeight)
      this.viewport.resize(screenWidth, screenHeight, newWorldWidth, newWorldHeight)
      this.viewport.fitWidth()
      this.viewport.moveCenter(newWorldWidth / 2, newWorldHeight / 2)
      this.updateMinimap()
      this.markDirty()

      this.eventTarget.dispatchEvent(new CustomEvent('sceneactivated', { detail: name }))
    }
  }

  updateMinimap() {
    const scene = this.getActiveScene()
    if (!this.viewport || !this.minimap || !scene) return

    const { top, left, worldScreenWidth, worldScreenHeight, worldWidth, worldHeight } = this.viewport
    this.minimap.update(worldWidth, worldHeight, top, left, worldScreenWidth, worldScreenHeight, scene.container)
  }

  resize(w: number, h: number) {
    if (!this.viewport) return
    console.log('resize', w, h)

    this.renderer.resize(w, h)
    this.viewport.resize(w, h)
    this.updateMinimap()
  }

  async init(w: number, h: number) {
    const canvas = this.canvas

    await this.renderer.init({ canvas, width: w, height: h, antialias: true, backgroundColor: 0xffffff })

    const viewport = this.viewport = new Viewport({
      screenWidth: w,
      screenHeight: h,
      worldWidth: WORLD_WIDTH,    // update when open scene
      worldHeight: WORLD_HEIGHT,  // update when open scene
      passiveWheel: false,
      events: this.renderer.events,
    })

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

    viewport.moveCenter(WORLD_WIDTH / 2, WORLD_HEIGHT / 2)
    // this.drawGrid()
    this.runUpdate()

    viewport.on('clicked', (e) => {
      // console.log('clicked', e.screen, e.world)
    })

    viewport.on('zoomed', () => this.updateMinimap())
    viewport.on('moved', () => {
      this.updateMinimap()
      downPx = -1, downPy = -1
    })

    viewport.on('drag-start', (e) => {
      // console.log('drag-start', e.screen, e.world)
    })

    viewport.on('drag-end', (e) => {
      if (!this.viewport) return

      // console.log('drag-end', e.screen, e.world)
      const { width, height, worldHeight, worldWidth, x, y, screenHeight, screenWidth, screenHeightInWorldPixels, screenWidthInWorldPixels } = viewport
      console.log(width, height, worldHeight, worldWidth, x, y, screenHeight, screenWidth, screenHeightInWorldPixels, screenWidthInWorldPixels)
    })

    let downPx = -1, downPy = -1
    const mousedown = (e: MouseEvent) => {
      const [px, py, rawx, rawy] = this.getPixelXY(e)
      downPx = px
      downPy = py
      this.eventTarget.dispatchEvent(new CustomEvent<[number, number, number, number]>('pixeldown', {detail: [px, py, rawx, rawy]}))
      console.log('Pixel down xy', px, py)
    }

    const mouseup = (e: MouseEvent) => {
      const [px, py] = this.getPixelXY(e)
      this.eventTarget.dispatchEvent(new CustomEvent<[number, number]>('pixelup', {detail: [px, py]}))
      console.log('Pixel up xy', px, py)
      if (downPx === px && downPy === py) {
        // clicked
        this.eventTarget.dispatchEvent(new CustomEvent<[number, number]>('pixelclick', {detail: [px, py]}))
        downPx = downPy = -1
        console.log('Pixel click xy', px, py)
      }
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

  startDrag(image: string, {onDrop, onMove = (x, y) => {}, w = 0, h = 0}: DragOptions) {
    const scene = this.getActiveScene()
    if (!scene) return
    const shadow = scene.addImage(image, {x: -1, y: 0, w, h})
    shadow.alpha = 0.4

    const transform = ([x, y]: [number, number]) => [x, y]

    const unsub = this.subscribe('pixelmove', (e: CustomEvent<[number, number]>) => {
      const [px, py] = transform(e.detail)
      shadow.x = px * PIXEL_SIZE
      shadow.y = py * PIXEL_SIZE
      onMove(px, py)
      this.markDirty()
    })

    this.subscribeOnce('pixelup', (e: CustomEvent<[number, number]>) => {
      const [px, py] = transform(e.detail)
      unsub()
      shadow.parent.removeChild(shadow)
      onDrop(px, py)

      this.markDirty()
    })
  }

  moveObject(object: Container, px: number, py: number, tx = px, ty = py): Promise<void> {
    let x = px * PIXEL_SIZE
    let y = py * PIXEL_SIZE

    const tarX = tx * PIXEL_SIZE
    const tarY = ty * PIXEL_SIZE

    const deltaX = tarX - x
    const deltaY = tarY - y

    this.markDirty()

    return new Promise((res) => {
      const unsub = this.subscribe('tick', () => {
        // moving in 15 ticks
        x += deltaX / 15
        y += deltaY / 15
        
        if (deltaX >= 0 === x >= tarX) x = tarX
        if (deltaY >= 0 === y >= tarY) y = tarY

        object.x = x
        object.y = y

        this.markDirty()
        
        if (x === tarX && y === tarY) {
          unsub()
          res()
        }
      })
    })
  }

  // async animate(area: PixelArea, frameCount: number, prefix = '', slow = 3): Promise<void> {
  //   const container = await this.addImage('', area)
  //   const sprite = container.getChildAt(0) as Sprite

  //   let count = 0
  //   const unsub = this.subscribe('tick', () => {
  //     if (count % slow === 0) {
  //       // next frame
  //       const frameNum = count / slow
  //       const frameStr = (frameNum < 10 ? `0` : '') + `${frameNum}`

  //       // update to next frame
  //       const t = Texture.from(`${prefix}${frameStr}.png`)
  //       sprite.texture = t
        
  //       if (frameNum === frameCount) {
  //         // stop animation
  //         container.parent.removeChild(container)
  //         unsub()
  //         count = 0
  //       }
  //     }
  //     count ++
  //     this.markDirty()
  //   })

  //   // kick-off animation
  //   this.markDirty()
  // }

  private runUpdate() {
    let lastrun = performance.now()
    const tick = () => {
      if (this.viewport?.dirty) {
        this.renderer.render(this.wrapper)
        this.viewport.dirty = false
  
        // calculate tick duration
        const current = performance.now()
        const delta = current - lastrun
        lastrun = current
        this.eventTarget.dispatchEvent(new CustomEvent<number>('tick', { detail: delta }))
      }
      requestAnimationFrame(tick)
    }

    tick()
  }
}