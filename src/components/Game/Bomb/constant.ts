import { BombType } from './types'

export const GameLoop = 200

export const bombPrices: { [type in BombType]: number } = {
  [BombType.Standard]: 100,
  [BombType.Atomic]: 500,
}

// Fisher-Yates shuffle algorithm
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

const BOMB_COLORS_BASE = [
  0x333333, // Lighter Dark Grey
  0x333366, // Lighter Dark Blue
  0x336633, // Lighter Dark Green
  0x663366, // Lighter Dark Purple
  0x666633, // Lighter Dark Yellow (Olive)
  0x336666, // Lighter Dark Cyan (Teal)
  0x00004A, // Dark Blue
  0x003300, // Dark Green
  0x4A004A, // Dark Purple
  0x4A4A00, // Dark Yellow (Olive)
  0x004A4A, // Dark Cyan (Teal)
  0x4A0000, // Dark Red
  0x663300, // Dark Orange (Brown)
  0x4A4A4A, // Medium Grey
  0x004A00, // Forest Green
  0x3D004D, // Dark Magenta
]

// export const BOMB_COLORS = shuffleArray(BOMB_COLORS_BASE)
export const BOMB_COLORS = BOMB_COLORS_BASE