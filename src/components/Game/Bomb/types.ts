export interface GameState {
  bombs: number[]
  explosions: number[]
}

export interface BombState {
  ownerId: number
  live: number
  blastRadius: number
}

export enum ItemType {
  Star
}

export interface ItemState {
  type: ItemType
  points: number
}
