import { Assets, Container, FederatedPointerEvent, Graphics, Sprite, Texture } from 'pixi.js'
import { sound } from '@pixi/sound'

import { PIXEL_SIZE, positionToXY, ViewportMap } from '../ViewportMap'
import { ActionType, MonsterDrawInfo, MonsterState, MonsterType } from './types'
import { ActionMode, Adventures } from './Adventures'
import { getMonsterInfo, monsterInfos } from './constants'

export class AdventureMonster {
  curX: number
  curY: number
  imageContainer = new Container()
  map: ViewportMap

  range = 4
  maxHp = 10
  isSelecting = false

  prevHP = 0
  drawInfo: MonsterDrawInfo

  constructor(public game: Adventures, public state: MonsterState) {
    [this.curX, this.curY] = positionToXY(state.pos)
    this.map = game.map
    this.prevHP = state.hp
    this.drawInfo = getMonsterInfo(state.type)
    this.initialize()
  }

  private async initialize() {
    if (this.state.type === MonsterType.SONIC) {
    this.range = 20
    } else if (this.state.type === MonsterType.NINE) {
      this.range = 6
    } else if (this.state.type === MonsterType.SHINIC) {
      this.range = 10
    }

    const { image, w, h, offX, offY } = this.drawInfo
    const imageContainer = await this.map.addImage(image, { x: this.curX, y: this.curY, w, h }, this.imageContainer)
    imageContainer.interactive = true

    const monsterDraw = this.getMonsterDraw()
    monsterDraw.x = offX * PIXEL_SIZE
    monsterDraw.y = offY * PIXEL_SIZE

    // hp
    const hp = new Graphics()
    // range
    const circle = new Graphics()

    imageContainer.addChild(hp) // 1
    imageContainer.addChild(circle) // 2

    

    // events
    // imageContainer.on('mousedown', startControl)

    this.imageContainer = imageContainer

    this.draw()
    this.drawRange()

    this.map.markDirty()
  }

  // start control
  async startControl() {
    this.map.pauseDrag()

    this.game.selectMon(this)

    let shadow = new Container()
    if (this.game.mode === ActionMode.MOVE) {
      const { imageMove, w, h, offX, offY } = this.drawInfo
      shadow = await this.map.addImage(imageMove, { x: this.curX, y: this.curY, w, h })
      shadow.alpha = 0.2
    } else {
      shadow = await this.map.addImage('/images/energy2.png', { x: this.curX, y: this.curY, w: 1, h: 1 })
      shadow.alpha = 0.2
    }

    // add moving shadow
    // const image = this.game.mode === ActionMode.MOVE ? '/images/axie.png' : '/images/energy2.png'
    // const w = this.game.mode === ActionMode.MOVE ? 1.3 : 1
    // const shadow = await this.map.addImage(image, { x: this.curX, y: this.curY, w, h: 1 })
    // shadow.alpha = 0.2

    // subcribe to pixelmove event
    // unsub when done
    const unsub = this.map.subscribe('pixelmove', (e: CustomEvent<[number, number]>) => {
      const [px, py] = e.detail
      shadow.x = px * PIXEL_SIZE
      shadow.y = py * PIXEL_SIZE

      // hide shadow when too far
      if (Math.abs(px - this.curX) > this.range || Math.abs(py - this.curY) > this.range) {
        // unsub()
        // doneControl(e)
        shadow.visible = false
      } else {
        shadow.visible = true
      }

      this.map.markDirty()
    })

    // done control
    const doneControl = (e: CustomEvent<[number, number]>) => {
      console.log('doneControl', e)
      const [x, y] = e.detail
      const cando = shadow.visible && (x !== this.curX || y !== this.curY)
      // remove shadow
      shadow.parent.removeChild(shadow)
      // unsubscribe pixelmove
      unsub()
      this.map.resumeDrag()
      // circle.visible = false
      this.map.markDirty()

      // inform game about the move
      if (cando) {
        const pos = y * 100 + x
        const type = this.game.mode === ActionMode.MOVE ? ActionType.MOVE : ActionType.SHOOT
        this.game.receiveAction({id: this.state.id, type, val: pos})
        // this.shoot(x, y)
      }
    }

    this.map.subscribeOnce('pixelup', doneControl)

    this.map.markDirty()
  }

  select(isSelect: boolean) {
    console.log('select', isSelect)
    let circle = this.getRangeDraw()
    circle.visible = isSelect
    this.isSelecting = isSelect
    this.map.markDirty()
  }

  async updateState(state: MonsterState) {
    this.state = state
    await this.draw()
  }

  async draw() {
    // new position
    const [tx, ty] = positionToXY(this.state.pos)

    if (this.imageContainer) {
      // move
      if (this.curX !== tx || this.curY !== ty) {
        sound.play('move', {volume: 0.5})
        const { imageMove } = this.drawInfo
        const monsterSprite = this.getMonsterDraw()

        const t_ = monsterSprite.texture
        monsterSprite.texture = await Assets.load(imageMove)
        await this.moveObject(this.imageContainer, this.curX, this.curY, tx, ty)
        monsterSprite.texture = t_

        this.curX = tx
        this.curY = ty
      }

      // hp
      this.drawHp()
    }
  }

  remove() {
    this.imageContainer.parent.removeChild(this.imageContainer)
  }

  private getRangeDraw(): Graphics {
    return this.imageContainer.getChildAt(2) as Graphics
  }

  private getHpDraw(): Graphics {
    return this.imageContainer.getChildAt(1) as Graphics
  }

  private getMonsterDraw(): Sprite {
    return this.imageContainer.getChildAt(0) as Sprite
  }

  private drawHp() {
    const hpdraw = this.getHpDraw()
    hpdraw.clear()
    const hp = this.state.hp

    if (this.prevHP > hp) {
      // get hurt
      sound.play('grunt', {volume: 0.4})
      this.prevHP = hp
    }

    hpdraw.rect(0, -5, PIXEL_SIZE * hp / this.maxHp, 3)
    hpdraw.fill('green')
  }

  private drawRange() {
    let circle = this.imageContainer.getChildAt(2) as Graphics
    circle.clear()
    circle.circle(PIXEL_SIZE / 2, PIXEL_SIZE / 2, PIXEL_SIZE * (this.range + 0.5))  // x, y, radius
    circle.fill(0x00FF00) // Color of the circle (green in this example)
    circle.alpha = 0.12
    circle.visible = false
  }

  async shoot(x: number, y: number) {
    const energy = await this.map.addImage('/images/energy2.png', { x: this.curX, y: this.curY, w: 1, h: 1 })
    sound.play('shoot', {volume: 0.4})
    await this.moveObject(energy, this.curX, this.curY, x, y)
    energy.parent.removeChild(energy)
  }

  private moveObject(object: Container, px: number, py: number, tx: number, ty: number): Promise<void> {
    let x = px * PIXEL_SIZE
    let y = py * PIXEL_SIZE

    const tarX = tx * PIXEL_SIZE
    const tarY = ty * PIXEL_SIZE

    const deltaX = tarX - x
    const deltaY = tarY - y

    return new Promise((res) => {
      const unsub = this.map.subscribe('tick', () => {
        x += deltaX / 20
        y += deltaY / 20
        object.x = x
        object.y = y
        this.map.markDirty()
        if (x === tarX && y === tarY) {
          unsub()
          res()
        }
      })
      this.map.markDirty()
    })
  }
}
