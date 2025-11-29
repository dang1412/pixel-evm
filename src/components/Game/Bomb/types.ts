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

export type GameMessage = 
  // client to host
  | { type: 'join', name: string }
  | { type: 'addBomb', playerId: number, x: number, y: number, bombType: BombType }
  | { type: 'buyBomb', bombType: BombType, quantity: number }

  // host to client
  | { type: 'joinSuccess', players: PlayerState[], playerId: number }
  | { type: 'bombs', bombs: BombState[] }
  | { type: 'explosions', explosions: number[] }
  | { type: 'addItems', items: ItemState[] }
  | { type: 'removeItems', items: CaughtItem[] }
  | { type: 'players', players: PlayerState[] }

  | { type: 'gameState', state: Partial<GameState> }
  | { type: 'reset' }

export type RecordedGame = {
  gameId: number
  data: {
    [round: number]: {
      [roundFrame: number]: {
        ts: number
        msg: GameMessage
      }[]
      maxFrame: number
    }
  }
}

