export const PIXEL_SIZE = 40
export const MAP_W = 100
export const MAP_H = 100

const MAP_W10 = MAP_W * 10

export function positionToXY(p: number): {x: number, y: number} {
  const x = p % MAP_W
  const y = (p - x) / MAP_W

  return {x, y}
}

export function xyToPosition(x: number, y: number): number {
  return y * MAP_W + x
}

export function position10ToXY(p: number): {x: number, y: number} {
  const x = p % MAP_W10
  const y = (p - x) / MAP_W10

  return { x: x/10, y: y/10 }
}

export function xyToPosition10(x: number, y: number): number {
  return (y * 10) * MAP_W10 + x * 10
}
