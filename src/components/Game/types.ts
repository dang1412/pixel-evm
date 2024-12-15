import { PixelArea } from './ViewportMap'

export interface PixelImage {
  area: PixelArea
  imageUrl: string
  title: string
  subtitle: string
  link: string
  subImages?: PixelImage[]
  // metaCid?: string  // lazy load meta info
  owner?: string
}
