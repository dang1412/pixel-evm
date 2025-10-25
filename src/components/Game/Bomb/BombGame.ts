import { positionToXY, xyToPosition } from '../utils'
import { BombMap } from './BombMap'

import { BombState, GameState, ItemState } from './types'

const GameLoop = 200

export class BombGame {
  state: GameState = {
    bombs: [],
    explosions: [],
  }

  bombStateMap = new Map<number, BombState>()
  itemMap = new Map<number, ItemState>()
  score = 0

  addBomb(x: number, y: number) {
    const pos = xyToPosition(x, y)

    if (this.bombStateMap.has(pos)) return

    console.log('Add bomb', pos, x, y)
    this.bombStateMap.set(pos, { live: 3000 })
  }

  constructor(private bombMap: BombMap) {
    setInterval(() => {
      this.update()
    }, GameLoop)
  }

  update() {
    const explosions = []

    for (const [pos, bombState] of this.bombStateMap) {
      bombState.live -= GameLoop
      if (bombState.live <= 0) {
        explosions.push(pos)
        this.bombStateMap.delete(pos)
        console.log('Explosion', pos)

        // check items caught
        const { x, y } = positionToXY(pos)
        const affectedPositions: number[] = []
        // Add the bomb's position itself
        affectedPositions.push(pos)

        // Check 4 directions for 3 pixels
        for (let i = 1; i <= 3; i++) {
          affectedPositions.push(xyToPosition(x + i, y))
          affectedPositions.push(xyToPosition(x - i, y))
          affectedPositions.push(xyToPosition(x, y + i))
          affectedPositions.push(xyToPosition(x, y - i))
        }

        const caughtItems: number[] = []
        for (const affectedPos of affectedPositions) {
          if (this.itemMap.has(affectedPos)) {
            const item = this.itemMap.get(affectedPos)
            if (item) {
              this.score += item.points
            }
            caughtItems.push(affectedPos)
            this.itemMap.delete(affectedPos) // Remove item once caught
          }
        }
        this.bombMap.removeItems(caughtItems)
      }
    }

    const bombs = Array.from(this.bombStateMap.keys())

    if (explosions.length > 0) {
      // state update
      this.state = { bombs, explosions }
      this.bombMap.update(this.state)
    }

    // generate item
    if (this.itemMap.size < 100) {
      const pos = Math.floor(Math.random() * 10000)
      if (!this.itemMap.has(pos)) {
        const item: ItemState = { type: 0, points: Math.floor(Math.random() * 99) + 1 }
        this.itemMap.set(pos, item)
        this.bombMap.addItem(pos, item)
      }
    }

    // 
    this.bombMap.updateScore(this.score)
  }
}
