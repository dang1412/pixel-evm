import { Assets, Container, Graphics, PointData, Sprite, Texture } from 'pixi.js'

import { ViewportMap } from './ViewportMap'
import { PIXEL_SIZE } from './utils'
import { PixelImage, PixelArea } from './types'

export class ViewportScene {
  container = new Container()

  private scaled = 0
  private centureX = 0
  private centureY = 0

  private selectPixelsGraphic = new Graphics()
  private drawColorGraphic = new Graphics()

  private selectedArea: PixelArea | undefined

  constructor(public map: ViewportMap, public pixelWidth: number, public pixelHeight: number, bgUrl = '') {
    this.drawGrid()
    // for (const [x, y] of [[160,160], [600, 600], [160, 600], [600, 160]]) {
    //   const rect = new Graphics()
    //   rect.rect(x, y, 120, 120)
    //   rect.fill('green')
    //   this.container.addChild(rect)
    // }
    // background
    if (bgUrl) {
      const image = this.addImage(bgUrl, { x: 0, y: 0, w: pixelWidth, h: pixelHeight })
      image.alpha = 0.15
    }

    // select pixels
    this.selectPixelsGraphic.alpha = 0.15

    // color graphic
    this.container.addChild(this.drawColorGraphic)
  }

  selectArea(area: PixelArea) {
    this.clearSelect()
    if (area && area.w > 0 && area.h > 0) {
      // move to the top
      // this.container.addChild(this.selectPixelsGraphic)
      // this.selectPixelsGraphic.rect(
      //   area.x * PIXEL_SIZE,
      //   area.y * PIXEL_SIZE,
      //   area.w * PIXEL_SIZE,
      //   area.h * PIXEL_SIZE
      // )
      // this.selectPixelsGraphic.fill({ color: '#0011ff' })

      // this.map.markDirty()
      this.selectedArea = area
      this.drawColorArea(area, 0x0011ff, undefined, this.selectPixelsGraphic)
    }
  }

  clearSelect() {
    this.selectedArea = undefined
    this.selectPixelsGraphic.clear()
    this.map.markDirty()
  }

  closed() {
    if (!this.map.viewport) return
    this.scaled = this.map.viewport.scaled || 0
    const {x, y} = this.map.viewport.center
    this.centureX = x
    this.centureY = y
  }

  opened() {
    if (!this.map.viewport) return

    const newWorldWidth = PIXEL_SIZE * this.pixelWidth
    const newWorldHeight = PIXEL_SIZE * this.pixelHeight
    const { screenWidth, screenHeight, worldWidth, worldHeight } = this.map.viewport
    console.log(screenWidth, screenHeight, worldWidth, worldHeight, '---', newWorldWidth, newWorldHeight)
    this.map.viewport.resize(screenWidth, screenHeight, newWorldWidth, newWorldHeight)

    if (this.scaled) {
      this.map.viewport.setZoom(this.scaled)
      this.map.viewport.moveCenter(this.centureX, this.centureY)
    } else {
      this.map.viewport.fit()
      this.map.viewport.moveCenter(newWorldWidth / 2, newWorldHeight / 2)
    }
  }

  async loadImages(images: PixelImage[]) {
    const promises = images.map(image => Assets.load(image.imageUrl).then(() => {
      this.addImage(image.imageUrl, image.area)
    }))
    return Promise.all(promises).then(() => this.map.markDirty())
  }

  addImage(url: string, area: PixelArea, _c?: Container): Container {
    // create container
    const container = _c || new Container()
    container.removeChildren()

    // add image
    const image = new Sprite()
    // load
    if (url) {
      (async () => {
        await Assets.load(url).catch((e) => console.warn('Can not load image url', url))
        image.texture = Texture.from(url)
        this.map.markDirty()
      })()
    }

    if (area.w && area.h) {
      image.width = area.w * PIXEL_SIZE
      image.height = area.h * PIXEL_SIZE
    }
    container.addChild(image)

    this.container.addChild(container)

    this.setPosition(container, area.x, area.y)

    return container
  }

  setPosition(container: Container, x: number, y: number) {
    container.x = x * PIXEL_SIZE
    container.y = y * PIXEL_SIZE
  }

  private drawGrid() {
    const g = new Graphics()
    this.container.addChild(g)

    const worldWidth = PIXEL_SIZE * this.pixelWidth
    const worldHeight = PIXEL_SIZE * this.pixelHeight

    // draw vertical lines
    for (let i = 0; i <= this.pixelWidth; i++) {
      const pos = i * PIXEL_SIZE
      g.moveTo(pos, 0)
      g.lineTo(pos, worldHeight)
      g.stroke({ width: 0.4, color: 0x888888,  })
    }

    // draw horizon lines
    for (let i = 0; i <= this.pixelHeight; i++) {
      const pos = i * PIXEL_SIZE
      g.moveTo(0, pos)
      g.lineTo(worldWidth, pos)
      g.stroke({ width: 0.4, color: 0x888888 })
    }
  }

  drawLine(start: PointData, end: PointData, _g?: Graphics) {
    const g = _g || new Graphics()
    this.container.addChild(g)
    g.clear()

    g.moveTo(start.x * PIXEL_SIZE, start.y * PIXEL_SIZE)
    g.lineTo(end.x * PIXEL_SIZE, end.y * PIXEL_SIZE)
    g.stroke({ width: 0.6, color: 0xffd700 })

    return g
  }

  drawColorArea(area: PixelArea, color: number, alpha = 1, _g?: Graphics) {
    const g = _g || new Graphics()
    g.clear()
    const p = g.parent || this.container
    p.addChild(g)  // move to the top

    g.rect(
      area.x * PIXEL_SIZE,
      area.y * PIXEL_SIZE,
      area.w * PIXEL_SIZE,
      area.h * PIXEL_SIZE
    )
    g.fill({ color, alpha })

    this.map.markDirty()

    return g
  }

  destroy() {
    this.container.destroy()
  }
}
