import { PointData } from 'pixi.js'

import { getAreaPixels } from '../../utils'
import { PixelArea } from '../../types'
import { ActionType, AdventureAction, AdventureStates, AdventureStateUpdates, MonsterState } from '../types'
import { moveToward, updateRemoveMonster } from './utils'
import { getMonsterInfo } from '../constants'
import { updateMeleeAttack } from './updateMeleeAttack'

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
