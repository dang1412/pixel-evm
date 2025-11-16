import { IMediaInstance, sound } from '@pixi/sound'

import { PixelMap } from '../pixelmap/PixelMap'
import { positionToXY, xyToPosition } from '../utils'

import { Bomb } from './Bomb'
import { BombNetwork } from './BombNetwork'
import { Explosion } from './Explosion'
import { MapItem } from './MapItem'
import { BombState, BombType, GameState, ItemState, PlayerState } from './types'
import { AtomicBomb } from './AtomicBomb'

sound.add('explosion', '/sounds/bomb/explosion3.mp3')
sound.add('explosion2', '/sounds/bomb/explosion2.mp3')
sound.add('ticking', '/sounds/bomb/ticking-bomb.mp3')
sound.add('laser', '/sounds/bomb/laser.mp3')

export class BombMap {
  bombMap = new Map<number, Bomb | AtomicBomb>()
  explosionMap = new Map<number, Explosion>()
  itemMap = new Map<number, MapItem>()

  bombNetwork: BombNetwork
  bombUsing = 0

  // all players
  players: Map<number, PlayerState> = new Map()
  // this player
  playerId: number | undefined

  private bombTicking: Promise<IMediaInstance> | undefined

  private gameState: GameState | undefined

  private bombType = BombType.Standard

  onPlayersUpdated?: (players: PlayerState[]) => void
  onGameStateUpdated?: (state: GameState) => void

  constructor(
    public map: PixelMap,
  ) {
    this.bombNetwork = new BombNetwork(this)
    const view = map.getView()

    view.subscribe('pixelclick', async (event: CustomEvent<[number, number]>) => {
      if (view.activeScene !== 'main') {
        return
      }

      const [x, y] = event.detail

      if (!this.playerId) {
        console.log('Not joined yet, joining game...')
        return
      }

      this.bombNetwork.placeBomb(this.playerId, x, y, this.bombType)
      // new AtomicExplode(this, x, y)
    })

    // update bombs and explosions animation
    view.subscribe('tick', (e: CustomEvent<number>) => {
      const delta = Math.min(e.detail, 40)
      for (const bomb of this.bombMap.values()) {
        bomb.update()
      }

      for (const [pos, explosion] of this.explosionMap) {
        const done = explosion.update(delta)
        if (done) {
          this.explosionMap.delete(pos)
        }
      }

      view.markDirty()
    })
  }

  updateGameState(state: GameState) {
    this.gameState = {...this.gameState, ...state}
    this.onGameStateUpdated?.(this.gameState)
  }

  // Update or remove players
  updatePlayers(players: PlayerState[]) {
    for (const player of players) {
      if (player.score < 0) {
        // remove player
        this.players.delete(player.id)
      } else {
        // add or update player
        this.players.set(player.id, player)
      }
    }
    this.onPlayersUpdated?.(this.playersArray)
  }

  get playersArray(): PlayerState[] {
    return Array.from(this.players.values())
  }

  get score(): number {
    if (this.playerId === undefined) return 0
    return this.players.get(this.playerId)?.score || 0
  }

  setBombType(type: BombType) {
    this.bombType = type
  }

  // Called from Network
  updateBombs(bombStates: BombState[]) {
    let atomicBombExploded = 0
    for (const { ownerId, pos, live, type } of bombStates) {
      if (live > 0) {
        const { x, y } = positionToXY(pos)
        this.addBomb(x, y, ownerId, type)
      } else {
        const bomb = this.removeBomb(pos, ownerId)
        if (bomb && type === BombType.Atomic) {
          atomicBombExploded++
        }
      }
    }

    // atomic bomb explosion sound
    if (atomicBombExploded) {
      sound.play('laser', { volume: 0.1 * atomicBombExploded })
    }

    // ticking sound
    if (this.bombMap.size > 0) {
      this.bombTicking = this.bombTicking || (sound.play('ticking', { loop: true, volume: 0.1 }) as Promise<IMediaInstance>)
      // adjust ticking volume based on number of bombs
      ;(async () => {
        const tick = await this.bombTicking!
        const volume = Math.min(1, this.bombMap.size * 0.05)
        tick.volume = volume
      })()
    } else {
      // stop ticking sound
      if (this.bombTicking) {
        sound.stop('ticking')
        this.bombTicking = undefined
      }
    }
  }

  // Called from Network
  addExplosions(explosions: number[]) {
    for (const pos of explosions) {
      const { x, y } = positionToXY(pos)
      const old = this.explosionMap.get(pos)
      if (old) {
        // erase old explosion
        old.update(800)
      }
      this.explosionMap.set(pos, new Explosion(this, x, y))
    }
    sound.play('explosion', { volume: Math.min(1, explosions.length * 0.01) })
  }

  // Called from Network
  addItem(pos: number, item: ItemState) {
    const { x, y } = positionToXY(pos)
    this.itemMap.set(pos, new MapItem(this, x, y, item.points))

    // update minimap
    const view = this.map.getView()
    view.eventTarget.dispatchEvent(new Event('updated'))
  }

  // Called from Network
  removeItems(positions: number[]) {
    for (const pos of positions) {
      const item = this.itemMap.get(pos)
      if (item) {
        this.itemMap.delete(pos)
        item.remove()
      }
    }
  }

  private addBomb(x: number, y: number, playerId: number, type: BombType) {
    const pos = xyToPosition(x, y)
    if (this.bombMap.has(pos)) return

    console.log('Add bomb', pos, x, y)
    if (playerId === this.playerId) this.bombUsing++
    const bomb = type === BombType.Standard 
      ? new Bomb(this, x, y, playerId)
      : new AtomicBomb(this, x, y, playerId)
    this.bombMap.set(pos, bomb)
  }

  private removeBomb(pos: number, playerId: number) {
    const bomb = this.bombMap.get(pos)
    if (bomb) {
      this.bombMap.delete(pos)
      bomb.remove()
      if (playerId === this.playerId) this.bombUsing--
      return bomb
    }
  }
}
