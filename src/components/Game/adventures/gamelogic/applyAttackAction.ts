import { PointData } from 'pixi.js'

import { getAreaPixels } from '../../utils'
import { PixelArea } from '../../ViewportMap'
import { ActionType, AdventureAction, AdventureStates, AdventureStateUpdates, MonsterState, MonsterType } from '../types'
import { AttackType } from './types'
import { moveToward, updateRemoveMonster } from './utils'
import { getMonsterInfo } from '../constants'
import { updateMeleeAttack } from './updateMeleeAttack'

// const defaultAttackRange: PixelArea = { x: 1, y: 0, w: 1, h: 1 }

// const ATTACK_RANGE: {[k in MonsterType]: Partial<{[k in AttackType]: PixelArea}>} = {
//   [MonsterType.MEGAMAN]: {
//     [AttackType.A1]: { x: -1, y: -1, w: 4, h: 3 },
//     [AttackType.A2]: { x: -1, y: -1, w: 4, h: 3 },
//     [AttackType.A3]: { x: -1, y: -1, w: 5, h: 3 },
//     [AttackType.A4]: { x: -1, y: -2, w: 3, h: 3 },
//     [AttackType.A5]: { x: 1, y: 1, w: 1, h: 1 },
//     [AttackType.A6]: { x: -2, y: -2, w: 4, h: 4 },
//   },
//   [MonsterType.NINJA]: {
//     [AttackType.A1]: { x: 0, y: -1, w: 2, h: 3 },
//   },
//   [MonsterType.CYBORG]: {
//     // [AttackType.A1]: { x: 0, y: -1, w: 2, h: 3 },
//   },
//   [MonsterType.MONSTER]: {
//     [AttackType.A1]: defaultAttackRange
//   },
// }

// function getMeleeDamageArea(monster: MonsterState, type: AttackType, isLeft: boolean): [PixelArea, AdventureAction] {
//   // Melee Attack
//   const attackRange = ATTACK_RANGE[monster.type][type] || defaultAttackRange

//   // const currentPos = position10ToXY(monster.pos)
//   // round to a pixel
//   const px = Math.round(monster.pos.x)
//   const py = Math.round(monster.pos.y)

//   const damageArea: PixelArea = {...attackRange, x: px + attackRange.x, y: py + attackRange.y}
//   if (isLeft) {
//     damageArea.x = px - attackRange.x - attackRange.w + 1
//   }

//   return [damageArea, {id: monster.id, type: ActionType.SHOOT, pos: {x: type, y: 100}}]
// }

// function getRangeDamageArea(p: PointData): PixelArea {
//   return { x: p.x - 1, y: p.y - 2, w: 3, h: 3 }
// }

function getRangeDamageArea(monster: MonsterState, target: PointData): [PixelArea, AdventureAction] {
  const { shootRange } = getMonsterInfo(monster.type)
  const _p = moveToward(monster.pos.x, monster.pos.y, target.x, target.y, shootRange)
  const p: PointData = {x: Math.round(_p.x), y: Math.round(_p.y)}
  const area: PixelArea = { x: p.x - 1, y: p.y - 2, w: 3, h: 3 }

  return [area, {id: monster.id, type: ActionType.SHOOT, pos: p}]
}

export function applyAttackAction(states: AdventureStates, updates: AdventureStateUpdates, id: number, p: PointData): AdventureAction | undefined {
  const { mapIdxPosMonsters, monsters } = states
  const monster = monsters[id]

  const posMonsters = mapIdxPosMonsters[monster.mapIdx] || {}

  // already dead
  if (!monster) return undefined

  // TODO check monster hurting

  const [damageArea, action] = p.y >= 100 ? updateMeleeAttack(states, id) : getRangeDamageArea(monster, p)

  // action not accepted
  if (!action) return undefined

  const pixels = getAreaPixels(damageArea)
  
  for (const pixel of pixels) {
    const hurtMonsterIds = posMonsters[pixel] || []
    for (const hurtMonsterId of hurtMonsterIds) {
      if (hurtMonsterId !== id) monsterGetHurt(states, updates, hurtMonsterId)
    }
  }

  return action
}

function monsterGetHurt(states: AdventureStates, updates: AdventureStateUpdates, id: number) {
  const { monsters } = states
  const monster = monsters[id]
  if (!monster) return

  const monsterServerState = states.monsterServerStates[id]
  monsterServerState.lastActionTs = Date.now()

  if (monster.hp > 0) monster.hp --
  updates.monsters[id] = monster
  if (monster.hp <= 0) {
    // dead
    updateRemoveMonster(states, id)
  }
}
