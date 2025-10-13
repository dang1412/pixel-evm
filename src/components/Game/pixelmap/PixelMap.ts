import { Graphics } from 'pixi.js'

import { PixelArea, PixelImage } from '../types'
import { ViewportMap } from '../ViewportMap'
import { getAreaPixels, xyToPosition } from '../utils'

import { PixelMainMap, PixelMapImages } from './types'
import { createViewportMap } from './createViewportMap'
import { getAreaOperatable, getSceneImages, getSubSceneName } from './funcs'

export interface PixelMapOptions {
  preOpenImageHook?: (curScene: string, pixel: number, image: PixelImage) => boolean
}

type PixelAreaWithOwner = PixelArea & { owner: string }

export class PixelMap {
  private mainState: PixelMainMap
  private view: ViewportMap

  destroy = () => {}

  getView() {
    return this.view
  }

  getMainState() {
    return this.mainState
  }

  getAreaOperatable(area: PixelArea | undefined) {
    return getAreaOperatable(this.mainState, this.view.activeScene, area)
  }

  constructor(c: HTMLCanvasElement, private options: PixelMapOptions = {}) {
    this.mainState = {
      mintedPixelSet: new Set(),
      ownedPixelSet: new Set(),
      sceneToImages: new Map<string, PixelMapImages>(),
      mintedPixelToGraphic: new Map<number, Graphics>(),
    }

    const { view, disconnect } = createViewportMap(c)
    this.view = view

    this.destroy = () => {
      disconnect()
      view.viewport?.destroy()
      // more cleanup
    }

    // pixel click
    view.subscribe('pixelclick', (e) => {
      const [x, y] = e.detail
      this.handlePixelClick(view.activeScene, xyToPosition(x, y))
    })
  }

  async addMainImages(images: PixelImage[]) {
    await this.view.initialize

    for (const image of images) {
      this.addPixelImage('main', image)
    }
  }

  private handlePixelClick(sceneName: string, pixel: number) {
    const { pixelToImage } = getSceneImages(this.mainState, sceneName)
    const image = pixelToImage.get(pixel)
    if (!image) return

    // call pre open hook
    if (this.options.preOpenImageHook) {
      const proceed = this.options.preOpenImageHook(sceneName, pixel, image)
      if (!proceed) return
    }

    if (sceneName === 'main') {
      this.openPixelImage(image)
    } else {
      // open subpixel url
      console.log('Open subpixel image:', image.link)
    }
  }

  private openPixelImage(image: PixelImage) {
    const subSceneName = getSubSceneName(image)
    const subScene = this.view.getScene(subSceneName)
    if (!subScene) {
      // create new subscene
      this.view.addScene(subSceneName, image.area.w * 10, image.area.h * 10, image.imageUrl)
      // load subImages in scene
      if (image.subImages) {
        for (const subImage of image.subImages) {
          this.addPixelImage(subSceneName, subImage)
        }
      }
    }

    this.view.activate(subSceneName)
  }

  addPixelImage(sceneName: string, image: PixelImage) {
    const scene = this.view.getScene(sceneName)
    if (!scene) return

    // get scene's images and update
    const { pixelToImage, pixelToGraphic } = getSceneImages(this.mainState, sceneName)

    const pixels = getAreaPixels(image.area)

    for (const pixel of pixels) {
      pixelToImage.set(pixel, image)
    }

    // TODO if this is sub-image, need to add it to parent image data ? (or no need)

    // draw image on scene
    const container = scene.addImage(image.imageUrl, image.area, pixelToGraphic.get(pixels[0]))
    pixelToGraphic.set(pixels[0], container)
  }

  removePixelImage(sceneName: string, image: PixelImage) {
    const scene = this.view.getScene(sceneName)
    if (!scene) return

    const { pixelToImage, pixelToGraphic } = getSceneImages(this.mainState, sceneName)

    const pixels = getAreaPixels(image.area)
    // delete image
    for (const pixel of pixels) {
      pixelToImage.delete(pixel)
    }

    // delete graphic
    const container = pixelToGraphic.get(pixels[0])
    if (container) {
      container.destroy()
      pixelToGraphic.delete(pixels[0])
    }

    if (sceneName === 'main') {
      // remove subscene
      const subSceneName = getSubSceneName(image)
      this.removeSubscene(subSceneName)
    }

    this.view.markDirty()
  }

  private removeSubscene(name: string) {
    // remove all subimages
    const { pixelToImage } = getSceneImages(this.mainState, name)
    const subImages = pixelToImage.values()
    for (const subImage of subImages) {
      this.removePixelImage(name, subImage)
    }

    this.view.removeScene(name)
  }

  getImageFromSceneXY(scene: string, x: number, y: number): PixelImage | undefined {
    const { pixelToImage } = getSceneImages(this.mainState, scene)
    const pixel = xyToPosition(x, y)

    return pixelToImage.get(pixel)
  }

  // map pixels to area
  private pixelBelongsToArea: Map<number, PixelAreaWithOwner> = new Map()
  // store only top-left pixel of owned areas
  private ownedPixelSet: Set<number> = new Set()

  getPixelOwner(x: number, y: number): string | undefined {
    const pixel = xyToPosition(x, y)
    const area = this.pixelBelongsToArea.get(pixel)
    return area?.owner
  }

  clearOwnedPixels() {
    const ownedPixels = Array.from(this.ownedPixelSet)
    this.ownedPixelSet.clear()

    // redraw all owned pixels
    for (const pixel of ownedPixels) {
      const area = this.pixelBelongsToArea.get(pixel)
      if (area) {
        this.addPixels(area, area.owner)
      }
    }
  }

  // only add top-left pixel of an area
  addOwnedPixel(pixel: number) {
    const mainScene = this.view.getScene('main')
    if (!mainScene) return

    this.ownedPixelSet.add(pixel)
    const g = this.mainState.mintedPixelToGraphic.get(pixel)
    const area = this.pixelBelongsToArea.get(pixel)
    if (g && area) {
      mainScene.drawColorArea(area, 0x00ff00, 0.15, g)
    }
  }

  // add an area of minted pixels
  addPixels(_area: PixelArea, owner: string) {
    const mainScene = this.view.getScene('main')
    if (!mainScene) return

    // area with owner
    const area = { ..._area, owner }

    // update data
    const pixels = getAreaPixels(area)
    if (pixels.length === 0) return

    for (const pixel of pixels) {
      this.mainState.ownedPixelSet.add(pixel)
      // this.mintedPixelSet.add(pixel)
      this.pixelBelongsToArea.set(pixel, area)
    }

    // check if owned
    const isOwned = this.ownedPixelSet.has(pixels[0])

    // draw on scene
    // update graphics if exists, else create new
    let g = this.mainState.mintedPixelToGraphic.get(pixels[0])
    g = mainScene.drawColorArea(area, isOwned ? 0x00ff00 : 0xff0000, 0.15, g)
    this.mainState.mintedPixelToGraphic.set(pixels[0], g)
  }

  isOwnedPixel(pixel: number) {
    return this.ownedPixelSet.has(pixel)
  }
}
