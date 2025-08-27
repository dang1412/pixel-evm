import { PointData } from 'pixi.js'

import { ActionType, ArenaAction, MonsterState } from './types'

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

export function splitActionChunks(actions: ArenaAction[]): ArenaAction[][] {
  const chunks: ArenaAction[][] = []
  let chunk: ArenaAction[] = []
  let prevIsShoot = false
  for (const action of actions) {
    if (prevIsShoot && action.actionType === ActionType.Move) {
      // switch from shoot to move
      chunks.push(chunk)
      chunk = []
    }

    prevIsShoot = action.actionType !== ActionType.Move
    chunk.push(action)
  }

  // last chunk
  chunks.push(chunk)

  return chunks
}
