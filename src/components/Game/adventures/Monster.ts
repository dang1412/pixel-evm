import { Assets, Container, Graphics, Sprite } from 'pixi.js'
import { sound } from '@pixi/sound'

import { PIXEL_SIZE, positionToXY, ViewportMap, xyToPosition } from '../ViewportMap'
import { ActionType, MonsterInfo, MonsterState, MonsterType } from './types'
import { ActionMode, Adventures } from './Adventures'
import { getMonsterInfo, monsterInfos } from './constants'

// delta > 0
function toward(x: number, target: number, delta: number): number {
  const dir = x < target ? 1 : x === target ? 0 : -1
  const nx = x + dir * delta

  return nx > target === dir > 0 ? target : nx
}

function calculateNextMove(x: number, y: number, tx: number, ty: number, range: number): [number, number] {
  const disX = Math.abs(tx - x)
  const disY = Math.abs(ty - y)

  // target is in range
  if (disX <= range && disY <= range) {
    return [tx, ty]
  }

  const [dx, dy] = disX < disY ? [Math.ceil(range * disX / disY), range] : [range, Math.ceil(range * disY / disX)]

  const nx = toward(x, tx, dx)
  const ny = toward(y, ty, dy)

  return [nx, ny]
}

export class AdventureMonster {
  curX: number
  curY: number
  imageContainer = new Container()
  map: ViewportMap

  // range = 4
  maxHp = 10
  isSelecting = false

  prevHP = 0
  drawInfo: MonsterInfo

  // private fireSpeed = 600

  constructor(public game: Adventures, public state: MonsterState) {
    [this.curX, this.curY] = positionToXY(state.pos)
    this.map = game.map
    this.prevHP = state.hp
    this.drawInfo = getMonsterInfo(state.type)
    this.initialize()
  }

  // start control
  async startControl() {
    this.map.pauseDrag()
    this.drawRange()
    this.game.selectMon(this)

    // let shadow = new Container()
    if (this.game.mode === ActionMode.MOVE) {
      await this.startMove()
    } else {
      await this.startShoot()
    }

    this.map.markDirty()
  }

  private async startShoot() {
    const shadow = await this.map.addImage('/images/energy2.png', { x: this.curX, y: this.curY, w: 1, h: 1 })
    shadow.alpha = 0.2
    // subcribe to pixelmove event
    // unsub when done
    let [tx, ty] = [0, 0]
    const unsub = this.map.subscribe('pixelmove', (e: CustomEvent<[number, number]>) => {
      const [px, py] = e.detail

      // hide shadow when too far
      if (Math.abs(px - this.curX) > this.drawInfo.shootRange || Math.abs(py - this.curY) > this.drawInfo.shootRange) {
        shadow.visible = false
      } else {
        shadow.x = px * PIXEL_SIZE
        shadow.y = py * PIXEL_SIZE
        shadow.visible = true
        tx = px
        ty = py
      }

      this.map.markDirty()
    })

    const int = setInterval(() => {
      if (tx === this.curX && ty === this.curY) return
      const pos = ty * 100 + tx
      this.game.receiveAction({id: this.state.id, type: ActionType.SHOOT, val: pos})
    }, this.drawInfo.shootSpeed)

    // done control
    const doneShooting = (e: CustomEvent<[number, number]>) => {
      console.log('doneShooting', e)
      // remove shadow
      shadow.parent.removeChild(shadow)
      // unsubscribe pixelmove
      unsub()
      clearInterval(int)
      this.map.resumeDrag()
      this.map.markDirty()
    }

    this.map.subscribeOnce('pixelup', doneShooting)
  }

  private async startMove() {
    const { imageMove, w, h } = this.drawInfo
    const shadow = await this.map.addImage(imageMove, { x: this.curX, y: this.curY, w, h })
    shadow.alpha = 0.2

    // subcribe to pixelmove event
    // unsub when done
    const unsub = this.map.subscribe('pixelmove', (e: CustomEvent<[number, number]>) => {
      const [px, py] = e.detail
      shadow.x = px * PIXEL_SIZE
      shadow.y = py * PIXEL_SIZE

      this.map.markDirty()
    })

    // done control
    const doneControl = (e: CustomEvent<[number, number]>) => {
      const [x, y] = e.detail
      // remove shadow
      shadow.parent.removeChild(shadow)
      // unsubscribe pixelmove
      unsub()
      this.map.resumeDrag()
      this.map.markDirty()

      // inform game about the move
      if (x !== this.curX || y !== this.curY) {
        const move = () => {
          const [nx, ny] = calculateNextMove(this.curX, this.curY, x, y, this.drawInfo.moveRange)

          const pos = ny * 100 + nx
          this.game.receiveAction({id: this.state.id, type: ActionType.MOVE, val: pos})

          if (nx !== x || ny !== y) {
            setTimeout(move, 800)
          }
        }

        move()
      }
    }

    this.map.subscribeOnce('pixelup', doneControl)
  }

  private async initialize() {
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

    this.imageContainer = imageContainer

    this.draw()
    this.drawRange()

    this.map.markDirty()

    // const speed = 0.5
    // setInterval(() => {
    //   const [tx, ty] = positionToXY(this.state.pos)
    //   if (this.curX !== tx || this.curY !== ty) {
    //     // move toward tx, ty
    //     console.log('Move', tx, ty)
    //     this.curX = toward(this.curX, tx, speed)
    //     this.curY = toward(this.curY, ty, speed)

    //     this.imageContainer.x = this.curX * PIXEL_SIZE
    //     this.imageContainer.y = this.curY * PIXEL_SIZE

    //     this.map.markDirty()
    //   }
    // }, 20)

    // window.addEventListener('keydown', (e) => {
    //   if (e.key === 'ArrowRight') {
    //     const [tx, ty] = positionToXY(this.state.pos)
    //     const pos = xyToPosition(tx + 1, ty)
    //     this.game.receiveAction({ id: this.state.id, type: ActionType.MOVE, val: pos })
    //   }
    // })
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

        // switch to imageMove
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
    const range = this.game.mode === ActionMode.MOVE ? this.drawInfo.moveRange : this.drawInfo.shootRange
    let circle = this.imageContainer.getChildAt(2) as Graphics
    circle.clear()
    circle.circle(PIXEL_SIZE / 2, PIXEL_SIZE / 2, PIXEL_SIZE * (range + 0.5))  // x, y, radius
    circle.fill(0x00FF00) // Color of the circle (green in this example)
    circle.alpha = 0.12
    circle.visible = false
  }

  async shoot(x: number, y: number) {
    const energy = await this.map.addImage('/images/energy2.png', { x: this.curX, y: this.curY, w: 1, h: 1 })
    sound.play('shoot', {volume: 0.4})
    await this.moveObject(energy, this.curX, this.curY, x, y)
    this.map.animate({x: x - 2, y: y - 3.1, w: 5, h: 5}, 27, 'explo1_')
    sound.play('explode1', {volume: 0.4})
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
        // moving in 15 ticks
        x += deltaX / 15
        y += deltaY / 15
        
        if (deltaX >= 0 === x >= tarX) x = tarX
        if (deltaY >= 0 === y >= tarY) y = tarY

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
