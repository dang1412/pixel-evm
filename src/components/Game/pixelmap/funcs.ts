import { Container } from 'pixi.js'

import { PixelArea, PixelImage } from '../types'
import { getAreaPixels, xyToPosition } from '../utils'

import { PixelMainMap, PixelMapImages } from './types'

export function getSceneImages(state: PixelMainMap, sceneName: string, ): PixelMapImages {
  let sceneImages = state.sceneToImages.get(sceneName)
  if (!sceneImages) {
    sceneImages = {
      pixelToImage: new Map<number, PixelImage>(),
      pixelToGraphic: new Map<number, Container>(),
    }
    state.sceneToImages.set(sceneName, sceneImages)
  }
  return sceneImages
}

export function getSubSceneName(image: PixelImage): string {
  const pixel = xyToPosition(image.area.x, image.area.y)
  return `${pixel}`
}

interface AreaOperatable {
  mintable: boolean
  uploadable: boolean
  editable?: PixelImage
}

export function getAreaOperatable(state: PixelMainMap, scene: string, area: PixelArea | undefined): AreaOperatable {
  if (!area || area.w * area.h > 100) {
    return { mintable: false, uploadable: false }
  }

  return scene === 'main'
    ? getMainMapAreaOperatable(state, area)
    : getSubMapAreaOperatable(state, scene, area)
}

function getSubMapAreaOperatable(state: PixelMainMap, scene: string, area: PixelArea): AreaOperatable {
  const mintable = false
  let uploadable = true
  let editable: PixelImage | undefined

  const pixel = Number(scene)
  if (!state.ownedPixelSet.has(pixel)) {
    uploadable = false
    // editable = undefined
  } else {
    const { pixelToImage } = getSceneImages(state, scene)
    const pixels = getAreaPixels(area)
    editable = pixelToImage.get(pixels[0])
    for (const p of pixels) {
      if (pixelToImage.has(p)) {
        uploadable = false
      } else {
        editable = undefined
      }
    }
  }

  return { mintable, uploadable, editable }
}

function getMainMapAreaOperatable(state: PixelMainMap, area: PixelArea): AreaOperatable {
  let mintable = true
  let uploadable = true
  // let editable: PixelImage | undefined

  const { pixelToImage } = getSceneImages(state, 'main')

  const pixels = getAreaPixels(area)
  let editable = pixelToImage.get(pixels[0])
  for (const pixel of pixels) {
    if (state.ownedPixelSet.has(pixel)) {
      mintable = false
      if (pixelToImage.has(pixel)) {
        uploadable = false
      } else {
        editable = undefined
      }
    } else if (pixelToImage.has(pixel)) {
      mintable = false
      uploadable = false
      editable = undefined
    } else {
      uploadable = false
      editable = undefined
    }
  }

  return { mintable, uploadable, editable }
}

// // export function isAreaMintable(area: PixelArea): boolean {
// //   const pixels = getAreaPixels(area)
// //   for (const pixel of pixels) {
// //     if (ownedPixelSet.has(pixel) || pixelToImageMap.has(pixel)) {
// //       return false // If any pixel is already owned or covered by image, the area cannot be minted
// //     }
// //   }
// //   return true // All pixels are free to mint
// // }

// // export function isAreaUploadable(area: PixelArea): boolean {
// //   const pixels = getAreaPixels(area)
// //   for (const pixel of pixels) {
// //     if (ownedPixelSet.has(pixel)) {
// //       return false // If any pixel is already owned, the area cannot be uploaded
// //     }
// //   }
// //   return true // All pixels are free to upload
// // }
