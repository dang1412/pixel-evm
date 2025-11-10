import { BombType } from './types'

export const GameLoop = 200

export const bombPrices: { [type in BombType]: number } = {
  [BombType.Standard]: 50,
  [BombType.Atomic]: 200,
}
