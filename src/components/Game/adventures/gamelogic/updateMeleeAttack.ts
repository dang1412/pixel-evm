import { PixelArea } from '../../ViewportMap'
import { ActionType, AdventureAction, AdventureStates, MonsterType } from '../types'
import { AttackType } from './types'

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

export function updateMeleeAttack(states: AdventureStates, id: number): [PixelArea, AdventureAction | undefined] {
  const monster = states.monsters[id]

  // determine attack type if melee
  const monsterServerState = states.monsterServerStates[id]

  // check if action is too fast
  const ts = Date.now()
  const t = ts - monsterServerState.lastActionTs
  if (t < 600) {
    // too fast, skip
    return [defaultAttackRange, undefined]
  } else if (t > 1500) {
    // reset attackState if too long
    monsterServerState.attackState = 0
  }

  // update attackState, lastActionTs
  const type = monsterServerState.attackState as AttackType
  monsterServerState.attackState ++
  if (monsterServerState.attackState > 5) {
    monsterServerState.attackState = 0
  }
  monsterServerState.lastActionTs = ts

  // Melee Attack
  const attackRange = ATTACK_RANGE[monster.type][type] || defaultAttackRange

  // round to a pixel
  const px = Math.round(monster.pos.x)
  const py = Math.round(monster.pos.y)

  const damageArea: PixelArea = {...attackRange, x: px + attackRange.x, y: py + attackRange.y}
  if (monsterServerState.isLeft) {
    damageArea.x = px - attackRange.x - attackRange.w + 1
  }

  return [damageArea, {id: monster.id, type: ActionType.SHOOT, pos: {x: type, y: 100}}]
}
