export interface GameState {
  timeLeft: number
  round: number
  pausing: boolean
}

export enum BombType {
  Standard,
  Atomic,
  Star,
}

export interface BombState {
  ownerId: number
  pos: number
  live: number
  blastRadius: number
  type: BombType
}

export enum ItemType {
  Star,
  StarPlus,
  StarMinus,
  StarBonus,
  StarExplode,
}


export interface ItemState {
  pos: number
  type: ItemType
  points: number
  colorIndex: number
}

export interface PlayerState {
  id: number
  name: string
  score: number
  bombs: {[type in BombType]: number}
  r: number
}

export interface CaughtItem {
  pos: number
  point: number
  playerId: number
}
