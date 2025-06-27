import { PixelArea } from "./ViewportMap"

export const PIXEL_SIZE = 30
export const MAP_W = 100
export const MAP_H = 100

const MAP_W10 = MAP_W * 10

export function positionToXY(p: number, w = MAP_W): {x: number, y: number} {
  const x = p % w
  const y = (p - x) / w

  return {x, y}
}

export function xyToPosition(x: number, y: number, w = MAP_W): number {
  return y * w + x
}

export function position10ToXY(p: number): {x: number, y: number} {
  const x = p % MAP_W10
  const y = (p - x) / MAP_W10

  return { x: x/10, y: y/10 }
}

export function xyToPosition10(x: number, y: number): number {
  return Math.round((y * 10)) * MAP_W10 + Math.round(x * 10)
}

export function getAreaPixels({x, y, w, h}: PixelArea): number[] {
  const pixels: number[] = []

  for (let i = 0; i < w; i++) {
    for (let j = 0; j < h; j++) {
      pixels.push(xyToPosition(x + i, y + j))
    }
  }

  return pixels
}
