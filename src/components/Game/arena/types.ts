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
  vehicle: number  // 4bit
  pos: PointData // 16bit
  target: PointData // 16bit
  action: ActionType // 8bit
  weapons: { // 8bit
    [ActionType.ShootBomb]: number,
    [ActionType.ShootFire]: number,
  }
}

export enum UpdateType {
  All,
  Hp,
  Pos,
  Action,
  Weapon,
}

export interface ArenaAction {
  id: number  // 4bit
  type: ActionType  // 4bit
  pos: PointData  // 16bit
}

export interface ArenaGameState {
  monsters: { [id: number]: MonsterState }
}

export interface ArenaGameUpdates {
  updates: {
    type: UpdateType  // 8bit
    data: Partial<MonsterState> // depends on type
  }[]
  actions: ArenaAction[]
}
