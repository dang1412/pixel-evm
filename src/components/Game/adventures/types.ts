import { PointData } from 'pixi.js'

export interface MonsterState {
  id: number  // 8bit
  hp: number  // 4bit
  type: MonsterType // 4bit
  target: PointData // 16bit
  pos: PointData // 24bit
}

export interface AdventureStates {
  // main info
  monsters: {[id: number]: MonsterState}
  // position to ids
  posMonster: {[p: number]: number[]}
  // id to cover pixels
  coverPixels: {[id: number]: number[]}
  // monsterIsLeft
  monsterIsLeft: {[id: number]: boolean}
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
  pos: PointData  // 20bit
  type: ActionType  // 4bit
}

export enum MonsterType {
  // AXIE,
  // SONIC,
  // SHINIC,
  // SHINIC2,
  // SHADOW,
  MEGAMAN,
  NINJA,
  CYBORG,
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

  // number of pixel per loop
  moveSpeed: number

  isHuman: boolean
}
