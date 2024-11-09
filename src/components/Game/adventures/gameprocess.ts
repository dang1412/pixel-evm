import { ActionType, AdventureAction, AdventureStates, AdventureStateUpdates } from './types'

// function proceedMove(states: AdventureStates, updates: AdventureStateUpdates, id: number, p: number): boolean {
//   const { posMonster, monsters } = states
//   // can not move here
//   if (posMonster[p] >= 0) {
//     return false
//   }

//   // TODO check range

//   // delete current position
//   const curPos = monsters[id].pos
//   if (curPos >= 0) {
//     delete posMonster[curPos]
//   }

//   // update new position
//   posMonster[p] = id
//   monsters[id].pos = p

//   updates.monsters[id] = monsters[id]

//   return true
// }

function proceedShoot(states: AdventureStates, updates: AdventureStateUpdates, id: number, p: number): boolean {
  const { posMonster, monsters } = states

  // already dead
  if (!monsters[id]) return false

  const shotIds = posMonster[p] || []
  for (const shotId of shotIds) {
  // if (shotId >= 0) {
    const shotMonster = monsters[shotId]
    shotMonster.hp --
    updates.monsters[shotId] = shotMonster
    if (shotMonster.hp <= 0) {
      // dead
      delete posMonster[p]
      // delete monsterPos[shotId]
      delete monsters[shotId]
    }
  }

  return true
}

function proceedAction(states: AdventureStates, updates: AdventureStateUpdates, action: AdventureAction): boolean {
  const func = action.type === ActionType.MOVE ? proceedShoot : proceedShoot
  const rs = func(states, updates, action.id, action.pos)
  if (rs) {
    updates.actions.push(action)
  }

  return rs
}

export function adventureUpdate(states: AdventureStates, actions: AdventureAction[]): AdventureStateUpdates {
  const updates: AdventureStateUpdates = { monsters: {}, actions: [] }

  for (const action of actions) {
    const rs = proceedAction(states, updates, action)
    // if (rs) appliedActions.push(action)
  }

  return updates
}
