import { position10ToXY } from '../../utils'
import { PixelArea } from '../../ViewportMap'
import { AdventureStates, AdventureStateUpdates, MonsterState, MonsterType } from '../types'
import { getPixels, updateRemoveMonster } from './utils'

enum AttackType {
  A1,
  A2,
  A3,
  A4,
  A5,
  A6
}

const defaultAttackRange: PixelArea = { x: 1, y: 0, w: 1, h: 1 }

const ATTACK_RANGE: {[k in MonsterType]: Partial<{[k in AttackType]: PixelArea}>} = {
  [MonsterType.MEGAMAN]: {
    [AttackType.A1]: { x: 1, y: 0, w: 2, h: 2 }
  },
  [MonsterType.MONSTER]: {
    [AttackType.A1]: defaultAttackRange
  },
}

export function applyAttackAction(states: AdventureStates, updates: AdventureStateUpdates, id: number, value: number): boolean {
  const { posMonster, monsters } = states
  const monster = monsters[id]

  // already dead
  if (!monster) return false

  const type = value as AttackType
  const attackRange = ATTACK_RANGE[monster.type][type] || defaultAttackRange

  const currentPos = position10ToXY(monster.pos10)
  // round to a pixel
  const px = Math.round(currentPos.x)
  const py = Math.round(currentPos.y)

  const damgeRange: PixelArea = {...attackRange, x: px + attackRange.x, y: py + attackRange.y}
  const pixels = getPixels(damgeRange)

  for (const pixel of pixels) {
    const hurtMonsterId = posMonster[pixel]
    if (hurtMonsterId !== id) monsterGetHurt(states, updates, hurtMonsterId)
  }

  return true
}

function monsterGetHurt(states: AdventureStates, updates: AdventureStateUpdates, id: number) {
  const { posMonster, monsters, coverPixels } = states
  const monster = monsters[id]
  if (!monster) return

  monster.hp --
  updates.monsters[id] = monster
  if (monster.hp <= 0) {
    // dead
    updateRemoveMonster(states, id)
  }
}
