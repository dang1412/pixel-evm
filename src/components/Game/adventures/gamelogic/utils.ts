import { PointData } from 'pixi.js'

import { getAreaPixels } from '../../utils'
import { PixelArea } from '../../ViewportMap'
import { getMonsterInfo } from '../constants'
import { AdventureStates, MonsterType } from '../types'

export function getMonsterPixels(x: number, y: number, type: MonsterType): number[] {
  const floorx = Math.floor(x)
  const floory = Math.floor(y)

  const monsterInfo = getMonsterInfo(type)
  const w = monsterInfo.w + (x > floorx ? + 1 : 0)
  const h = monsterInfo.h + (y > floory ? + 1 : 0)

  const area: PixelArea = {x: floorx, y: floory, w, h }

  return getAreaPixels(area)
}

// export function getPixels({x, y, w, h}: PixelArea): number[] {
//   const pixels: number[] = []

//   for (let i = 0; i < w; i++) {
//     for (let j = 0; j < h; j++) {
//       pixels.push(xyToPosition(x + i, y + j))
//     }
//   }

//   return pixels
// }

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

export function updateCoverPixel({mapIdxPosMonsters, mapIdxMonsterCoverPixels, monsters}: AdventureStates, id: number, nextCoverPixels: number[]) {

  const mapIdx = monsters[id].mapIdx
  if (!mapIdxPosMonsters[mapIdx]) mapIdxPosMonsters[mapIdx] = {}
  if (!mapIdxMonsterCoverPixels[mapIdx]) mapIdxMonsterCoverPixels[mapIdx] = {}

  const monsterCoverPixels = mapIdxMonsterCoverPixels[mapIdx]
  const curCoverPixels = monsterCoverPixels[id] || []

  const posMonsters = mapIdxPosMonsters[mapIdx]

  for (const pixel of curCoverPixels) {
    // remove id from pixel
    const ids = posMonsters[pixel] || []
    posMonsters[pixel] = ids.filter((_id) => _id !== id)
  }
  for (const pixel of nextCoverPixels) {
    // add id to pixel
    if (posMonsters[pixel]) {
      posMonsters[pixel].push(id)
    } else {
      posMonsters[pixel] = [id]
    }
  }

  monsterCoverPixels[id] = nextCoverPixels
}

export function updateRemoveMonster({ mapIdxPosMonsters, mapIdxMonsterCoverPixels, monsters }: AdventureStates, id: number) {
  const mapIdx = monsters[id].mapIdx

  const monsterCoverPixels = mapIdxMonsterCoverPixels[mapIdx] || {}
  const pixels = monsterCoverPixels[id] || []

  const posMonsters = mapIdxPosMonsters[mapIdx] || {}

  // delete positions
  for (const p of pixels) {
    // remove id from pixel
    const ids = posMonsters[p] || []
    posMonsters[p] = ids.filter((_id) => _id !== id)
  }
  // delete monster
  delete monsters[id]
  delete monsterCoverPixels[id]
}

export function roundPos(p: PointData) {
  p.x = parseFloat(p.x.toFixed(1))
  p.y = parseFloat(p.y.toFixed(1))
}
