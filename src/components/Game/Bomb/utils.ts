import { PlayerState } from './types'

export function clonePlayerState(original: PlayerState) {
  const cloned: PlayerState = {
    id: original.id,
    score: original.score,
    r: original.r,
    usedBombs: { ...original.usedBombs },
    totalBombs: { ...original.totalBombs },
  }

  return cloned
}
