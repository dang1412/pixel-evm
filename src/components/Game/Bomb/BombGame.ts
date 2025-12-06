import { ClientMessage } from '@/providers/types'

import { positionToXY, xyToPosition } from '../utils'
import { BombNetwork } from './BombNetwork'
import { bombPrices, GameLoop, starColorSchemes } from './constant'

import { BombState, BombType, CaughtItem, GameMessage, GameState, ItemState, ItemType, PlayerState, RecordedGame } from './types'
import { clonePlayerState } from './utils'
import { IPFSService } from '@/lib/webRTC/IPFSService'

let playerId = 1

function getInitPlayerBombs(): Pick<PlayerState, 'bombs'> {
  return {
    bombs: {
      [BombType.Standard]: 0,
      [BombType.Atomic]: 0,
      [BombType.Star]: 0,
    },
  }
}

export class BombGame {
  state: GameState = {
    gameId: 0,
    timeLeft: 0,
    round: 0,
    pausing: true,
    roundEnded: true,
  }

  private bombStateMap = new Map<number, BombState>()
  private itemMap = new Map<number, ItemState>()

  // playerId => state
  private playerStateMap = new Map<number, PlayerState>()
  private playerStoreMap = new Map<number, PlayerState>()

  // position => ownerId
  private explosionMap = new Map<number, { playerId: number, d: number, type: BombType }>()

  private updatedPlayerIds = new Set<number>()

  private originalGameId = 0

  private maxStarsCount = 100

  private roundFrameCount = 0

  private recordedGame: RecordedGame = {
    gameId: 0,
    data: {}
  }

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

    // Go to round 1
    this.nextRound()
  }

  // receive gameId from server
  setGameId(id: number) {
    this.state.gameId = id
    // self connect in case this is original game (no restart yet)
    if (!this.originalGameId) {
      this.sendServer({
        action: 'bomb_game',
        msg: { type: 'connect', payload: { gameId: this.state.gameId, client: this.bombNetwork.myWsName || '' } }
      })
    }

    this.gameUpdateAt(0, { type: 'gameState', state: { gameId: id } })

    // reset recorded game
    this.recordedGame = {
      gameId: this.state.gameId,
      data: {}
    }
  }

  getPlayerStates() {
    return Array.from(this.playerStateMap.values())
  }

  connected(from: string) {
    // notify server about new connection
    this.sendServer({ action: 'bomb_game', msg: { type: 'connect', payload: { gameId: this.state.gameId, client: from } } })
  }

  addPlayer(host: string, name: string, _id?: number) {
    console.log('Adding player', host, name, _id)
    const ts = Date.now()

    const id = _id || playerId++
    const newPlayer = this.playerStoreMap.get(id)
      || {
        id, name, score: 0, r: 2,
        ...getInitPlayerBombs(),
      }

    // initial bombs
    newPlayer.bombs[BombType.Standard] = 30
    newPlayer.bombs[BombType.Atomic] = 1
    newPlayer.r = 2 + this.state.round

    this.playerStateMap.set(id, newPlayer)

    // notify all the new player
    this.gameUpdateAt(ts, { type: 'players', players: [clonePlayerState(newPlayer)] })

    // notify server about new player
    this.sendServer({ action: 'bomb_game', msg: { type: 'join', payload: { gameId: this.state.gameId, client: host || this.host, playerId: id, name } } })

    return newPlayer
  }

  removePlayer(id: number) {
    const player = this.playerStateMap.get(id)
    if (!player) return

    this.playerStoreMap.set(id, player)
    this.playerStateMap.delete(id)

    // notify all the removed player by sending negative score
    const removed = { ...player, score: -1 }
    this.gameUpdateAt(Date.now(), { type: 'players', players: [clonePlayerState(removed)] })
  }

  addBomb(playerId: number, x: number, y: number, bombType = BombType.Standard) {
    if (this.state.timeLeft === 0 || this.state.pausing) return

    const playerState = this.playerStateMap.get(playerId)
    if (!playerState) return
    
    const pos = xyToPosition(x, y)
    const ts = Date.now()

    // already bomb
    const bomb = this.bombStateMap.get(pos)
    if (bomb) {
      // defuse the bomb
      if (bomb.ownerId === playerId) {
        this.bombStateMap.delete(pos)
        console.log('Defuse bomb', pos, x, y, bombType)
        this.gameUpdateAt(ts, { type: 'bombs', bombs: [{ ...bomb, live: 0 }] })

        // increase back the bomb count
        playerState.bombs[bomb.type]++
        this.gameUpdateAt(ts, { type: 'players', players: [clonePlayerState(playerState)] })
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
    this.gameUpdateAt(ts, { type: 'bombs', bombs: [{...newBomb}] })

    this.gameUpdateAt(ts, { type: 'players', players: [clonePlayerState(playerState)] })

    // notify server about new bomb
    // this.sendServer({ action: 'bomb_game', msg: { type: 'place_bomb', payload: { gameId: this.state.gameId, round: this.state.round, playerId, pos, bombType } } })

    return newBomb
  }

  buyBomb(playerId: number, bombType: BombType, quantity: number) {
    const playerState = this.playerStateMap.get(playerId)
    if (!playerState) return

    const cost = bombPrices[bombType] * quantity
    if (playerState.score < cost) return

    const ts = Date.now()

    playerState.score -= cost
    playerState.bombs[bombType] += quantity
    this.gameUpdateAt(ts, { type: 'players', players: [clonePlayerState(playerState)] })
    // notify server about buy bomb
    this.sendServer({ action: 'bomb_game', msg: { type: 'buy_bomb', payload: { gameId: this.state.gameId, playerId, bombType, quantity } } })
  }

  /**
   * Admin(host)'s functions
   */

  canGoNextRound(): boolean {
    // max 5 rounds
    // only next round when paused
    if (this.state.round >= 5 || !this.state.pausing) return false
    // cannot next round if timeLeft = 0 & not roundEnded
    if (this.state.timeLeft === 0 && !this.state.roundEnded) return false
    return true
  }

  nextRound() {
    if (!this.canGoNextRound()) return
    const round = this.state.round + 1
    const prevTimeLeft = this.state.timeLeft
    this.state = {
      gameId: this.state.gameId,
      round,
      pausing: prevTimeLeft > 0 ? true : false,
      timeLeft: 100,
      roundEnded: false,
    }
    this.maxStarsCount = 120 * round
    this.roundFrameCount = 0

    // reset player's standard bombs
    for (const playerState of this.playerStateMap.values()) {
      playerState.bombs[BombType.Standard] += 30
      playerState.bombs[BombType.Atomic] += 1
      playerState.r = 2 + round
    }

    const ts = Date.now()

    // send game state
    this.gameUpdateAt(ts, { type: 'gameState', state: this.state })

    // send player states
    const players = this.getPlayerStates()
    this.bombNetwork.gameUpdate({ type: 'players', players })

    // update recorded init states
    this.recordedGame.data[round] = { maxFrame: 0 }
    // set frame 0 state
    
    this.recordedGame.data[round][0] = [
      // players
      { ts, msg: { type: 'players', players: players.map(clonePlayerState) } },
      // items
      { ts, msg: { type: 'addItems', items: Array.from(this.itemMap.values()) } },
    ]
  }

  playPause() {
    // Cannot unpause if timeLeft = 0
    if (this.state.pausing && this.state.timeLeft === 0) return
    this.state.pausing = !this.state.pausing
    this.bombNetwork.gameUpdate({ type: 'gameState', state: this.state })
  }

  restart() {
    if (!this.state.pausing) return
    // reset bombs, items
    this.bombStateMap.clear()
    this.itemMap.clear()
    // game state
    this.state = {
      gameId: this.state.gameId,
      timeLeft: 0,
      round: 0,
      pausing: true,
      roundEnded: true,
    }
    this.bombNetwork.gameUpdate({ type: 'reset' })

    // players
    const players = this.getPlayerStates()
    for (const player of players) {
      player.score = 0
      Object.assign(player, getInitPlayerBombs())
    }

    // notify server to reset, create new game
    if (!this.originalGameId) this.originalGameId = this.state.gameId
    this.state.gameId = 0
    this.sendServer({ action: 'bomb_game', msg: { type: 'create_game', payload: { host: this.host, originalGameId: this.originalGameId } } })

    this.nextRound()
  }

  private processChainBombs(bombs: BombState[]) {
    // check if 4 bombs form a square
    console.log('Processing chain bombs', bombs)
    const positions = bombs.map(b => b.pos)
    const posSet = new Set(positions)

    // check if 4 positions form a square
    for (const b1 of bombs) {
      const { x: x1, y: y1 } = positionToXY(b1.pos)
      for (const b2 of bombs) {
        if (b1 === b2) continue
        const { x: x2, y: y2 } = positionToXY(b2.pos)
        if (x1 === x2 || y1 === y2) continue
        const dx = x2 - x1
        const dy = y2 - y1
        if (Math.abs(dx) !== Math.abs(dy)) continue
        const p3 = xyToPosition(x1 + dx, y1)
        const p4 = xyToPosition(x1, y1 + dy)
        if (posSet.has(p3) && posSet.has(p4)) {
          // form a square

          // loop through all positions inside the square area (not on edges)
          const minX = Math.min(x1, x2)
          const maxX = Math.max(x1, x2)
          const minY = Math.min(y1, y2)
          const maxY = Math.max(y1, y2)
          for (let x = minX + 1; x < maxX; x++) {
            for (let y = minY + 1; y < maxY; y++) {
              const pos = xyToPosition(x, y)
              const bombAtPos = this.bombStateMap.get(pos)
              if (bombAtPos) {
                this.explode(pos, bombAtPos)
              } else {
                // add to explosion map
                const d = (x - minX) ** 2 + (y - minY) ** 2
                const p = this.explosionMap.get(pos)
                if (!p || p.d > d) {
                  // update explosion map
                  this.explosionMap.set(pos, { playerId: b1.ownerId, d, type: BombType.Standard })
                }
              }
            }
          }

          return true
        }
      }
    }

    return false
  }

  private update() {
    if (this.state.pausing) return
    this.roundFrameCount++
    this.explosionMap.clear()
    const explodedBombs: BombState[] = []

    for (const [pos, bombState] of this.bombStateMap) {
      bombState.live -= GameLoop
      if (bombState.live <= 0) {
        const chainBombs = this.explode(pos, bombState)
        explodedBombs.push(...chainBombs)

        const ownerId = bombState.ownerId
        const playerChainBombs = chainBombs.filter(b => b.ownerId === ownerId)
        this.processChainBombs(playerChainBombs)
      }
    }

    // only get standard bomb explosion positions
    const explosions = Array.from(this.explosionMap.keys())

    const ts = Date.now()
    if (explodedBombs.length) {
      this.gameUpdateAt(ts, { type: 'bombs', bombs: explodedBombs })
    }
    if (explosions.length) {
      this.gameUpdateAt(ts, { type: 'explosions', explosions })
    }

    // remove caught items
    const caughtItems: CaughtItem[] = []
    // players that get bonus points
    const playerBonusMap = new Map<number, number>()
    const activatedStars: ItemState[] = []
    for (const pos of explosions) {
      const item = this.itemMap.get(pos)
      if (item) {
        const playerId = this.explosionMap.get(pos)!.playerId

        // star bonus
        if (item.type === ItemType.StarBonus) {
          const currentBonus = playerBonusMap.get(playerId) || 0
          playerBonusMap.set(playerId, currentBonus + 1)
        }

        // star explode
        if (item.type === ItemType.StarExplode) {
          // add an invisible bomb at the position, explode quickly
          const blastRadius = Math.ceil(item.points / 20)
          const newBomb: BombState = { ownerId: playerId, pos, live: GameLoop * 4, blastRadius, type: BombType.Star }
          this.bombStateMap.set(pos, newBomb)

          // notify all the new bomb
          this.gameUpdateAt(ts, { type: 'bombs', bombs: [{...newBomb}] })
          activatedStars.push(item)
        } else {
          caughtItems.push({ pos, point: item.points, playerId })
          this.itemMap.delete(pos) // Remove item once caught
        }
      }
    }

    // apply caught items
    if (caughtItems.length > 0) {
      // update player scores
      for (const ci of caughtItems) {
        const bonus = playerBonusMap.get(ci.playerId)
        if (bonus) {
          // add 20% points per bonus, if bomb standard explosion caught the item
          if (this.explosionMap.get(ci.pos)?.type === BombType.Standard) {
            ci.point = Math.ceil(ci.point * (1 + 0.2 * bonus))
          }
        }
        const playerState = this.playerStateMap.get(ci.playerId)
        if (playerState) {
          playerState.score += ci.point
          this.updatedPlayerIds.add(ci.playerId)
        }
      }
      this.gameUpdateAt(ts, { type: 'removeItems', items: caughtItems })
    }

    // update bonus points for activated stars
    for (const item of activatedStars) {
      const e = this.explosionMap.get(item.pos)
      if (!e) continue
      // make the star normal
      const updatedItem = { ...item, type: ItemType.Star }
      // bonus points
      const bonus = playerBonusMap.get(e.playerId)
      if (bonus) {
        updatedItem.points = Math.ceil(item.points * (1 + 0.2 * bonus))
      }
      this.itemMap.set(item.pos, updatedItem)
    }

    this.generateItems()

    // score
    this.sendPlayerUpdates()

    // time left
    this.state.timeLeft = Math.round(Math.max(this.state.timeLeft - GameLoop / 1000, 0) * 10) / 10

    // round end
    const update: Partial<GameState> = {}
    if (this.state.timeLeft === 0) {
      // this.state.pausing = true
      // update.pausing = true
      // round ends if no bombs left, notify scores to server
      if (this.bombStateMap.size === 0) {
        const playerScores = this.getPlayerStates().map(p => ({ playerId: p.id, score: p.score }))
        console.log('Round ended, sending scores to server', playerScores)
        this.sendServer({
          action: 'bomb_game',
          msg: {
            type: 'scores',
            payload: {
              gameId: this.state.gameId,
              round: this.state.round,
              players: playerScores,
            }
          }
        })

        console.log('Round ended', this.state.round)
        console.log(this.recordedGame.data[this.state.round])
        this.state.roundEnded = true
        this.state.pausing = true
        update.roundEnded = true
        update.pausing = true

        // finalize recorded game data for the round

        // upload recorded game data to IPFS
        const ipfsService = IPFSService.getInstance()
        ipfsService.add(JSON.stringify(this.recordedGame)).then((cid) => {
          // QmXiQxsYMVZJVThBMWcuac7R5qH1K5aXyipqcHHkspGRMH
          // QmZnbEjjYPCuJofWPiE6kajixN89VGnDSoZbStXx5vZhH2
          console.log('Recorded game data uploaded to IPFS with CID:', cid)
          this.sendServer({
            action: 'bomb_game',
            msg: {
              type: 'add_recorded_game',
              payload: {
                gameId: this.state.gameId,
                gameDataCid: cid,
              }
            }
          })
        })
      }
    }

    // check if timeLeft is integer value
    if (Number.isInteger(this.state.timeLeft / 10)) {
      // send time update every 10 second
      update.timeLeft = this.state.timeLeft
      this.gameUpdateAt(ts, { type: 'gameState', state: update })
    }
  }

  recordViewChange(msg: GameMessage) {
    if (msg.type !== 'viewChange' || this.state.pausing) return
    this.recordMessage(msg)
  }

  private generateItems() {
    // generate items
    const newItems: ItemState[] = []
    if (this.itemMap.size < this.maxStarsCount) {
      const count = Math.random() * 10 + 1
      for (let i = 0; i < count; i++) {
        const pos = Math.floor(Math.random() * 10000)
        // random item type
        const type = Math.floor(Math.random() * 5) as ItemState['type']
        if (!this.itemMap.has(pos)) {
          const item: ItemState = {
            pos,
            type,
            points: Math.floor(Math.random() * 99) + 1,
            colorIndex: Math.floor(Math.random() * starColorSchemes.length),
          }
          this.itemMap.set(pos, item)
          newItems.push({...item})
        }
      }
    }

    if (newItems.length > 0) {
      this.gameUpdateAt(0, { type: 'addItems', items: newItems })
    }

    return newItems
  }

  private sendPlayerUpdates() {
    if (this.updatedPlayerIds.size === 0) return

    const players = Array.from(this.updatedPlayerIds)
      .map(id => (clonePlayerState(this.playerStateMap.get(id) as PlayerState)))
      .filter(p => p !== undefined)

    this.updatedPlayerIds.clear()
    this.gameUpdateAt(0, { type: 'players', players })
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
      : type === BombType.Atomic
        ? this.calculateAtomicExplodePositions(x, y, r)
        : this.calculateStarExplodePositions(x, y, r)

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

  private calculateStarExplodePositions(x: number, y: number, r: number) {
    if (r > 2) {
      return this.calculateAtomicExplodePositions(x, y, r)
    }

    const affectedPositions = [xyToPosition(x, y)]
    const affedtedBombPositions: number[] = []

    // Atomic bomb affects all positions in a square area
    for (let dx = -r; dx <= r; dx++) {
      for (let dy = -r; dy <= r; dy++) {
        const affectedPos = xyToPosition(x + dx, y + dy)
        if (this.bombStateMap.has(affectedPos)) {
          affedtedBombPositions.push(affectedPos)
        } else if (!this.explosionMap.has(affectedPos)) {
          affectedPositions.push(affectedPos)
        }
      }
    }

    return { affectedPositions, affedtedBombPositions }
  }

  private gameUpdateAt(ts: number, msg: GameMessage) {
    this.bombNetwork.gameUpdate(msg)
    this.recordMessage(msg)
  }

  private recordMessage(msg: GameMessage) {
    const round = this.state.round
    // update recorded game
    if (!this.recordedGame.data[round]) {
      this.recordedGame.data[round] = { maxFrame: 0}
    }
    if (!this.recordedGame.data[round][this.roundFrameCount]) {
      this.recordedGame.data[round][this.roundFrameCount] = []
    }
    this.recordedGame.data[round][this.roundFrameCount].push({ ts: 0, msg })
    this.recordedGame.data[round].maxFrame = this.roundFrameCount
  }
}
