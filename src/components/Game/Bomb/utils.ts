import { PlayerState } from './types'

export function clonePlayerState(original: PlayerState) {
  const cloned: PlayerState = {
    id: original.id,
    name: original.name,
    score: original.score,
    r: original.r,
    bombs: { ...original.bombs },
  }

  return cloned
}
