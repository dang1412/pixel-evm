import { Assets, Container, Graphics, Sprite } from 'pixi.js'

import { PixelArenaMap } from './PixelArenaMap'
import { ActionType, ArenaAction, MonsterState } from './types'
import { actionImages, itemImages, monsterInfos, vehicleImages } from './constants'
import { PIXEL_SIZE } from '../utils'

Assets.load([
  '/images/characters/axie.png',
  '/images/characters/Tralalero-Tralala.png',
  '/images/characters/Trippi-Troppi.png',
  '/images/energy2.png',
  '/svgs/walk.svg',
  '/svgs/crosshairs.svg',
])

export class PixelArenaMonster {
  private monsterContainer: Container

  // draw
  // action line
  private actionLineGraphics?: Graphics
  private shadowContainer?: Container

  actionType = ActionType.Move
  private actionTypeSprite: Sprite

  // draw vehicle
  private vehicleSprite = new Sprite()

  constructor(public arenaMap: PixelArenaMap, public state: MonsterState) {
    const scene = arenaMap.map.getActiveScene()!
    const { image, w, h } = monsterInfos[state.type]
    this.monsterContainer = scene.addImage(image, { x: state.pos.x, y: state.pos.y, w, h })

    this.actionTypeSprite = new Sprite()
    this.actionTypeSprite.alpha = 0.8
    this.monsterContainer.addChild(this.actionTypeSprite)
    this.drawActionType()

    this.draw()
  }

  private draw() {
    // vehicle
    if (this.state.vehicle) {
      const vehicleImage = vehicleImages[this.state.vehicle]
      this.vehicleSprite.texture = Assets.get(vehicleImage)
      this.vehicleSprite.width = PIXEL_SIZE
      this.vehicleSprite.height = PIXEL_SIZE
      this.vehicleSprite.x = -4
      this.vehicleSprite.y = 6
      this.monsterContainer.addChild(this.vehicleSprite)
    } else {
      this.vehicleSprite.removeFromParent()
    }
  }

  private drawAction(action: ArenaAction) {
    const scene = this.arenaMap.map.getActiveScene()!
    this.actionLineGraphics = scene.drawLine(
      { x: this.state.pos.x + 0.5, y: this.state.pos.y + 0.5 },
      { x: action.target.x + 0.5, y: action.target.y + 0.5 },
      this.actionLineGraphics
    )

    const info = monsterInfos[this.state.type]

    const image = action.actionType === ActionType.Move
      ? info.image
      : '/images/energy2.png'

    const w = action.actionType === ActionType.Move ? info.w : 1
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
    // TODO update other properties like hp, etc.
    this.draw()
  }

  updateActionType(actionType: ActionType) {
    this.actionType = actionType
    // Update the monster's action type
    // This could change the appearance or behavior of the monster
    this.drawActionType()
  }

  private drawActionType() {
    const actionImage = actionImages[this.actionType]
    this.actionTypeSprite.texture = Assets.get(actionImage) // Default texture
    this.actionTypeSprite.width = 12
    this.actionTypeSprite.height = 12

    this.arenaMap.map.markDirty()
  }

  controlAction() {
    // initiate an action
    const actionType = this.actionType
    const action: ArenaAction = {
      id: this.state.id,
      actionType,
      target: { x: 0, y: 0 }
    }

    const info = monsterInfos[this.state.type]

    const image = actionType === ActionType.Move
      ? info.image
      : '/images/energy2.png'

    const w = actionType === ActionType.Move ? info.w : 1

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
