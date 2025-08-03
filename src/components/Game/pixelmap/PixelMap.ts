import { Container } from 'pixi.js'

import { PixelImage } from '../types'
import { ViewportMap } from '../ViewportMap'
import { getAreaPixels, xyToPosition } from '../utils'

import { PixelMainMap, PixelMapImages } from './types'
import { createViewportMap } from './createViewportMap'

function getSceneImages(sceneName: string, mainState: PixelMainMap): PixelMapImages {
  let sceneImages = mainState.sceneToImages.get(sceneName)
  if (!sceneImages) {
    sceneImages = {
      pixelToImage: new Map<number, PixelImage>(),
      pixelToGraphic: new Map<number, Container>(),
    }
    mainState.sceneToImages.set(sceneName, sceneImages)
  }
  return sceneImages
}

function getSubSceneName(image: PixelImage): string {
  const pixel = xyToPosition(image.area.x, image.area.y)
  return `${pixel}`
}

export class PixelMap {
  // pixelToImage = new Map<number, PixelImage>()
  // pixelToSubMap?: Map<number, PixelMap>

  private mainState: PixelMainMap
  private view: ViewportMap

  // main map's pixel => sceneName
  // private mainPixelToSceneMap: {[pixel: number]: string} = {}

  destroy = () => {}

  getView() {
    return this.view
  }

  constructor(c: HTMLCanvasElement) {
    this.mainState = {
      // images: {
      //   pixelToImage: new Map<number, PixelImage>(),
      //   pixelToGraphic: new Map<number, Container>(),
      // },
      mintedPixelSet: new Set(),
      ownedPixelSet: new Set(),
      sceneToImages: new Map<string, PixelMapImages>(),
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
    const { pixelToImage } = getSceneImages(sceneName, this.mainState)
    const image = pixelToImage.get(pixel)
    if (!image) return

    if (sceneName === 'main') {
      this.openPixelImage(image)
    } else {
      // open subpixel url
      console.log('Open subpixel image:', image.imageUrl)
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

    // draw image on scene
    const container = scene.addImage(image.imageUrl, image.area)

    // get scene's images and update
    const { pixelToImage, pixelToGraphic } = getSceneImages(sceneName, this.mainState)

    const pixels = getAreaPixels(image.area)
    for (const pixel of pixels) {
      pixelToImage.set(pixel, image)
      pixelToGraphic.set(pixel, container)
    }
  }

  getImageFromPoint(scene: string, x: number, y: number): PixelImage | undefined {
    const { pixelToImage } = getSceneImages(scene, this.mainState)
    const pixel = xyToPosition(x, y)
    
    return pixelToImage.get(pixel)
  }

  // addSubMap(pixel: number, subMap: PixelMap) {
  //   this.pixelToSubMap?.set(pixel, subMap)
  // }
}
