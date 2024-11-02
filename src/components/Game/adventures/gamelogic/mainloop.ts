import { position10ToXY, positionToXY, xyToPosition10 } from '../../utils'
import { ActionType, AdventureAction, AdventureStates, AdventureStateUpdates } from '../types'
import { applyAttackAction } from './applyAttackAction'
import { getMonsterPixels, moveToward, updateCoverPixel } from './utils'

export function mainLoop(states: AdventureStates, actions: AdventureAction[]): AdventureStateUpdates {
  const updates: AdventureStateUpdates = { monsters: {}, actions: [] }

  for (const action of actions) {
    const { type, id, val } = action

    if (type === ActionType.MOVE) {
      // applyMoveAction(states, updates, id, val)
      states.monsters[id].target = val
      updates.monsters[id] = states.monsters[id]
    } else if (type === ActionType.SHOOT) {
      applyAttackAction(states, updates, id, val)
      updates.actions.push(action)
    }
  }

  proceedMoves(states, updates)

  return updates
}

function proceedMoves(states: AdventureStates, updates: AdventureStateUpdates) {
  const { posMonster, monsters, coverPixels } = states
  for (const monster of Object.values(monsters)) {
    const curp = position10ToXY(monster.pos10)
    const tarp = positionToXY(monster.target)

    if (curp.x !== tarp.x || curp.y !== tarp.y) {
      // calculate move, move 1 unit each loop
      const nextp = moveToward(curp.x, curp.y, tarp.x, tarp.y, 1)
      nextp.x = parseFloat(nextp.x.toFixed(1))
      nextp.y = parseFloat(nextp.y.toFixed(1))

      // check if can move
      // TODO can improve performance this check, in case monster is big
      const nextCoverPixels = getMonsterPixels(nextp.x, nextp.y, monster.type)
      let canmove = true
      for (const pixel of nextCoverPixels) {
        if (posMonster[pixel] >= 0 && posMonster[pixel] !== monster.id) {
          canmove = false
          break
        }
      }

      // do move
      if (canmove) {
        // const curCoverPixels = coverPixels[monster.id]
        // for (const pixel of curCoverPixels) {
        //   delete posMonster[pixel]
        // }
        // for (const pixel of nextCoverPixels) {
        //   posMonster[pixel] = monster.id
        // }
        updateCoverPixel(states, monster.id, nextCoverPixels)

        // update states
        monster.pos10 = xyToPosition10(nextp.x, nextp.y)
        // mark updates
        updates.monsters[monster.id] = monster
      }
    }
  }
}
