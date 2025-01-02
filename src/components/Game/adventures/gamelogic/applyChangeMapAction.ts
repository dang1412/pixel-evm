import { PointData } from 'pixi.js'

import { AdventureStates, AdventureStateUpdates, MonsterState, MonsterType } from '../types'
import { getMonsterPixels, updateCoverPixel, updateRemoveMonster } from './utils'

function calculateEnterPos(states: AdventureStates, monster: MonsterState, mapIdx: number): PointData {
  if (mapIdx < states.mainMapIdx) {
    // enter a map
    const { area } = states.imageBlocks[mapIdx]
    const pos: PointData = {x: Math.floor(area.w * 5), y: Math.floor(area.h * 5)}

    return pos
  }

  // exit to main map
  const curMapIdx = monster.mapIdx
  const { area } = states.imageBlocks[curMapIdx]
  
  return {x: area.x - 1, y: area.y}
}

export function applyChangeMapAction(states: AdventureStates, updates: AdventureStateUpdates, id: number, p: PointData) {
  const monster = states.monsters[id]
  if (!monster) return

  if (monster.mapIdx === p.x) return

  // TODO: check if can switch to mapIdx

  // remove monster from current map
  // (also delete states.monsters[id])
  updateRemoveMonster(states, id)

  // calculate enter position
  const pos = calculateEnterPos(states, monster, p.x)
  // add monster to new map
  monster.mapIdx = p.x
  monster.pos = pos
  monster.target = pos

  states.monsters[id] = monster
  const nextCoverPixels = getMonsterPixels(pos.x, pos.y, monster.type)
  updateCoverPixel(states, id, nextCoverPixels)

  // save to updates
  updates.monsters[id] = monster
}
