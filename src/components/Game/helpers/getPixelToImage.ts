import { PixelImage } from '../types'
import { getAreaPixels } from '../utils'

export function getPixelToImage(images: PixelImage[]) {
  const map = new Map<number, PixelImage>()
  for (const image of images) {
    const pixels = getAreaPixels(image.area);
    for (const pixel of pixels) {
      map.set(pixel, image);
    }
  }

  return map
}