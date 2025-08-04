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

export function getAreaOperatable(state: PixelMainMap, scene: string, area: PixelArea | undefined) {
  if (!area || area.w * area.h > 30) {
    return { mintable: false, uploadable: false, deletable: false }
  }

  return scene === 'main'
    ? getMainMapAreaOperatable(state, area)
    : getSubMapAreaOperatable(state, scene, area)
}

function getSubMapAreaOperatable(state: PixelMainMap, scene: string, area: PixelArea) {
  const mintable = false
  let uploadable = true
  let deletable = true

  const pixel = Number(scene)
  if (!state.ownedPixelSet.has(pixel)) {
    uploadable = false
    deletable = false
  } else {
    const { pixelToImage } = getSceneImages(state, scene)
    const pixels = getAreaPixels(area)
    for (const p of pixels) {
      if (pixelToImage.has(p)) {
        uploadable = false
      } else {
        deletable = false
      }
    }
  }

  return { mintable, uploadable, deletable }
}

function getMainMapAreaOperatable(state: PixelMainMap, area: PixelArea) {
  let mintable = true
  let uploadable = true
  let deletable = true

  const { pixelToImage } = getSceneImages(state, 'main')

  const pixels = getAreaPixels(area)
  for (const pixel of pixels) {
    if (state.ownedPixelSet.has(pixel)) {
      mintable = false
      if (pixelToImage.has(pixel)) {
        uploadable = false
      } else {
        deletable = false
      }
    } else if (pixelToImage.has(pixel)) {
      mintable = false
      uploadable = false
      deletable = false
    } else {
      uploadable = false
      deletable = false
    }
  }

  return { mintable, uploadable, deletable }
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
