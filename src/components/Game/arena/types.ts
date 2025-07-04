import { PointData } from 'pixi.js'
import { PixelImage } from '../types'

export enum MonsterType {
  Axie,
  Tralarelo,
  TrippiTroppi,
}

export enum ActionType {
  Move,
  Shoot,
  ShootBomb,
  ShootFire,
  DropVehicle,
}

export enum VehicleType {
  None,
  Car,
}

export enum MapItemType {
  Car,
  Bomb,
  Fire,
}

// State that sends to client
export interface MonsterState {
  id: number  // 4bit
  type: MonsterType // 4bit
  hp: number  // 4bit
  vehicle: VehicleType  // 4bit
  pos: PointData // 16bit
  weapons: { // 8bit
    [ActionType.ShootBomb]: number,
    [ActionType.ShootFire]: number,
  }
}

export interface ArenaAction {
  id: number  // 4bit
  actionType: ActionType  // 4bit
  target: PointData  // 16bit
}

export interface ArenaGameState {
  monsters: { [id: number]: MonsterState }
  positionMonsterMap: { [pos: number]: number } // pixel to monster id

  roundActions: { [id: number]: ArenaAction }
  currentRound: number
  aliveNumber: number
  executedOrder: number[]

  positionItemMap: { [pos: number]: MapItemType } // pixel to item type
}

export enum UpdateType {
  All,
  Hp,
  Pos,
  Action,
  Weapon,
}

export interface MonsterUpdate {
  type: UpdateType  // 8bit
  data: Partial<MonsterState> // depends on type
}

export interface ArenaGameUpdates {
  updates: MonsterUpdate[]
  actions: ArenaAction[]
}

export interface MonsterDrawInfo {
  type: MonsterType
  image: string
  w: number
  h: number
}
