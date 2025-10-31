import { positionToXY, xyToPosition } from '../utils'
import { BombMap } from './BombMap'
import { BombNetwork } from './BombNetwork'

import { BombState, GameState, ItemState, PlayerState } from './types'

const GameLoop = 200

let playerId = 1

export class BombGame {
  state: GameState = {
    timeLeft: 0,
    round: 0,
    pausing: true,
  }

  private bombStateMap = new Map<number, BombState>()
  private itemMap = new Map<number, ItemState>()

  // playerId => state
  private playerStateMap = new Map<number, PlayerState>()
  private playerStoreMap = new Map<number, PlayerState>()

  // position => ownerId
  private explosionMap = new Map<number, number>()

  // playerId => number of bombs using
  // private playerUsingBombs = new Map<number, number>()

  private caughtItems: number[] = []
  private explodedBombs: BombState[] = []

  private updatedPlayerIds = new Set<number>()

  constructor(private bombNetwork: BombNetwork) {
    setInterval(() => {
      this.update()
    }, GameLoop)
  }

  getPlayerStates() {
    return Array.from(this.playerStateMap.values())
  }

  addPlayer(_id?: number) {
    const id = _id || playerId++
    const newPlayer = this.playerStoreMap.get(id)
      || { id, score: 0, roundPlacedBombs: 0, placedBombs: 0, totalBombs: 100, r: 5 }
    this.playerStateMap.set(id, newPlayer)

    // notify all the new player
    this.bombNetwork.gameUpdate({ type: 'players', players: [newPlayer] })

    return newPlayer
  }

  removePlayer(id: number) {
    this.playerStoreMap.set(id, this.playerStateMap.get(id)!)
    this.playerStateMap.delete(id)

    // notify all the removed player by sending negative score
    this.bombNetwork.gameUpdate({ type: 'players', players: [{ id, score: -1, roundPlacedBombs: 0, placedBombs: 0, totalBombs: 0, r: 0 }] })
  }

  addBomb(ownerId: number, x: number, y: number) {
    if (this.state.pausing) return

    const pos = xyToPosition(x, y)

    if (this.bombStateMap.has(pos)) return

    const playerState = this.playerStateMap.get(ownerId)
    if (!playerState) return

    console.log('Add bomb', pos, x, y)
    const bomb: BombState = { ownerId, pos, live: 3000, blastRadius: playerState.r }
    this.bombStateMap.set(pos, bomb)

    // notify all the new bomb
    this.bombNetwork.gameUpdate({ type: 'bombs', bombs: [bomb] })

    return bomb
  }

  startRound() {
    this.state.round++
    this.state.pausing = false
    this.state.timeLeft = 90000 // 90 seconds

    // reset player's roundPlacedBombs
    for (const playerState of this.playerStateMap.values()) {
      playerState.roundPlacedBombs = 0
    }

    // send game state
    this.bombNetwork.gameUpdate({ type: 'gameState', state: this.state })

    // send player states
    this.bombNetwork.gameUpdate({ type: 'players', players: this.getPlayerStates() })
  }

  update() {
    if (this.state.pausing && this.bombStateMap.size === 0) return
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

    // states update

    if (bombs.length) {
      this.bombNetwork.gameUpdate({ type: 'bombs', bombs })
    }
    if (explosions.length) {
      this.bombNetwork.gameUpdate({ type: 'explosions', explosions })
    }
    if (this.caughtItems.length > 0) {
      this.bombNetwork.gameUpdate({ type: 'removeItems', positions: this.caughtItems })
    }

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
    this.sendPlayerUpdates()

    // time left
    this.state.timeLeft = Math.max(this.state.timeLeft - GameLoop, 0)
    if (this.state.timeLeft % 1000 === 0) {
      // send time update every second
      if (this.state.timeLeft === 0) {
        this.state.pausing = true
      }
      this.bombNetwork.gameUpdate({ type: 'gameState', state: this.state })
    }
  }

  sendPlayerUpdates() {
    if (this.updatedPlayerIds.size === 0) return

    const players = Array.from(this.updatedPlayerIds)
      .map(id => this.playerStateMap.get(id))
      .filter(p => p !== undefined)

    this.updatedPlayerIds.clear()
    this.bombNetwork.gameUpdate({ type: 'players', players })
  }

  getCurrentStates() {
    const players = this.getPlayerStates()
    const items = Array.from(this.itemMap.values())

    return { players, items }
  }

  private explode(pos: number, bombState: BombState) {
    const { ownerId, blastRadius: r } = bombState
    // const usingBombs = this.playerUsingBombs.get(ownerId) || 1
    // this.playerUsingBombs.set(ownerId, usingBombs - 1)

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
          this.updatedPlayerIds.add(ownerId)
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
