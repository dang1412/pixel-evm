import { positionToXY, xyToPosition } from '../utils'
import { BombMap } from './BombMap'

import { BombState, GameState, ItemState } from './types'

const GameLoop = 200

export class BombGame {
  state: GameState = {
    bombs: [],
    explosions: [],
  }

  private bombStateMap = new Map<number, BombState>()
  private itemMap = new Map<number, ItemState>()

  // ownerId => score
  private scoreMap = new Map<number, number>()

  // position => ownerId
  private explosionMap = new Map<number, number>()

  // ownerId => number of bombs using
  private ownerUsingBombs = new Map<number, number>()

  private caughtItems: number[] = []

  addBomb(ownerId: number, x: number, y: number) {
    const pos = xyToPosition(x, y)

    if (this.bombStateMap.has(pos)) return

    console.log('Add bomb', pos, x, y)
    const usingBombs = this.ownerUsingBombs.get(ownerId) || 0
    if (usingBombs >= 3) return

    this.bombStateMap.set(pos, { ownerId, live: 3000, blastRadius: 3 })
    this.ownerUsingBombs.set(ownerId, usingBombs + 1)
  }

  constructor(private bombMap: BombMap) {
    setInterval(() => {
      this.update()
    }, GameLoop)
  }

  update() {
    this.explosionMap.clear()
    this.caughtItems = []

    for (const [pos, bombState] of this.bombStateMap) {
      bombState.live -= GameLoop
      if (bombState.live <= 0) {
        this.explode(pos, bombState)
      }
    }

    const bombs = Array.from(this.bombStateMap.keys())
    const explosions = Array.from(this.explosionMap.keys())

    // state update
    this.state = { bombs, explosions }
    this.bombMap.update(this.state)

    this.bombMap.removeItems(this.caughtItems)

    // generate item
    if (this.itemMap.size < 100) {
      const pos = Math.floor(Math.random() * 10000)
      if (!this.itemMap.has(pos)) {
        const item: ItemState = { type: 0, points: Math.floor(Math.random() * 99) + 1 }
        this.itemMap.set(pos, item)
        this.bombMap.addItem(pos, item)
      }
    }

    // score
    this.bombMap.updateScore(this.scoreMap.get(1) || 0)
  }

  private explode(pos: number, bombState: BombState) {
    const { ownerId, blastRadius: r } = bombState
    const usingBombs = this.ownerUsingBombs.get(ownerId) || 1
    this.ownerUsingBombs.set(ownerId, usingBombs - 1)

    this.bombStateMap.delete(pos)

    
    // check items caught
    const { x, y } = positionToXY(pos)
    console.log('Explosion', x, y, ownerId, r)
    const affectedPositions: number[] = []
    // Add the bomb's position itself
    affectedPositions.push(pos)

    const affedtedBombPositions: number[] = []

    // Check 4 directions
    const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]]
    for (const [dx, dy] of dirs) {
      for (let i = 1; i <= r; i++) {
        const affectedPos = xyToPosition(x + dx * i, y + dy * i)

        // stop if meet another explosion
        if (this.explosionMap.has(affectedPos)) {
          break
        }

        // stop if other bomb
        if (this.bombStateMap.has(affectedPos)) {
          affedtedBombPositions.push(affectedPos)
          break
        }

        affectedPositions.push(affectedPos)
      }
    }



    // explode
    // const caughtItems: number[] = []
    for (const pos of affectedPositions) {
      this.explosionMap.set(pos, ownerId)
      // check item
      const item = this.itemMap.get(pos)
      if (item) {
        const score = this.scoreMap.get(ownerId) || 0
        this.scoreMap.set(ownerId, score + item.points)
        this.caughtItems.push(pos)
        this.itemMap.delete(pos) // Remove item once caught
      }
    }

    // affected bombs explode
    for (const pos of affedtedBombPositions) {
      const bombState = this.bombStateMap.get(pos)
      if (bombState) {
        bombState.live = 0
        this.explode(pos, bombState)
      }
    }
  }
}
