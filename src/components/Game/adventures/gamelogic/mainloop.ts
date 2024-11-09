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
      updates.monsters[id] = states.monsters[id]
    } else if (type === ActionType.SHOOT) {
      applyAttackAction(states, updates, id, pos.x)
      updates.actions.push(action)
    }
  }

  proceedMoves(states, updates)

  return updates
}

function proceedMoves(states: AdventureStates, updates: AdventureStateUpdates) {
  const { posMonster, monsters } = states
  for (const monster of Object.values(monsters)) {
    const curp = monster.pos
    const tarp = monster.target
    const speed = getMonsterInfo(monster.type).moveSpeed

    if (curp.x !== tarp.x || curp.y !== tarp.y) {
      // calculate move, move 1 unit each loop
      const nextp = moveToward(curp.x, curp.y, tarp.x, tarp.y, speed)
      roundPos(nextp)

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
    }
  }
}
