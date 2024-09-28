import { ViewportMap } from '../ViewportMap'
import { ActionType, AdventureAction, AdventureStates } from './types'

function proceedMove(states: AdventureStates, id: number, p: number): boolean {
  const { posMonster, monsterPos } = states
  if (posMonster[p] >= 0) {
    return false
  }

  // TODO check range

  const curPos = monsterPos[id]
  if (curPos >= 0) {
    delete posMonster[curPos]
  }

  posMonster[p] = id
  monsterPos[id] = p

  return true
}

function proceedShoot(states: AdventureStates, id: number, p: number): boolean {
  const { posMonster, monsterPos, monsters } = states

  if (!(monsterPos[id] >= 0)) return false

  const shotId = posMonster[p]
  if (shotId >= 0) {
    const shotMonster = monsters[shotId]
    shotMonster.hp --
    if (shotMonster.hp <= 0) {
      // dead
      delete posMonster[p]
      delete monsterPos[shotId]
      delete monsters[shotId]
    }
  }

  return true
}

function proceedAction(states: AdventureStates, action: AdventureAction): boolean {
  const func = action.type === ActionType.MOVE ? proceedMove : proceedShoot
  return func(states, action.id, action.to)
}

function adventureUpdate(states: AdventureStates, actions: AdventureAction[]): AdventureAction[] {
  const appliedActions: AdventureAction[] = []

  for (const action of actions) {
    const rs = proceedAction(states, action)
    if (rs) appliedActions.push(action)
  }

  return appliedActions
}

export class Adventures {
  states: AdventureStates = { posMonster: {}, monsterPos: {}, monsters: {}, actions: [] }
  // actionsBuffer: AdventureAction[] = []

  constructor(map: ViewportMap) {}

  // Server functions

  // receiveAction(action: AdventureAction) {
  //   this.actionsBuffer.push(action)
  // }

  // resetBuffer() {
  //   this.actionsBuffer = []
  // }

  applyActions(actions: AdventureAction[]): AdventureAction[] {
    const appliedActions = adventureUpdate(this.states, actions)

    return appliedActions
  }

  drawActions(actions: AdventureAction[]) {

  }
}
