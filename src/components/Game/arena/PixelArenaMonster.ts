import { Assets, Container } from 'pixi.js'

import { PixelArenaMap } from './PixelArenaMap'
import { ActionType, MonsterState } from './types'

Assets.load(['/images/characters/axie.png', '/images/energy2.png'])

export class PixelArenaMonster {
  private monsterContainer: Container

  constructor(public map: PixelArenaMap, public state: MonsterState) {
    const scene = map.map.getActiveScene()!
    this.monsterContainer = scene.addImage('/images/characters/axie.png', { x: state.pos.x, y: state.pos.y, w: 1.2, h: 1 })
    this.monsterContainer.interactive = true
    this.monsterContainer.on('pointerdown', () => {
      this.startShoot()
    })
  }

  private draw() {

  }

  updateState(state: MonsterState) {
    this.state = state
    // this.monsterContainer.position.set(state.pos.x, state.pos.y)
    // TODO update other properties like hp, etc.
    this.draw()
  }

  startShoot() {
    this.map.map.pauseDrag()
    this.map.startDrag('/images/energy2.png', {
      onDrop: (x, y) => {
        this.map.map.resumeDrag()
        if (x !== this.state.pos.x || y !== this.state.pos.y) {
          this.map.game.receiveAction({
            id: this.state.id,
            actionType: ActionType.Shoot,
            target: { x, y }
          })
          // this.game.requestAction({id: this.state.id, type: ActionType.SHOOT, pos: {x, y}})
        }
      },
      w: 1,
      h: 1
    })
  }
}
