export interface AdventureMonster {
  id: number  // 8bit
  hp: number  // 4bit
  type: number // 4bit
  // size: number
}

export interface AdventureStates {
  // position to id
  posMonster: {[p: number]: number}
  // id to position
  monsterPos: {[id: number]: number}
  // monsters
  monsters: {[id: number]: AdventureMonster}
  // actions
  actions: AdventureAction[]
}

export enum ActionType {
  MOVE,
  SHOOT
}

export interface AdventureAction {
  id: number  // 8bit
  to: number  // 15bit
  type: ActionType  // 1bit
}