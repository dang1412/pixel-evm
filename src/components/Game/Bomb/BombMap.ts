import { PixelMap } from '../pixelmap/PixelMap'
import { positionToXY, xyToPosition } from '../utils'

import { Bomb } from './Bomb'
import { BombGame } from './BombGame'
import { BombNetwork } from './BombNetwork'
import { Explosion } from './Explosion'
import { MapItem } from './MapItem'
import { BombState, GameState, ItemState, PlayerState } from './types'

export class BombMap {
  bombMap = new Map<number, Bomb>()
  explosionMap = new Map<number, Explosion>()
  itemMap = new Map<number, MapItem>()

  // bombGame will be replaced by network component
  // bombGame: BombGame | undefined
  bombNetwork: BombNetwork
  bombUsing = 0

  // all players
  players: PlayerState[] = []
  // this player
  playerId: number | undefined

  constructor(
    public map: PixelMap,
    private onScore: (score: number) => void
  ) {
    this.bombNetwork = new BombNetwork(this)
    const view = map.getView()

    view.subscribe('pixelclick', async (event: CustomEvent<[number, number]>) => {
      if (view.activeScene !== 'main') {
        return
      }

      const [x, y] = event.detail

      // join game the first time
      // if (!this.playerState) {
      //   this.playerState = this.bombGame.joinGame()
      // }
      if (!this.playerId) {
        console.log('Not joined yet, joining game...')
        this.bombNetwork.joinGame()
        return
      }

      this.bombNetwork.placeBomb(this.playerId, x, y)

      // if (this.bombGame && this.bombUsing < this.playerState.bombs) {
      //   this.bombGame.addBomb(this.playerState.id, x, y)
      //   // for smooth UX, add bomb before receiving from logic
      //   this.addBomb(x, y, this.playerState.id)
      // }
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

  // Called from Network
  updateBombs(bombStates: BombState[]) {
    for (const { ownerId, pos, live } of bombStates) {
      if (live > 0) {
        const { x, y } = positionToXY(pos)
        this.addBomb(x, y, ownerId)
      } else {
        this.removeBomb(pos, ownerId)
      }
    }
  }

  // Called from Network
  addExplosions(explosions: number[]) {
    for (const pos of explosions) {
      const { x, y } = positionToXY(pos)
      this.explosionMap.set(pos, new Explosion(this, x, y))
    }
  }

  // Called from Network
  addItem(pos: number, item: ItemState) {
    const { x, y } = positionToXY(pos)
    this.itemMap.set(pos, new MapItem(this, x, y, item.points))
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

  // Called from Network
  updateScore(score: number) {
    this.onScore(score)
  }

  private addBomb(x: number, y: number, playerId: number) {
    const pos = xyToPosition(x, y)
    if (this.bombMap.has(pos)) return

    console.log('Add bomb', pos, x, y)
    if (playerId === this.playerId) this.bombUsing++
    this.bombMap.set(pos, new Bomb(this, x, y, playerId))
  }

  private removeBomb(pos: number, playerId: number) {
    const bomb = this.bombMap.get(pos)
    if (bomb) {
      this.bombMap.delete(pos)
      bomb.remove()
      if (playerId === this.playerId) this.bombUsing--
    }
  }
}
