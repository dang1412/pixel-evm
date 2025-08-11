import { MonsterState } from './types'

export function cloneMonster(m: MonsterState): MonsterState {
  return {
    ...m,
    pos: {...m.pos},
    weapons: {...m.weapons},
  }
}
