export interface GameState {
  // bombs: number[]
  // explosions: number[]
  timeLeft: number
  round: number
  pausing: boolean
}

export enum BombType {
  Standard,
  Atomic,
}

export interface BombState {
  ownerId: number
  pos: number
  live: number
  blastRadius: number
  type: BombType
}

export enum ItemType {
  Star
}

export interface ItemState {
  pos: number
  type: ItemType
  points: number
}

export interface PlayerState {
  id: number
  score: number
  roundPlacedBombs: number
  placedBombs: number
  totalBombs: number
  r: number
}
