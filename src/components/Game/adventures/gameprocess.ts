import { ActionType, AdventureAction, AdventureStates } from './types'

const DEAD_POSITION = 1 << 14

function proceedMove(states: AdventureStates, updates: AdventureStates, id: number, p: number): boolean {
  const { posMonster, monsterPos } = states
  // can not move here
  if (posMonster[p] >= 0) {
    return false
  }

  // TODO check range

  // delete current position
  const curPos = monsterPos[id]
  if (curPos >= 0) {
    delete posMonster[curPos]
  }

  // update new position
  posMonster[p] = id
  monsterPos[id] = p

  updates.monsterPos[id] = p

  return true
}

function proceedShoot(states: AdventureStates, updates: AdventureStates, id: number, p: number): boolean {
  const { posMonster, monsterPos, monsters } = states

  // already dead
  if (!(monsterPos[id] >= 0)) return false

  const shotId = posMonster[p]
  if (shotId >= 0) {
    const shotMonster = monsters[shotId]
    shotMonster.hp --
    updates.monsters[shotId].hp = shotMonster.hp
    if (shotMonster.hp <= 0) {
      // dead
      delete posMonster[p]
      delete monsterPos[shotId]
      delete monsters[shotId]

      // mark dead
      updates.monsterPos[shotId] = DEAD_POSITION
    }
  }

  return true
}

function proceedAction(states: AdventureStates, updates: AdventureStates, action: AdventureAction): boolean {
  const func = action.type === ActionType.MOVE ? proceedMove : proceedShoot
  const rs = func(states, updates, action.id, action.val)
  if (rs) {
    updates.actions.push(action)
  }

  return rs
}

export function adventureUpdate(states: AdventureStates, actions: AdventureAction[]): AdventureStates {
  const updates: AdventureStates = { posMonster: {}, monsterPos: {}, monsters: {}, actions: [] }

  for (const action of actions) {
    const rs = proceedAction(states, updates, action)
    // if (rs) appliedActions.push(action)
  }

  return updates
}
