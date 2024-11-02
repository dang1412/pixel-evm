import { ActionType, AdventureAction, AdventureStates, AdventureStateUpdates } from '../types'

export function applyMoveAction(states: AdventureStates, updates: AdventureStateUpdates, id: number, target: number): boolean {
  const { posMonster, monsters } = states
  monsters[id].target = target
  updates.monsters[id] = monsters[id]

  return true
  // // can not move here
  // if (posMonster[p] >= 0) {
  //   return false
  // }

  // // TODO check range

  // // delete current position
  // const curPos = monsters[id].pos
  // if (curPos >= 0) {
  //   delete posMonster[curPos]
  // }

  // // update new position
  // posMonster[p] = id
  // monsters[id].pos = p

  // updates.monsters[id] = monsters[id]

  // return true
}