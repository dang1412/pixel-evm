import { PointData } from 'pixi.js'
import { ViewportMap } from '../ViewportMap'

import { PixelArenaGame } from './PixelArenaGame'
import { ArenaGameState } from './types'
import { PixelArenaMonster } from './PixelArenaMonster'
import { PIXEL_SIZE } from '../utils'

export interface DragOptions {
  onDrop: (x: number, y: number) => void
  onMove?: (x: number, y: number) => void
  w?: number
  h?: number
}

export class PixelArenaMap {
  game: PixelArenaGame
  constructor(public map: ViewportMap, public sceneName: string) {
    const state: ArenaGameState = {
      monsters: {},
      positionMonsterMap: {},
      roundActions: {},
      currentRound: 0,
      aliveNumber: 0,
      executedOrder: [],
    }

    this.game = new PixelArenaGame(state)

    map.subscribe('sceneactivated', (event: CustomEvent) => {
      console.log('Scene activated:', event.detail)
      const addedScene = event.detail
      if (addedScene === sceneName) {
        this.initGame()
      }
    })
  }

  private initGame() {
    this.addMonster(1, { x: 3, y: 3 }, 3) // Example monster
    this.addMonster(2, { x: 5, y: 3 }, 3) // Example monster
    this.addMonster(3, { x: 7, y: 3 }, 3) // Example monster
  }

  private addMonster(id: number, pos: PointData, hp: number) {
    const monster = this.game.addMonster(id, pos, hp)
    new PixelArenaMonster(this, monster)
    console.log(`Added monster ${monster.id} at position (${monster.pos.x}, ${monster.pos.y}) with HP ${monster.hp}`)
  }

  startDrag(image: string, {onDrop, onMove = (x, y) => {}, w = 0, h = 0}: DragOptions) {
      const scene = this.map.getActiveScene()
      if (!scene) return
      const shadow = scene.addImage(image, {x: -1, y: 0, w, h})
      shadow.alpha = 0.4
  
      const unsub = this.map.subscribe('pixelmove', (e: CustomEvent<[number, number]>) => {
        const [px, py] = e.detail
        shadow.x = px * PIXEL_SIZE
        shadow.y = py * PIXEL_SIZE
        onMove(px, py)
        this.map.markDirty()
      })
  
      this.map.subscribeOnce('pixelup', (e: CustomEvent<[number, number]>) => {
        const [px, py] = e.detail
        unsub()
        shadow.parent.removeChild(shadow)
        onDrop(px, py)
  
        this.map.markDirty()
      })
    }
}
