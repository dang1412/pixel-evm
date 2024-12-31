import { PointData } from 'pixi.js'

import { AdventureStates, AdventureStateUpdates, MonsterState, MonsterType } from '../types'
import { getMonsterPixels, updateCoverPixel, updateRemoveMonster } from './utils'

export function applyChangeMapAction(states: AdventureStates, updates: AdventureStateUpdates, id: number, p: PointData) {
  const monster = states.monsters[id]
  if (!monster) return

  if (monster.mapIdx === p.x) return

  // TODO: check if can switch to mapIdx

  // remove monster from current map
  updateRemoveMonster(states, id)

  // add monster to new map
  const nextCoverPixels = getMonsterPixels(0, 0, monster.type)
  monster.mapIdx = p.x
  monster.pos = { x: 0, y: 0 }
  monster.target = { x: 0, y: 0 }
  updateCoverPixel(states, id, nextCoverPixels)

  // save to updates
  updates.monsters[id] = monster
}
