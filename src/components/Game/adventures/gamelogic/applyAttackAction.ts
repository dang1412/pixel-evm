import { PointData } from 'pixi.js'

import { getAreaPixels } from '../../utils'
import { PixelArea } from '../../ViewportMap'
import { AdventureStates, AdventureStateUpdates, MonsterState, MonsterType } from '../types'
import { AttackType } from './types'
import { updateRemoveMonster } from './utils'

const defaultAttackRange: PixelArea = { x: 1, y: 0, w: 1, h: 1 }

const ATTACK_RANGE: {[k in MonsterType]: Partial<{[k in AttackType]: PixelArea}>} = {
  [MonsterType.MEGAMAN]: {
    [AttackType.A1]: { x: -1, y: -1, w: 4, h: 3 },
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

function getMeleeDamageArea(monster: MonsterState, type: AttackType, isLeft: boolean): PixelArea {
  // Melee Attack
  const attackRange = ATTACK_RANGE[monster.type][type] || defaultAttackRange

  // const currentPos = position10ToXY(monster.pos)
  // round to a pixel
  const px = Math.round(monster.pos.x)
  const py = Math.round(monster.pos.y)

  const damageArea: PixelArea = {...attackRange, x: px + attackRange.x, y: py + attackRange.y}
  if (isLeft) {
    damageArea.x = px - attackRange.x - attackRange.w + 1
  }

  return damageArea
}

export function applyAttackAction(states: AdventureStates, updates: AdventureStateUpdates, id: number, p: PointData): boolean {
  const { mapIdxPosMonsters, monsters, monsterIsLeft } = states
  const monster = monsters[id]

  const posMonsters = mapIdxPosMonsters[monster.mapIdx] || {}

  // already dead
  if (!monster) return false

  const damageArea = p.y >= 100 ? getMeleeDamageArea(monster, p.x as AttackType, monsterIsLeft[id]) : { x: p.x - 1, y: p.y - 2, w: 3, h: 3 }

  const pixels = getAreaPixels(damageArea)
  
  for (const pixel of pixels) {
    const hurtMonsterIds = posMonsters[pixel] || []
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

  if (monster.hp > 0) monster.hp --
  updates.monsters[id] = monster
  if (monster.hp <= 0) {
    // dead
    updateRemoveMonster(states, id)
  }
}
