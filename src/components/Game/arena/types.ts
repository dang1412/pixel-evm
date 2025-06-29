import { PointData } from 'pixi.js'
import { PixelImage } from '../types'

export enum MonsterType {
  Axie
}

export enum ActionType {
  Move,
  Shoot,
  ShootBomb,
  ShootFire,
}

export enum VehicleType {
  None,
  Car,
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
