import { PointData } from 'pixi.js'
import { PixelImage } from '../types'

export interface MonsterState {
  id: number  // 8bit
  hp: number  // 4bit
  type: MonsterType // 4bit
  target: PointData // 16bit
  pos: PointData // 24bit
  mapIdx: number // 8bit
}

export interface AdventureStates {
  // main info
  monsters: {[id: number]: MonsterState}
  // mapIdx, position to ids
  mapIdxPosMonsters: {[idx: number]: {[p: number]: number[]}}
  // mapIdx, monsterId to cover pixels
  mapIdxMonsterCoverPixels: {[idx: number]: {[id: number]: number[]}}
  // monsterIsLeft
  monsterIsLeft: {[id: number]: boolean}

  // attack state 0,1,2...
  monsterAttackStates: {[id: number]: number}

  // image blocks
  imageBlocks: PixelImage[]
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
  ENTER,
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
