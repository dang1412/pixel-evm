import { Container, Graphics } from 'pixi.js'

import { PixelArea, PixelImage } from '../types'
import { ViewportMap } from '../ViewportMap'
import { getAreaPixels, xyToPosition } from '../utils'

import { PixelMainMap, PixelMapImages } from './types'
import { createViewportMap } from './createViewportMap'
import { getAreaOperatable, getSceneImages, getSubSceneName } from './funcs'

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

  constructor(c: HTMLCanvasElement) {
    this.mainState = {
      mintedPixelSet: new Set(),
      ownedPixelSet: new Set(),
      sceneToImages: new Map<string, PixelMapImages>(),
      mintedPixelToGraphic: new Map<number, Graphics>(),
    }

    const { vpmap, disconnect } = createViewportMap(c)
    this.view = vpmap

    this.destroy = () => {
      disconnect()
      // more cleanup
    }

    // pixel click
    vpmap.subscribe('pixelclick', (e) => {
      const [x, y] = e.detail
      this.handlePixelClick(vpmap.activeScene, xyToPosition(x, y))
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

  getImageFromPoint(scene: string, x: number, y: number): PixelImage | undefined {
    const { pixelToImage } = getSceneImages(this.mainState, scene)
    const pixel = xyToPosition(x, y)
    
    return pixelToImage.get(pixel)
  }

  addOwnedPixels(area: PixelArea) {
    const mainScene = this.view.getScene('main')
    if (!mainScene) return

    // update data
    const pixels = getAreaPixels(area)
    for (const pixel of pixels) {
      this.mainState.ownedPixelSet.add(pixel)
    }

    // draw on scene
    // update graphics if exists
    let g = this.mainState.mintedPixelToGraphic.get(pixels[0])
    g = mainScene.drawColorArea(area, 0x00ff00, 0.25, g)
    this.mainState.mintedPixelToGraphic.set(pixels[0], g)
  }
}
