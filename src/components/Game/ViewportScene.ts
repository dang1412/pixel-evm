import { Assets, Container, Graphics, PointData, Sprite, Texture } from 'pixi.js'

import { PixelArea, ViewportMap } from './ViewportMap'
import { PIXEL_SIZE } from './utils'
import { PixelImage } from './types'

export class ViewportScene {
  container = new Container()

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

    return container
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
}