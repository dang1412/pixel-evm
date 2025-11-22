import { ClientMessage } from '@/providers/types'
import { positionToXY, xyToPosition } from '../utils'
import { BombNetwork } from './BombNetwork'
import { bombPrices, GameLoop } from './constant'

import { BombState, BombType, GameState, ItemState, PlayerState } from './types'

let playerId = 1

function getInitPlayerBombs(): Pick<PlayerState, 'bombs'> {
  return {
    bombs: {
      [BombType.Standard]: 0,
      [BombType.Atomic]: 0,
    },
  }
}

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
  private explosionMap = new Map<number, { playerId: number, d: number, type: BombType }>()

  private updatedPlayerIds = new Set<number>()

  private gameId = 0
  private originalGameId = 0

  private maxStarsCount = 100

  constructor(
    private bombNetwork: BombNetwork,
    private host: string,
    private sendServer: (msg: ClientMessage) => void
  ) {
    setInterval(() => {
      this.update()
    }, GameLoop)

    bombNetwork.gameUpdate({ type: 'gameState', state: this.state })

    // notify server about game creation
    sendServer({ action: 'bomb_game', msg: { type: 'create_game', payload: { host } } })
  }

  // receive gameId from server
  setGameId(id: number) {
    this.gameId = id
    // self connect in case this is original game (no restart yet)
    if (!this.originalGameId) {
      this.sendServer({
        action: 'bomb_game',
        msg: { type: 'connect', payload: { gameId: this.gameId, client: this.bombNetwork.myWsName || '' } }
      })
    }
  }

  getPlayerStates() {
    return Array.from(this.playerStateMap.values())
  }

  connected(from: string) {
    // notify server about new connection
    this.sendServer({ action: 'bomb_game', msg: { type: 'connect', payload: { gameId: this.gameId, client: from } } })
  }

  addPlayer(host: string, name: string, _id?: number) {
    if (!this.gameId) {
      console.warn('Game ID not set yet')
      return
    }

    console.log('Adding player', host, name, _id)

    const id = _id || playerId++
    const newPlayer = this.playerStoreMap.get(id)
      || {
        id, name, score: 0, r: 2,
        ...getInitPlayerBombs(),
      }

    if (!this.state.pausing) {
      // game already started, give initial bombs
      newPlayer.bombs[BombType.Standard] = 30
      newPlayer.bombs[BombType.Atomic] = 1
    }

    this.playerStateMap.set(id, newPlayer)

    // notify all the new player
    this.bombNetwork.gameUpdate({ type: 'players', players: [newPlayer] })

    // notify server about new player
    this.sendServer({ action: 'bomb_game', msg: { type: 'join', payload: { gameId: this.gameId, client: host || this.host, playerId: id, name } } })

    return newPlayer
  }

  removePlayer(id: number) {
    const player = this.playerStateMap.get(id)
    if (!player) return

    this.playerStoreMap.set(id, player)
    this.playerStateMap.delete(id)

    // notify all the removed player by sending negative score
    const removed = { ...player, score: -1 }
    this.bombNetwork.gameUpdate({ type: 'players', players: [removed] })
  }

  addBomb(playerId: number, x: number, y: number, bombType = BombType.Standard) {
    if (!this.gameId || this.state.pausing) return

    const pos = xyToPosition(x, y)

    const playerState = this.playerStateMap.get(playerId)
    if (!playerState) return

    // already bomb
    const bomb = this.bombStateMap.get(pos)
    if (bomb) {
      // defuse the bomb
      if (bomb.ownerId === playerId) {
        this.bombStateMap.delete(pos)
        console.log('Defuse bomb', pos, x, y, bombType)
        this.bombNetwork.gameUpdate({ type: 'bombs', bombs: [{ ...bomb, live: 0 }] })

        // increase back the bomb count
        playerState.bombs[bomb.type]++
        this.bombNetwork.gameUpdate({ type: 'players', players: [{...playerState}] })
      }

      return
    }

    // ran out of bombs
    if (playerState.bombs[bombType] <= 0) return
    playerState.bombs[bombType]--

    console.log('Add bomb', pos, x, y, bombType)
    const blastRadius = bombType === BombType.Standard ? playerState.r : 9
    const newBomb: BombState = { ownerId: playerId, pos, live: 3000, blastRadius, type: bombType }
    this.bombStateMap.set(pos, newBomb)

    // notify all the new bomb
    this.bombNetwork.gameUpdate({ type: 'bombs', bombs: [newBomb] })

    this.bombNetwork.gameUpdate({ type: 'players', players: [{...playerState}] })

    // notify server about new bomb
    this.sendServer({ action: 'bomb_game', msg: { type: 'place_bomb', payload: { gameId: this.gameId, round: this.state.round, playerId, pos, bombType } } })

    return newBomb
  }

  buyBomb(playerId: number, bombType: BombType, quantity: number) {
    const playerState = this.playerStateMap.get(playerId)
    if (!playerState) return

    const cost = bombPrices[bombType] * quantity
    if (playerState.score < cost) return

    playerState.score -= cost
    playerState.bombs[bombType] += quantity
    this.bombNetwork.gameUpdate({ type: 'players', players: [{...playerState}] })

    // notify server about buy bomb
    this.sendServer({ action: 'bomb_game', msg: { type: 'buy_bomb', payload: { gameId: this.gameId, playerId, bombType, quantity } } })
  }

  /**
   * Admin(host)'s functions
   */

  startRound() {
    if (this.state.round >= 5) return // max 5 rounds
    this.state.round++
    this.state.pausing = false
    this.state.timeLeft = 100 // seconds
    this.maxStarsCount = 120 * this.state.round

    // reset player's standard bombs
    for (const playerState of this.playerStateMap.values()) {
      playerState.bombs[BombType.Standard] += 30
      playerState.bombs[BombType.Atomic] += 1
      playerState.r = 2 + this.state.round
    }

    // send game state
    this.bombNetwork.gameUpdate({ type: 'gameState', state: this.state })

    // send player states
    this.bombNetwork.gameUpdate({ type: 'players', players: this.getPlayerStates() })
  }

  restart() {
    // game state
    this.state = {
      timeLeft: 0,
      round: 0,
      pausing: true,
    }
    this.bombNetwork.gameUpdate({ type: 'gameState', state: this.state })

    // players
    const players = this.getPlayerStates()
    for (const player of players) {
      player.score = 0
      Object.assign(player, getInitPlayerBombs())
    }
    this.bombNetwork.gameUpdate({ type: 'players', players })

    // notify server to reset
    if (!this.originalGameId) this.originalGameId = this.gameId
    this.gameId = 0
    this.sendServer({ action: 'bomb_game', msg: { type: 'create_game', payload: { host: this.host, originalGameId: this.originalGameId } } })
  }

  private update() {
    if (this.state.pausing && this.bombStateMap.size === 0) return
    this.explosionMap.clear()
    // this.caughtItems = []
    const explodedBombs: BombState[] = []

    for (const [pos, bombState] of this.bombStateMap) {
      bombState.live -= GameLoop
      if (bombState.live <= 0) {
        const bombs = this.explode(pos, bombState)
        explodedBombs.push(...bombs)
      }
    }

    // only get standard bomb explosion positions
    const explosions = Array.from(this.explosionMap.keys())
    const standardExplosions = explosions
      // .filter(p => this.explosionMap.get(p)?.type === BombType.Standard)

    if (explodedBombs.length) {
      this.bombNetwork.gameUpdate({ type: 'bombs', bombs: explodedBombs })
    }
    if (standardExplosions.length) {
      this.bombNetwork.gameUpdate({ type: 'explosions', explosions: standardExplosions })
    }

    // remove caught items
    const caughtItems: number[] = []
    for (const pos of explosions) {
      const item = this.itemMap.get(pos)
      if (item) {
        const playerId = this.explosionMap.get(pos)!.playerId
        const playerState = this.playerStateMap.get(playerId)
        if (playerState) {
          playerState.score += item.points
          this.updatedPlayerIds.add(playerId)
        }
        caughtItems.push(pos)
        this.itemMap.delete(pos) // Remove item once caught
      }
    }
    if (caughtItems.length > 0) {
      this.bombNetwork.gameUpdate({ type: 'removeItems', positions: caughtItems })
    }

    // generate items
    const newItems: ItemState[] = []
    if (this.itemMap.size < this.maxStarsCount) {
      const count = Math.random() * 10 + 1
      for (let i = 0; i < count; i++) {
        const pos = Math.floor(Math.random() * 10000)
        if (!this.itemMap.has(pos)) {
          const item: ItemState = { pos, type: 0, points: Math.floor(Math.random() * 99) + 1 }
          this.itemMap.set(pos, item)
          newItems.push(item)
        }
      }
    }

    if (newItems.length > 0) {
      this.bombNetwork.gameUpdate({ type: 'addItems', items: newItems })
    }

    // score
    this.sendPlayerUpdates()

    // time left
    this.state.timeLeft = Math.round(Math.max(this.state.timeLeft - GameLoop / 1000, 0) * 10) / 10

    // round end
    const update: Partial<GameState> = {}
    if (this.state.timeLeft === 0) {
      this.state.pausing = true
      update.pausing = true
      // round ends if no bombs left, notify scores to server
      if (this.bombStateMap.size === 0) {
        const playerScores = this.getPlayerStates().map(p => ({ playerId: p.id, score: p.score }))
        console.log('Round ended, sending scores to server', playerScores)
        this.sendServer({
          action: 'bomb_game',
          msg: {
            type: 'scores',
            payload: {
              gameId: this.gameId,
              round: this.state.round,
              players: playerScores,
            }
          }
        })
      }
    }

    // check if timeLeft is integer value
    if (Number.isInteger(this.state.timeLeft)) {
      // send time update every second
      update.timeLeft = this.state.timeLeft
      this.bombNetwork.gameUpdate({ type: 'gameState', state: update })
    }
  }

  private sendPlayerUpdates() {
    if (this.updatedPlayerIds.size === 0) return

    const players = Array.from(this.updatedPlayerIds)
      .map(id => ({...this.playerStateMap.get(id)} as PlayerState))
      .filter(p => p !== undefined)

    this.updatedPlayerIds.clear()
    this.bombNetwork.gameUpdate({ type: 'players', players })
  }

  getCurrentStates() {
    const players = this.getPlayerStates()
    const items = Array.from(this.itemMap.values())

    return { players, items, state: this.state }
  }

  private explode(pos: number, bombState: BombState) {
    const { ownerId, blastRadius: r, type } = bombState
    const bombs = [bombState]
    this.bombStateMap.delete(pos)
    
    // check items caught
    const { x, y } = positionToXY(pos)
    const { affectedPositions, affedtedBombPositions } = type === BombType.Standard
      ? this.calculateStandardExplodePositions(x, y, r)
      : this.calculateAtomicExplodePositions(x, y, r)

    // explode
    for (const pos of affectedPositions) {
      // calculate distance
      const {x: ex, y: ey} = positionToXY(pos)
      const d = (ex - x) ** 2 + (ey - y) ** 2
      const p = this.explosionMap.get(pos)
      if (!p || p.d > d) {
        // update explosion map
        this.explosionMap.set(pos, { playerId: ownerId, d, type })
      }
    }

    // affected bombs explode
    for (const pos of affedtedBombPositions) {
      const bombState = this.bombStateMap.get(pos)
      if (bombState) {
        bombState.live = 0
        const explodedBombs = this.explode(pos, bombState)
        bombs.push(...explodedBombs)
      }
    }

    return bombs
  }

  private calculateStandardExplodePositions(x: number, y: number, r: number) {
    const affectedPositions = [xyToPosition(x, y)]
    const affedtedBombPositions: number[] = []

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

    return { affectedPositions, affedtedBombPositions }
  }

  private calculateAtomicExplodePositions(x: number, y: number, r: number) {
    const affectedPositions = [xyToPosition(x, y)]
    const affedtedBombPositions: number[] = []

    // Atomic bomb affects all positions in a square area
    for (let dx = -r; dx <= r; dx++) {
      for (let dy = -r; dy <= r; dy++) {
        if (dx * dx + dy * dy <= r * r) {
          const affectedPos = xyToPosition(x + dx, y + dy)
          if (this.bombStateMap.has(affectedPos)) {
            affedtedBombPositions.push(affectedPos)
          } else if (!this.explosionMap.has(affectedPos)) {
            affectedPositions.push(affectedPos)
          }
        }
      }
    }

    return { affectedPositions, affedtedBombPositions }
  }
}
