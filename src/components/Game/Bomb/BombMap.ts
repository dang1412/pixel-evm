import { IMediaInstance, sound } from '@pixi/sound'
import { Container, Graphics, Text } from 'pixi.js'

import { PixelMap } from '../pixelmap/PixelMap'
import { positionToXY, xyToPosition } from '../utils'
import { PixelArea } from '../types'

import { Bomb } from './Bomb'
import { BombNetwork } from './BombNetwork'
import { Explosion } from './Explosion'
import { MapItem } from './MapItem'
import { BombState, BombType, CaughtItem, GameState, ItemState, PlayerState } from './types'
import { AtomicBomb } from './AtomicBomb'
import { BOMB_COLORS } from './constant'

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

  private gameState: GameState = { timeLeft: 0, round: 0, pausing: true }

  private bombType = BombType.Standard

  onPlayersUpdated?: (players: PlayerState[]) => void
  onGameStateUpdated?: (state: GameState) => void

  get pausing() {
    return this.gameState.pausing
  }

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

    view.subscribe('viewchanged', (e: CustomEvent<{x: number, y: number, w: number, h: number}>) => {
      if (!this.playerId) return

      const { x, y, w, h } = e.detail
      this.bombNetwork.myViewChange({
        x: Math.round(x),
        y: Math.round(y),
        w: Math.round(w),
        h: Math.round(h),
      })
    })
  }

  // Called from Network
  updateGameState(state: Partial<GameState>) {
    this.gameState = {...this.gameState, ...state}
    this.onGameStateUpdated?.(this.gameState)
  }

  // Called from Network
  // Update or remove players
  updatePlayers(players: PlayerState[]) {
    console.log('Updating players', players)
    for (const player of players) {
      const playerViewContainer = this.playersViewGraphics.get(player.id)
      if (player.score < 0) {
        // remove player
        this.players.delete(player.id)
        // clear view graphics
        if (playerViewContainer) {
          playerViewContainer.destroy()
          this.playersViewGraphics.delete(player.id)
        }
      } else {
        // add or update player
        this.players.set(player.id, player)
        const color = BOMB_COLORS[(player.id - 1) % BOMB_COLORS.length]
        // create view graphics if not exist
        if (!playerViewContainer) {
          const mainScene = this.map.getView()?.getScene('main')
          if (!mainScene) continue
          const c = new Container()
          const g = new Graphics()
          const t = new Text({ text: player.name, style: { fontSize: 40, fill: color } })
          t.x = 5
          c.addChild(g)
          c.addChild(t)
          mainScene.container.addChild(c)
          this.playersViewGraphics.set(player.id, c)
        }
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

  // Reset game state
  resetGame() {
    // remove all bombs
    for (const bomb of this.bombMap.values()) {
      bomb.remove()
    }
    this.bombMap.clear()

    // remove all items
    for (const item of this.itemMap.values()) {
      item.remove(0)
    }
    this.itemMap.clear()

    this.players.clear()
  }

  private playersViewGraphics: Map<number, Container> = new Map()

  // Called from Network, draw view change
  viewChange(playerId: number, area: PixelArea) {
    const color = BOMB_COLORS[(playerId - 1) % BOMB_COLORS.length]
    const c = this.playersViewGraphics.get(playerId)
    if (!c) return

    c.x = area.x
    c.y = area.y

    const g = c.getChildAt(0) as Graphics

    g.clear()
    g
      .rect(0, 0, area.w, area.h)
      .fill({ color, alpha: 0.1 })
      .stroke({ width: 1, color })

    // inform minimap
    const view = this.map.getView()
    view.eventTarget.dispatchEvent(new Event('updated'))
  }

  // Called from Network
  updateBombs(bombStates: BombState[]) {
    console.log('Updating bombs', bombStates)
    // let atomicBombExploded = 0
    for (const { ownerId, pos, live, type } of bombStates) {
      if (live > 0) {
        const { x, y } = positionToXY(pos)
        if (type === BombType.Star) {
          this.activateBombStar(pos)
        } else {
          this.addBomb(x, y, ownerId, type)
        }
      } else {
        const bomb = this.removeBomb(pos, ownerId)
        // if (bomb && type === BombType.Atomic) {
        //   atomicBombExploded++
        // }
      }
    }

    // atomic bomb explosion sound
    // if (atomicBombExploded) {
    //   sound.play('laser', { volume: 0.1 * atomicBombExploded })
    // }

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
    const view = this.map.getView()
    for (const pos of explosions) {
      const { x, y } = positionToXY(pos)
      // not rendering explosion out of view
      if (!view.isPixelInView(x, y)) continue

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
    this.itemMap.set(pos, new MapItem(this, item))

    // update minimap
    const view = this.map.getView()
    view.eventTarget.dispatchEvent(new Event('updated'))
  }

  // Called from Network
  removeItems(items: CaughtItem[]) {
    for (const item of items) {
      const itemOnMap = this.itemMap.get(item.pos)
      if (itemOnMap) {
        this.itemMap.delete(item.pos)
        itemOnMap.remove(item.point)
      }
    }
  }

  private activateBombStar(pos: number) {
    // activate the star into a bomb, if star type is bomb
    const item = this.itemMap.get(pos)
    item?.activate()
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
