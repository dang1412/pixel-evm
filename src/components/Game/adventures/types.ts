export interface MonsterState {
  id: number  // 8bit
  hp: number  // 4bit
  type: MonsterType // 4bit
  target: number // 16bit
  pos10: number // 24bit
  // weapon: number // 8bit

  // size 8bit
  // sizex: number // <=10
  // sizey: number // <=10
}

export interface AdventureStates {
  // main info
  monsters: {[id: number]: MonsterState}
  // position to id
  posMonster: {[p: number]: number}
  // id to cover pixels
  coverPixels: {[id: number]: number[]}
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
  // AXIE,
  // SONIC,
  // SHINIC,
  // SHINIC2,
  // SHADOW,
  MEGAMAN,
  MONSTER,
}

export interface MonsterInfo {
  spritesheet: string
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