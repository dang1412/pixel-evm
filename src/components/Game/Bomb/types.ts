export interface GameState {
  bombs: number[]
  explosions: number[]
}

export interface BombState {
  live: number
}

export enum ItemType {
  Star
}

export interface ItemState {
  type: ItemType
  points: number
}
