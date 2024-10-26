export interface MonsterState {
  id: number  // 8bit
  hp: number  // 4bit
  type: MonsterType // 4bit
  pos: number // 16bit
  // weapon: number // 8bit
  // size: number
}

export interface AdventureStates {
  // position to id
  posMonster: {[p: number]: number}
  // id to position
  // monsterPos: {[id: number]: number}
  // monsters
  monsters: {[id: number]: MonsterState}
  // actions
  // actions: AdventureAction[]
}

export interface AdventureStateUpdates {
  monsters: {[id: number]: MonsterState}
  actions: AdventureAction[]
}

export enum ActionType {
  MOVE,
  SHOOT,
  ONBOARD,
  WEAR,
}

export interface AdventureAction {
  id: number  // 8bit
  val: number  // 14bit
  type: ActionType  // 2bit
}

export enum MonsterType {
  AXIE,
  SONIC,
  SHINIC,
  SHINIC2,
}

export interface MonsterInfo {
  image: string
  imageMove: string
  w: number
  h: number
  offX: number
  offY: number

  moveRange: number
  shootRange: number
  shootSpeed: number
}