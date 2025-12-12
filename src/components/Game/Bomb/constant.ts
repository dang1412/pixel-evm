import { BombType } from './types'

export const GameLoop = 200

export const bombPrices: { [type in BombType]: number } = {
  [BombType.Standard]: 100,
  [BombType.Atomic]: 500,
  [BombType.Star]: 0,
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

export const starColorSchemes = [
  { glow: 0xFFD700, fill: 0xFFD700, stroke: 0xFF4500, text: 0x32CD32 }, // Gold theme
  // { glow: 0xFF1493, fill: 0x00FFFF, stroke: 0xFF00FF, text: 0xFFFF00 }, // Cyan/Magenta theme
  { glow: 0xFF69B4, fill: 0xFF1493, stroke: 0xFF69B4, text: 0xFFFFFF }, // Hot Pink theme
  { glow: 0x7B68EE, fill: 0x9370DB, stroke: 0x4B0082, text: 0x00FF00 }, // Purple theme
  { glow: 0xFF6347, fill: 0xFF0000, stroke: 0x8B0000, text: 0xFFD700 }, // Ruby theme
  { glow: 0x00CED1, fill: 0x48D1CC, stroke: 0x20B2AA, text: 0xFF69B4 }, // Turquoise theme
  { glow: 0xFF8C00, fill: 0xFFA500, stroke: 0xFF4500, text: 0x00FFFF }, // Orange theme
  { glow: 0x7FFF00, fill: 0x32CD32, stroke: 0x228B22, text: 0xFF00FF }, // Green theme
  { glow: 0xFFFFE0, fill: 0xC0C0C0, stroke: 0x708090, text: 0xFF1493 }, // Silver theme
  { glow: 0xFF00FF, fill: 0x8A2BE2, stroke: 0x9400D3, text: 0x00FF7F }, // Violet theme
  { glow: 0x00FFFF, fill: 0x00CED1, stroke: 0x008B8B, text: 0xFFD700 }, // Cyan theme
  { glow: 0xFFC0CB, fill: 0xFFB6C1, stroke: 0xFF1493, text: 0x9370DB }, // Pink theme
  { glow: 0x87CEEB, fill: 0x4169E1, stroke: 0x000080, text: 0xFFFF00 }, // Sky Blue theme
]