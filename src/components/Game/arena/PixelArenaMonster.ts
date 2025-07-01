import { Assets, Container, Graphics } from 'pixi.js'

import { PixelArenaMap } from './PixelArenaMap'
import { ActionType, ArenaAction, MonsterState } from './types'

Assets.load(['/images/characters/axie.png', '/images/energy2.png'])

export class PixelArenaMonster {
  private monsterContainer: Container

  // draw
  // action line
  actionLineGraphics?: Graphics
  shadowContainer?: Container

  constructor(public arenaMap: PixelArenaMap, public state: MonsterState) {
    const scene = arenaMap.map.getActiveScene()!
    this.monsterContainer = scene.addImage('/images/characters/axie.png', { x: state.pos.x, y: state.pos.y, w: 1.4, h: 1 })
    // this.monsterContainer.interactive = true
    // this.monsterContainer.on('pointerdown', () => {
    //   this.startShoot()
    // })
  }

  private draw() {

  }

  private drawAction(action: ArenaAction) {
    const scene = this.arenaMap.map.getActiveScene()!
    this.actionLineGraphics = scene.drawLine(
      { x: this.state.pos.x + 0.5, y: this.state.pos.y + 0.5 },
      { x: action.target.x + 0.5, y: action.target.y + 0.5 },
      this.actionLineGraphics
    )

    const image = action.actionType === ActionType.Move
      ? '/images/characters/axie.png'
      : '/images/energy2.png'

    const w = action.actionType === ActionType.Move ? 1.4 : 1
    this.shadowContainer = scene.addImage(image, {
      x: action.target.x,
      y: action.target.y,
      w,
      h: 1,
    }, this.shadowContainer)
    this.shadowContainer.alpha = 0.6
  }

  private sendAction(action: ArenaAction) {
    // send to game
    this.arenaMap.game.receiveAction(action)
    // draw
    this.drawAction(action)
  }

  updateState(state: MonsterState) {
    this.state = state
    // this.monsterContainer.position.set(state.pos.x, state.pos.y)
    // TODO update other properties like hp, etc.
    this.draw()
  }

  controlAction(actionType: ActionType) {
    // initiate an action
    const action: ArenaAction = {
      id: this.state.id,
      actionType,
      target: { x: 0, y: 0 }
    }

    const image = actionType === ActionType.Move
      ? '/images/characters/axie.png'
      : '/images/energy2.png'

    const w = actionType === ActionType.Move ? 1.4 : 1

    let g: Graphics
    const scene = this.arenaMap.map.getActiveScene()!

    this.arenaMap.map.pauseDrag()
    this.arenaMap.map.startDrag(image, {
      onDrop: (x, y) => {
        if (g) {
          scene.container.removeChild(g)
        }
        this.arenaMap.map.resumeDrag()
        if (x !== this.state.pos.x || y !== this.state.pos.y) {
          action.target = { x, y }
          this.sendAction(action)
        }
      },
      onMove: (x, y) => {
        // Draw a line from the monster's current position to (x, y)
        action.target = { x, y }
        g = scene.drawLine(
          { x: this.state.pos.x + 0.5, y: this.state.pos.y + 0.5 },
          { x: x + 0.5, y: y + 0.5 },
          g
        )
      },
      w,
      h: 1
    })
  }

  async applyAction(action: ArenaAction) {
    // TODO draw action on the monster
    // This could be a visual effect or an animation
    console.log(`Drawing action`, action,`for monster ${this.state.id}`)

    // Clear previous action line and shadow
    this.actionLineGraphics?.clear()
    this.shadowContainer?.removeChildren()

    const { x, y } = action.target

    if (action.actionType === ActionType.Move) {
      await this.moveTo(x, y)
    } else if (action.actionType === ActionType.Shoot) {
      await this.drawShoot(x, y)
    }
  }

  private async moveTo(x: number, y: number) {
    const { x: curx, y: cury } = this.state.pos
    this.state.pos = { x, y } // Update monster position
    await this.arenaMap.map.moveObject(this.monsterContainer, curx, cury, x, y)
    console.log(`Monster ${this.state.id} moved to (${x}, ${y})`)
  }

  private async drawShoot(x: number, y: number) {
    const scene = this.arenaMap.map.getActiveScene()
    if (!scene) return

    const curX = this.state.pos.x
    const curY = this.state.pos.y
    const energy = scene.addImage('/images/energy2.png', { x: curX, y: curY, w: 1, h: 1 })
    // sound.play('shoot', {volume: 0.2})
    await this.arenaMap.map.moveObject(energy, curX, curY, x, y)
    // scene.animate({x: x - 2, y: y - 3.1, w: 5, h: 5}, 27, 'explo1_')
    // this.animateExplode(scene, x, y)
    // sound.play('explode1', {volume: 0.1})
    energy.parent.removeChild(energy)
  }
}
