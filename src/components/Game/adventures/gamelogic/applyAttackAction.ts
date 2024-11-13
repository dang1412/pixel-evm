import { PixelArea } from '../../ViewportMap'
import { AdventureStates, AdventureStateUpdates, MonsterType } from '../types'
import { AttackType } from './types'
import { getPixels, updateRemoveMonster } from './utils'

const defaultAttackRange: PixelArea = { x: 1, y: 0, w: 1, h: 1 }

const ATTACK_RANGE: {[k in MonsterType]: Partial<{[k in AttackType]: PixelArea}>} = {
  [MonsterType.MEGAMAN]: {
    [AttackType.A1]: { x: 0, y: -1, w: 3, h: 3 },
    [AttackType.A2]: { x: -1, y: -1, w: 4, h: 3 },
    [AttackType.A3]: { x: -1, y: -1, w: 5, h: 3 },
    [AttackType.A4]: { x: -1, y: -2, w: 3, h: 3 },
    [AttackType.A5]: { x: 1, y: 1, w: 1, h: 1 },
    [AttackType.A6]: { x: -2, y: -2, w: 4, h: 4 },
  },
  [MonsterType.NINJA]: {
    [AttackType.A1]: { x: 0, y: -1, w: 2, h: 3 },
  },
  [MonsterType.CYBORG]: {
    // [AttackType.A1]: { x: 0, y: -1, w: 2, h: 3 },
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

  // const currentPos = position10ToXY(monster.pos)
  // round to a pixel
  const px = Math.round(monster.pos.x)
  const py = Math.round(monster.pos.y)

  const damgeRange: PixelArea = {...attackRange, x: px + attackRange.x, y: py + attackRange.y}
  const pixels = getPixels(damgeRange)

  for (const pixel of pixels) {
    const hurtMonsterIds = posMonster[pixel] || []
    for (const hurtMonsterId of hurtMonsterIds) {
      if (hurtMonsterId !== id) monsterGetHurt(states, updates, hurtMonsterId)
    }
  }

  return true
}

function monsterGetHurt(states: AdventureStates, updates: AdventureStateUpdates, id: number) {
  const { monsters } = states
  const monster = monsters[id]
  if (!monster) return

  monster.hp --
  updates.monsters[id] = monster
  if (monster.hp <= 0) {
    // dead
    updateRemoveMonster(states, id)
  }
}
