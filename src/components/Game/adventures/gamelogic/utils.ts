import { position10ToXY, xyToPosition } from '../../utils'
import { PixelArea } from '../../ViewportMap'
import { getMonsterInfo } from '../constants'
import { AdventureStates, MonsterState, MonsterType } from '../types'

export function getMonsterPixels(x: number, y: number, type: MonsterType): number[] {
  const floorx = Math.floor(x)
  const floory = Math.floor(y)

  const monsterInfo = getMonsterInfo(type)
  const w = monsterInfo.w + (x > floorx ? + 1 : 0)
  const h = monsterInfo.h + (y > floory ? + 1 : 0)

  const area: PixelArea = {x: floorx, y: floory, w, h }

  return getPixels(area)
}

export function getPixels({x, y, w, h}: PixelArea): number[] {
  const pixels: number[] = []

  for (let i = 0; i < w; i++) {
    for (let j = 0; j < h; j++) {
      pixels.push(xyToPosition(x + i, y + j))
    }
  }

  return pixels
}

export function moveToward(x1: number, y1: number, x2: number, y2: number, d: number): { x: number, y: number } {
  // Calculate the distance between (x1, y1) and (x2, y2)
  const dx = x2 - x1
  const dy = y2 - y1
  const totalDistance = Math.sqrt(dx ** 2 + dy ** 2)

  // If the total distance is less than or equal to d, return (x2, y2)
  if (totalDistance <= d) {
      return { x: x2, y: y2 }
  }

  // Calculate the ratio to move along the line
  const ratio = d / totalDistance

  // Calculate the new (x, y) point at the distance d
  const x = x1 + dx * ratio
  const y = y1 + dy * ratio

  return { x, y }
}

export function updateCoverPixel({posMonster, coverPixels}: AdventureStates, id: number, nextCoverPixels: number[]) {
  const curCoverPixels = coverPixels[id] || []
  for (const pixel of curCoverPixels) {
    // remove id from pixel
    const ids = posMonster[pixel] || []
    posMonster[pixel] = ids.filter((_id) => _id !== id)
  }
  for (const pixel of nextCoverPixels) {
    // add id to pixel
    if (posMonster[pixel]) {
      posMonster[pixel].push(id)
    } else {
      posMonster[pixel] = [id]
    }
  }

  coverPixels[id] = nextCoverPixels
}

export function updateRemoveMonster({ posMonster, coverPixels, monsters }: AdventureStates, id: number) {
  const pixels = coverPixels[id]
  // delete positions
  for (const p of pixels) {
    // remove id from pixel
    const ids = posMonster[p] || []
    posMonster[p] = ids.filter((_id) => _id !== id)
  }
  // delete monster
  delete monsters[id]
  delete coverPixels[id]
}
