export interface GameState {
  bombs: number[]
  explosions: number[]
}

export interface BombState {
  ownerId: number
  pos: number
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

export interface PlayerState {
  id: number
  score: number
  bombs: number
  r: number
}
