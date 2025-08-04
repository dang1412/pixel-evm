import { Container, Graphics } from 'pixi.js'

import { PixelImage } from '../types'

export interface PixelMapImages {
  pixelToImage: Map<number, PixelImage>
  pixelToGraphic: Map<number, Container>
}

export interface PixelMainMap {
  // images: PixelMapImages
  mintedPixelSet: Set<number>
  ownedPixelSet: Set<number>
  sceneToImages: Map<string, PixelMapImages>

  // top left pixel of minted area => Graphics on main scene
  mintedPixelToGraphic: Map<number, Graphics>
}
