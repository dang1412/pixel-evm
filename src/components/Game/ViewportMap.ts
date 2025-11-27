import { Container, Graphics, type Renderer, Sprite, Texture, WebGLRenderer } from 'pixi.js'
import { Viewport } from 'pixi-viewport'

import { Minimap } from './Minimap'
import { MAP_H, MAP_W, PIXEL_SIZE } from './utils'
import { ViewportScene } from './ViewportScene'
import { PixelArea } from './types'

const WORLD_HEIGHT = PIXEL_SIZE * MAP_H
const WORLD_WIDTH = PIXEL_SIZE * MAP_W

export interface ViewportMapOptions {
  selectable?: boolean
  onDrop?: (data: DataTransfer, px: number, py: number) => void
  backgroundColor?: number
}

export interface DragOptions {
  onDrop: (x: number, y: number, rx: number, ry: number) => void
  onMove?: (x: number, y: number, rx: number, ry: number) => void
  isInRange?: (x: number, y: number) => boolean
  x?: number
  y?: number
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

  initialize: Promise<void>
  private resolveInitialize!: () => void;

  constructor(public canvas: HTMLCanvasElement, public options: ViewportMapOptions = {}) {
    this.renderer = new WebGLRenderer()
    this.wrapper = new Container()
    const { selectable = true } = options
    if (selectable) this.setupSelect()

    // Create the promise and store the resolver
    this.initialize = new Promise<void>((resolve) => {
      this.resolveInitialize = resolve
    })
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

  removeScene(name: string) {
    const scene = this.scenes[name]
    if (scene) {
      scene.destroy()
      delete this.scenes[name]
      this.eventTarget.dispatchEvent(new CustomEvent('sceneremoved', { detail: name }))
    }
  }

  getActiveScene(): ViewportScene | undefined {
    return this.getScene(this.activeScene)
  }

  getScene(name: string): ViewportScene | undefined {
    return this.scenes[name]
  }

  activate(name: string) {
    if (this.activeScene === name) return

    const scene = this.scenes[name]
    if (scene && this.viewport) {
      const prev = this.getActiveScene()
      if (prev) {
        this.viewport.removeChild(prev.container)
        prev.closed()
      }
      console.log('Activate', name)
      this.activeScene = name
      this.viewport.addChild(scene.container)
      scene.opened()

      // this.updateMinimap()

      this.eventTarget.dispatchEvent(new CustomEvent('sceneactivated', { detail: name }))
      this.eventTarget.dispatchEvent(new Event('updated'))

      this.markDirty()
    }
  }

  // updateMinimap() {
  //   const scene = this.getActiveScene()
  //   if (!this.viewport || !this.minimap || !scene) return

  //   const { top, left, worldScreenWidth, worldScreenHeight, worldWidth, worldHeight } = this.viewport
  //   this.minimap.update(worldWidth, worldHeight, top, left, worldScreenWidth, worldScreenHeight, scene.container)
  // }

  resize(w: number, h: number) {
    if (!this.viewport) return
    console.log('resize', w, h)

    this.renderer.resize(w, h)
    this.viewport.resize(w, h)
    // this.updateMinimap()
  }

  async init(w: number, h: number) {
    const canvas = this.canvas
    const backgroundColor = this.options.backgroundColor ?? 0xffffff

    await this.renderer.init({ canvas, width: w, height: h, antialias: true, backgroundColor })

    const viewport = this.viewport = new Viewport({
      screenWidth: w,
      screenHeight: h,
      worldWidth: WORLD_WIDTH,    // update when open scene
      worldHeight: WORLD_HEIGHT,  // update when open scene
      passiveWheel: false,
      events: this.renderer.events,
    })

    this.minimap = new Minimap(this.renderer, this)
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
      .clampZoom({minScale: 0.8, maxScale: 16})

    viewport.moveCenter(WORLD_WIDTH / 2, WORLD_HEIGHT / 2)
    // this.drawGrid()
    this.runUpdate()

    viewport.on('clicked', (e) => {
      // console.log('clicked', e.screen, e.world)
    })

    // viewport.on('zoomed', () => this.updateMinimap())
    viewport.on('moved', () => {
      // this.updateMinimap()
      downPx = -1, downPy = -1  // prevent click after move
      this.eventTarget.dispatchEvent(new Event('viewportmoved'))
    })

    viewport.on('drag-start', (e) => {
      // console.log('drag-start', e.screen, e.world)
    })

    viewport.on('drag-end', (e) => {
      if (!this.viewport) return
      const { width, height, worldHeight, worldWidth, x, y, screenHeight, screenWidth, screenHeightInWorldPixels, screenWidthInWorldPixels } = viewport
    })

    let downPx = -1, downPy = -1, downtime = 0
    const mousedown = (e: MouseEvent) => {
      const [px, py, rawx, rawy] = this.getPixelXY(e)
      downPx = px
      downPy = py
      downtime = performance.now()
      this.eventTarget.dispatchEvent(new CustomEvent<[number, number, number, number]>('pixeldown', {detail: [px, py, rawx, rawy]}))
    }

    const mouseup = (e: MouseEvent) => {
      const data = this.getPixelXY(e)
      const [px, py] = data
      this.eventTarget.dispatchEvent(new CustomEvent<[number, number, number, number]>('pixelup', {detail: data}))
      const time = performance.now() - downtime
      if (downPx === px && downPy === py && time < 500) {
        // clicked
        this.eventTarget.dispatchEvent(new CustomEvent<[number, number, number, number]>('pixelclick', {detail: data}))
        downPx = downPy = -1
      }
    }

    let curx = -1, cury = -1
    const mousemove = (e: MouseEvent) => {
      const [px, py, rx, ry] = this.getPixelXY(e)
      this.eventTarget.dispatchEvent(new CustomEvent<[number, number]>('mousemove', {detail: [rx, ry]}))
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

    this.addScene('main', 100, 100)
    this.moveCenter()

    this.resolveInitialize()

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

    return unsub
  }

  // TODO make private
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
    // this.updateMinimap()
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

  startDrag(image: string, {onDrop, onMove = (x, y) => {}, isInRange, x = 0, y = 0, w = 0, h = 0}: DragOptions) {
    const scene = this.getActiveScene()
    if (!scene) return

    // emit event 'viewportmoved' to prevent select
    this.eventTarget.dispatchEvent(new Event('viewportmoved'))

    const shadow = scene.addImage(image, {x, y, w, h})
    shadow.alpha = 0.4

    const transform = ([x, y, rx, ry]: number[]) => [x, y, rx, ry]

    this.pauseDrag()
    const unsub = this.subscribe('pixelmove', (e: CustomEvent<[number, number]>) => {
      const [px, py, rx, ry] = transform(e.detail)
      shadow.x = px * PIXEL_SIZE
      shadow.y = py * PIXEL_SIZE
      if (isInRange && !isInRange(px, py)) {
        shadow.visible = false
      } else {
        shadow.visible = true
        onMove(px, py, rx, ry)
      }
      this.markDirty()
    })

    this.subscribeOnce('pixelup', (e: CustomEvent<[number, number, number, number]>) => {
      const [px, py, rx, ry] = transform(e.detail)
      unsub()
      shadow.destroy()
      this.resumeDrag()
      if (isInRange && !isInRange(px, py)) return
      onDrop(px, py, rx, ry)

      this.markDirty()
    })
  }

  moveObject(object: Container, px: number, py: number, tx = px, ty = py, numberOfTick = 15): Promise<void> {
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
        x += deltaX / numberOfTick
        y += deltaY / numberOfTick
        
        if (deltaX >= 0 === x >= tarX) x = tarX
        if (deltaY >= 0 === y >= tarY) y = tarY

        object.x = x
        object.y = y

        this.markDirty()
        
        if (x === tarX && y === tarY) {
          unsub()
          res()
          this.eventTarget.dispatchEvent(new Event('updated'))
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

  private setupSelect() {
    // detect long click to start select
    this.subscribe('pixeldown', (e: CustomEvent<[number, number, number, number]>) => {
      const [px, py] = e.detail
      if (px < 0 || py < 0) return

      // start select after 500ms
      const timeout = setTimeout(() => {
        this.startSelect(px, py)
      }, 600)

      const unsubmoved = this.subscribeOnce('viewportmoved', () => {
        clearTimeout(timeout)
      })

      this.subscribeOnce('pixelup', () => {
        clearTimeout(timeout)
        unsubmoved()
      })
    })

    this.subscribe('pixelclick', () => {
      this.clearSelect()
    })
  }

  clearSelect() {
    this.getActiveScene()?.clearSelect()
    this.eventTarget.dispatchEvent(new Event('pixelselectclear'))
  }

  private startSelect(x: number, y: number) {
    this.pauseDrag()

    const scene = this.getActiveScene()
    if (!scene) return

    scene.selectArea({ x, y, w: 1, h: 1 })
    let startX = x, startY = y

    // emit start select event
    // this.eventTarget.dispatchEvent(new CustomEvent<PixelArea>('selectstart', { detail: { x, y, w: 1, h: 1 } }))
    this.eventTarget.dispatchEvent(new CustomEvent<PixelArea>('pixelselect', { detail: { x, y, w: 1, h: 1 } }))

    const unsub = this.subscribe('pixelmove', (e: CustomEvent<[number, number]>) => {
      const [px, py] = e.detail

      const x = Math.min(startX, px)
      const y = Math.min(startY, py)
      const w = Math.abs(px - startX) + 1
      const h = Math.abs(py - startY) + 1
      scene.selectArea({ x, y, w, h })

      this.eventTarget.dispatchEvent(new CustomEvent<PixelArea>('pixelselect', { detail: { x, y, w, h } }))
    })

    this.subscribeOnce('pixelup', (e: CustomEvent<[number, number, number, number]>) => {
      unsub()
      this.resumeDrag()
      this.eventTarget.dispatchEvent(new Event('pixelselectend'))
    })
  }
}