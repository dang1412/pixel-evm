import { PixelImage, PixelArea } from '../types'
import { getAreaPixels, xyToPosition } from '../utils'

// Global state for images and owned pixels

// Images
const pixelToImageMap = new Map<number, PixelImage>()

export function setPixelToImage(images: PixelImage[]) {
  // const map = new Map<number, PixelImage>()
  pixelToImageMap.clear()
  for (const image of images) {
    const pixels = getAreaPixels(image.area);
    for (const pixel of pixels) {
      pixelToImageMap.set(pixel, image);
    }
  }

  return pixelToImageMap
}

export function getImageFromPoint(x: number, y: number) {
  const pixel = xyToPosition(x, y)

  return getImageFromPixel(pixel)
}

export function getImageFromPixel(pixel: number) {
  const image = pixelToImageMap.get(pixel)

  return image
}

// Owned pixels
const ownedPixelSet = new Set<number>()

export function clearOwnedPixels() {
  ownedPixelSet.clear()
}

export function addOwnedPixels(area: PixelArea) {
  const pixels = getAreaPixels(area)
  for (const pixel of pixels) {
    ownedPixelSet.add(pixel)
  }
}

export function getAreaOperatable(area: PixelArea | undefined) {
  let mintable = true
  let uploadable = true
  let deletable = true

  if (!area || area.w * area.h > 30) {
    return { mintable: false, uploadable: false, deletable: false }
  }

  const pixels = getAreaPixels(area)
  for (const pixel of pixels) {
    if (ownedPixelSet.has(pixel)) {
      mintable = false
      if (pixelToImageMap.has(pixel)) {
        uploadable = false
      } else {
        deletable = false
      }
    } else if (pixelToImageMap.has(pixel)) {
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

// export function isAreaMintable(area: PixelArea): boolean {
//   const pixels = getAreaPixels(area)
//   for (const pixel of pixels) {
//     if (ownedPixelSet.has(pixel) || pixelToImageMap.has(pixel)) {
//       return false // If any pixel is already owned or covered by image, the area cannot be minted
//     }
//   }
//   return true // All pixels are free to mint
// }

// export function isAreaUploadable(area: PixelArea): boolean {
//   const pixels = getAreaPixels(area)
//   for (const pixel of pixels) {
//     if (ownedPixelSet.has(pixel)) {
//       return false // If any pixel is already owned, the area cannot be uploaded
//     }
//   }
//   return true // All pixels are free to upload
// }
