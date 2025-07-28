import { Assets, Container, Graphics, Sprite, Spritesheet } from 'pixi.js'
import { sound } from '@pixi/sound'

import { PixelArenaMap } from './PixelArenaMap'
import { ActionType, ArenaAction, MapItemType, MonsterState } from './types'
import { actionImages, itemImages, monsterInfos } from './constants'
import { PIXEL_SIZE, xyToPosition } from '../utils'
import { PixiAnimation } from '../Animation'

Assets.load([
  '/images/characters/axie.png',
  '/images/characters/axie3.png',
  '/images/characters/axie4.png',
  '/images/characters/Tralalero-Tralala.png',
  '/images/characters/Trippi-Troppi.png',
  '/images/characters/family_brainrot.png',
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
  // weapons
  private weaponContainer = new Container()

  private action?: ArenaAction
  // actionType = ActionType.Move
  private actionTypeSprite: Sprite

  // draw vehicle
  private vehicleSprite = new Sprite()

  // private animation: PixiAnimation

  constructor(public arenaMap: PixelArenaMap, public state: MonsterState) {
    const scene = arenaMap.map.getActiveScene()!
    const { image, w, h, dx, dy } = monsterInfos[state.type]
    this.monsterContainer = scene.addImage(image, { x: state.pos.x, y: state.pos.y, w, h })

    const monsterSprite = this.monsterContainer.getChildAt(0)
    monsterSprite.x = (dx || 0) * PIXEL_SIZE
    monsterSprite.y = (dy || 0) * PIXEL_SIZE

    this.actionTypeSprite = new Sprite()
    this.actionTypeSprite.alpha = 0.8
    this.monsterContainer.addChild(this.actionTypeSprite)
    // this.drawActionType()

    this.monsterContainer.addChild(this.weaponContainer)

    this.draw()

    // animation
    // this.animation = new PixiAnimation((f) => {
    //   const unsub = arenaMap.map.subscribe('tick', (e: CustomEvent<number>) => {
    //     f(e.detail)
    //     arenaMap.map.markDirty()
    //   })

    //   return unsub
    // })
  }

  private draw() {
    // vehicle
    if (this.state.vehicle !== undefined) {
      const vehicleImage = itemImages[this.state.vehicle]
      this.vehicleSprite.texture = Assets.get(vehicleImage)
      this.vehicleSprite.width = PIXEL_SIZE
      this.vehicleSprite.height = PIXEL_SIZE
      this.vehicleSprite.x = -4
      this.vehicleSprite.y = 6
      this.monsterContainer.addChild(this.vehicleSprite)
    } else {
      this.vehicleSprite.removeFromParent()
    }

    this.weaponContainer.removeChildren()
    this.weaponContainer.alpha = 0.8
    const weapons = [MapItemType.Bomb, MapItemType.Fire, MapItemType.Rocket]
      .filter(w => (this.state.weapons as any)[w] > 0)

    for (let i = 0; i < weapons.length; i++) {
      const w = weapons[i]
      const item = Sprite.from(itemImages[w])
      item.width = PIXEL_SIZE / 3
      item.height = PIXEL_SIZE / 3
      item.y = PIXEL_SIZE / 3 * 2
      item.x = i * PIXEL_SIZE / 3

      this.weaponContainer.addChild(item)
    }
  }

  private getWeapons() {
    const weapons = [MapItemType.Bomb, MapItemType.Fire, MapItemType.Rocket]
    return weapons.filter(w => (this.state.weapons as any)[w] > 0)
  }

  drawAction(action = this.action) {
    // clear action
    this.actionLineGraphics?.clear()
    this.shadowContainer?.removeChildren()

    this.arenaMap.map.markDirty()

    if (!action) {
      return
    }

    const scene = this.arenaMap.map.getActiveScene()!
    this.actionLineGraphics = scene.drawLine(
      { x: this.state.pos.x + 0.5, y: this.state.pos.y + 0.5 },
      { x: action.target.x + 0.5, y: action.target.y + 0.5 },
      this.actionLineGraphics
    )

    const info = monsterInfos[this.state.type]

    const image = action.actionType === ActionType.Move
      ? info.image
      : actionImages[action.actionType]

    const w = action.actionType === ActionType.Move ? info.w : 1
    const h = action.actionType === ActionType.Move ? info.h : 1
    this.shadowContainer = scene.addImage(image, {
      x: action.target.x,
      y: action.target.y,
      w,
      h,
    }, this.shadowContainer)
    this.shadowContainer.alpha = 0.6
  }

  // private sendAction(action: ArenaAction) {
  //   // send to game
  //   this.arenaMap.game.receiveAction(action)
  //   // draw
  //   this.drawAction(action)
  // }

  async updateState(state: MonsterState) {
    const prevHp = this.state.hp
    const prevx = this.state.pos.x
    const prevy = this.state.pos.y
    if (prevHp > state.hp && state.hp > 0) {
      sound.play('hurt')
    }
    this.state = state

    if (prevx !== state.pos.x || prevy !== state.pos.y) {
      await this.arenaMap.map.moveObject(this.monsterContainer, state.pos.x, state.pos.y)
    }
    // TODO update other properties like hp, etc.
    this.draw()
  }

  updateActionAndDraw(action?: ArenaAction) {
    this.action = action

    // this.action.actionType = actionType
    // Update the monster's action type
    // This could change the appearance or behavior of the monster
    this.drawAction()
  }

  private drawActionType() {
    if (!this.action) return

    const actionImage = actionImages[this.action.actionType]
    this.actionTypeSprite.texture = Assets.get(actionImage) // Default texture
    this.actionTypeSprite.width = 12
    this.actionTypeSprite.height = 12

    this.arenaMap.map.markDirty()
  }

  controlAction() {
    // initiate an action
    // const actionType = this.actionType
    const action: ArenaAction = {
      id: this.state.id,
      actionType: ActionType.None,
      target: { x: 0, y: 0 }
    }

    const info = monsterInfos[this.state.type]

    // const image = actionType === ActionType.Move
    //   ? info.image
    //   : '/images/energy2.png'

    // const w = actionType === ActionType.Move ? info.w : 1

    // let g: Graphics
    // const scene = this.arenaMap.map.getActiveScene()!

    const image = '/svgs/crosshairs.svg'

    this.arenaMap.map.startDrag(image, {
      onDrop: (x, y, rx, ry) => {
        action.target = { x, y }
        this.drawAction(action)
        // inform map
        this.arenaMap.onActionPosition(action, { x: rx, y: ry })
      },
      isInRange: (x, y) => {
        const dx = Math.abs(x - this.state.pos.x)
        const dy = Math.abs(y - this.state.pos.y)
        const change = dx + dy
        return change > 0 && dx <= 8 && dy <= 8
      },
      onMove: (x, y) => {
        // Draw a line from the monster's current position to (x, y)
        // action.target = { x, y }
        // this.drawAction(action)
        // g = scene.drawLine(
        //   { x: this.state.pos.x + 0.5, y: this.state.pos.y + 0.5 },
        //   { x: x + 0.5, y: y + 0.5 },
        //   g
        // )
      },
      w: 1,
      h: 1
    })
  }

  async applyAction(action: ArenaAction) {
    // TODO draw action on the monster
    // This could be a visual effect or an animation
    console.log(`Drawing action`, action,`for monster ${this.state.id}`)

    // Clear previous action line and shadow
    if (this.actionLineGraphics) this.actionLineGraphics.clear()
    if (this.shadowContainer) this.shadowContainer.removeChildren()

    const { x, y } = action.target

    if (action.actionType === ActionType.Move) {
      await this.moveTo(x, y)
      this.state.pos = { x, y } // Update monster position
    } else if ([ActionType.Shoot, ActionType.ShootRocket, ActionType.ShootFire].includes(action.actionType)) {
      await this.drawShoot(x, y, action.actionType)
      if (action.actionType === ActionType.ShootRocket) {
        this.arenaMap.animateExplode(x, y)
      }
    }
  }

  async moveTo(x: number, y: number) {
    const { x: curx, y: cury } = this.state.pos
    sound.play('move', {volume: 0.2})
    await this.arenaMap.map.moveObject(this.monsterContainer, curx, cury, x, y)
    console.log(`Monster ${this.state.id} moved to (${x}, ${y})`)
  }

  private async drawShoot(x: number, y: number, type: ActionType) {
    const scene = this.arenaMap.map.getActiveScene()
    if (!scene) return

    const curX = this.state.pos.x
    const curY = this.state.pos.y
    const energy = scene.addImage('/images/energy2.png', { x: curX, y: curY, w: 1, h: 1 })
    sound.play(type === ActionType.ShootFire ? 'beam-fire' : 'shoot', {volume: 0.3})
    await this.arenaMap.map.moveObject(energy, curX, curY, x, y)
    
    energy.parent.removeChild(energy)
  }

  remove(): number {
    console.log(`Removing monster ${this.state.id} from arena`, this.state)
    this.monsterContainer.destroy()
    this.actionLineGraphics?.destroy()
    this.shadowContainer?.destroy()

    sound.play('die', {volume: 0.2})

    return xyToPosition(this.state.pos.x, this.state.pos.y)
  }
}
