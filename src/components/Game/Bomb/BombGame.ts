import { positionToXY, xyToPosition } from '../utils'
import { BombMap } from './BombMap'
import { BombNetwork } from './BombNetwork'

import { BombState, GameState, ItemState, PlayerState } from './types'

const GameLoop = 200

let playerId = 1

export class BombGame {
  state: GameState = {
    bombs: [],
    explosions: [],
  }

  private bombStateMap = new Map<number, BombState>()
  private itemMap = new Map<number, ItemState>()

  // playerId => state
  private playerStateMap = new Map<number, PlayerState>()

  // position => ownerId
  private explosionMap = new Map<number, number>()

  // playerId => number of bombs using
  private playerUsingBombs = new Map<number, number>()

  private caughtItems: number[] = []
  private explodedBombs: BombState[] = []

  constructor(private bombNetwork: BombNetwork) {
    setInterval(() => {
      this.update()
    }, GameLoop)
  }

  getPlayerStates() {
    return Array.from(this.playerStateMap.values())
  }

  addPlayer() {
    const id = playerId++
    const newPlayer = { id, score: 0, bombs: 5, r: 5 }
    this.playerStateMap.set(id, newPlayer)

    return newPlayer
  }

  addBomb(ownerId: number, x: number, y: number) {
    const pos = xyToPosition(x, y)

    if (this.bombStateMap.has(pos)) return

    const playerState = this.playerStateMap.get(ownerId)
    if (!playerState) return

    console.log('Add bomb', pos, x, y)
    const usingBombs = this.playerUsingBombs.get(ownerId) || 0
    if (usingBombs >= playerState.bombs) return

    const bomb: BombState = { ownerId, pos, live: 3000, blastRadius: playerState.r }
    this.bombStateMap.set(pos, bomb)
    this.playerUsingBombs.set(ownerId, usingBombs + 1)

    return bomb
  }

  update() {
    this.explosionMap.clear()
    this.caughtItems = []
    this.explodedBombs = []

    for (const [pos, bombState] of this.bombStateMap) {
      bombState.live -= GameLoop
      if (bombState.live <= 0) {
        this.explode(pos, bombState)
      }
    }

    const bombs = Array.from(this.bombStateMap.values())
    const explosions = Array.from(this.explosionMap.keys())

    // add exploded bombs
    for (const bomb of this.explodedBombs) {
      bombs.push(bomb)
    }

    // state update
    // this.bombMap.updateBombs(bombs)
    // this.bombMap.addExplosions(explosions)
    // this.bombMap.removeItems(this.caughtItems)

    this.bombNetwork.gameUpdate({ type: 'bombs', bombs })
    this.bombNetwork.gameUpdate({ type: 'explosions', explosions })
    this.bombNetwork.gameUpdate({ type: 'removeItems', positions: this.caughtItems })

    // generate item
    const newItems: ItemState[] = []
    if (this.itemMap.size < 100) {
      const pos = Math.floor(Math.random() * 10000)
      if (!this.itemMap.has(pos)) {
        const item: ItemState = { pos, type: 0, points: Math.floor(Math.random() * 99) + 1 }
        this.itemMap.set(pos, item)
        newItems.push(item)
        // this.bombMap.addItem(pos, item)
      }
    }

    if (newItems.length > 0) {
      this.bombNetwork.gameUpdate({ type: 'addItems', items: newItems })
    }

    // score
    // this.bombMap.updateScore(this.playerStateMap.get(1)?.score || 0)
    const players = this.getPlayerStates()
    this.bombNetwork.gameUpdate({ type: 'players', players })
  }

  getCurrentStates() {
    const players = this.getPlayerStates()
    const items = Array.from(this.itemMap.values())

    return { players, items }
  }

  private explode(pos: number, bombState: BombState) {
    const { ownerId, blastRadius: r } = bombState
    const usingBombs = this.playerUsingBombs.get(ownerId) || 1
    this.playerUsingBombs.set(ownerId, usingBombs - 1)

    this.explodedBombs.push(bombState)
    this.bombStateMap.delete(pos)
    
    // check items caught
    const { x, y } = positionToXY(pos)
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
    for (const pos of affectedPositions) {
      this.explosionMap.set(pos, ownerId)
      // check item
      const item = this.itemMap.get(pos)
      if (item) {
        const playerState = this.playerStateMap.get(ownerId)
        if (playerState) {
          playerState.score += item.points
        }
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
