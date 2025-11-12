export interface GameState {
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
  bombs: {[type in BombType]: number}
  r: number
}
