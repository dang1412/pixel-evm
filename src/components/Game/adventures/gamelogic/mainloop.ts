import { getMonsterInfo } from '../constants'
import { ActionType, AdventureAction, AdventureStates, AdventureStateUpdates } from '../types'
import { applyAttackAction } from './applyAttackAction'
import { getMonsterPixels, moveToward, roundPos, updateCoverPixel } from './utils'

export function mainLoop(states: AdventureStates, actions: AdventureAction[]): AdventureStateUpdates {
  const updates: AdventureStateUpdates = { monsters: {}, actions: [] }

  for (const action of actions) {
    const { type, id, pos } = action

    if (type === ActionType.MOVE) {
      states.monsters[id].target = pos
    } else if (type === ActionType.SHOOT) {
      applyAttackAction(states, updates, id, pos)
      updates.actions.push(action)
    }
  }

  proceedMoves(states, updates)

  return updates
}

function proceedMoves(states: AdventureStates, updates: AdventureStateUpdates) {
  const { posMonster, monsters, monsterIsLeft } = states
  for (const monster of Object.values(monsters)) {
    const curp = monster.pos
    const tarp = monster.target
    const info = getMonsterInfo(monster.type)
    const speed = info.moveSpeed

    if (curp.x !== tarp.x || curp.y !== tarp.y) {
      // calculate move, move speed unit each loop
      const nextp = moveToward(curp.x, curp.y, tarp.x, tarp.y, speed)
      // round to x.y
      roundPos(nextp)

      // update isLeft
      if (curp.x < tarp.x) {
        monsterIsLeft[monster.id] = false
      } else if (curp.x > tarp.x) {
        monsterIsLeft[monster.id] = true
      }

      // check if can move
      // TODO can improve performance this check, in case monster is big
      const nextCoverPixels = getMonsterPixels(nextp.x, nextp.y, monster.type)
      let canmove = true
      // for (const pixel of nextCoverPixels) {
      //   if (posMonster[pixel] >= 0 && posMonster[pixel] !== monster.id) {
      //     canmove = false
      //     break
      //   }
      // }

      // do move
      if (canmove) {
        updateCoverPixel(states, monster.id, nextCoverPixels)

        // update states
        monster.pos = nextp
        // mark updates
        updates.monsters[monster.id] = monster
      }
    } else if (!info.isHuman) {
      // move random
      const curp = monster.pos
      const tarp = {x: getRandom(Math.max(curp.x - 20, 0), Math.min(curp.x + 20, 99)), y: getRandom(Math.max(curp.y - 20, 0), Math.min(curp.y + 20, 99))}
      states.monsters[monster.id].target = tarp
    }
  }
}

function getRandom(low: number, high: number): number {
  const val = Math.floor(Math.random() * (high - low)) + low
  return val
}
