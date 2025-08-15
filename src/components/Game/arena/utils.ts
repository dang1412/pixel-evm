import { PointData } from 'pixi.js'

import { MonsterState } from './types'

export function cloneMonster(m: MonsterState): MonsterState {
  return {
    ...m,
    pos: {...m.pos},
    weapons: {...m.weapons},
  }
}

export function isSamePos(a: PointData, b: PointData): boolean {
  return a.x === b.x && a.y === b.y
}
