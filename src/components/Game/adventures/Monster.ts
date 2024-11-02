import { Assets, Container, Graphics, Sprite, Spritesheet } from 'pixi.js'
import { sound } from '@pixi/sound'

import { ViewportMap } from '../ViewportMap'
import { ActionType, MonsterInfo, MonsterState } from './types'
import { ActionMode, Adventures } from './Adventures'
import { getMonsterInfo } from './constants'
import { PIXEL_SIZE, xyToPosition } from '../utils'
import { moveToward } from './gamelogic/utils'
import { AttackType } from './gamelogic/types'

// delta > 0
// function toward(x: number, target: number, delta: number): number {
//   const dir = x < target ? 1 : x === target ? 0 : -1
//   const nx = x + dir * delta

//   return nx > target === dir > 0 ? target : nx
// }

// function calculateNextMove(x: number, y: number, tx: number, ty: number, range: number): [number, number] {
//   const disX = Math.abs(tx - x)
//   const disY = Math.abs(ty - y)

//   // target is in range
//   if (disX <= range && disY <= range) {
//     return [tx, ty]
//   }

//   const [dx, dy] = disX < disY ? [Math.ceil(range * disX / disY), range] : [range, Math.ceil(range * disY / disX)]

//   const nx = toward(x, tx, dx)
//   const ny = toward(y, ty, dy)

//   return [nx, ny]
// }

export enum DrawState {
  Stand = 'stand',
  Hurt = 'hurt',
  Run = 'run',
  Jump = 'jump',
  A1 = 'a1',
  A2 = 'a2',
  A3 = 'a3',
  A4 = 'a4',
  A5 = 'a5',
  A6 = 'a6',
  Dash = 'dash',
  Die = 'die',
}

const attackToDraw: {[k in AttackType]: DrawState} = {
  [AttackType.A1]: DrawState.A1,
  [AttackType.A2]: DrawState.A2,
  [AttackType.A3]: DrawState.A3,
  [AttackType.A4]: DrawState.A4,
  [AttackType.A5]: DrawState.A5,
  [AttackType.A6]: DrawState.A6,
}

export class AdventureMonster {
  curX: number
  curY: number
  imageContainer: Container
  map: ViewportMap

  // range = 4
  maxHp = 10
  isSelecting = false

  prevHP = 0
  drawInfo: MonsterInfo

  constructor(public game: Adventures, public state: MonsterState) {
    this.curX = state.pos.x
    this.curY = state.pos.y
    
    this.map = game.map
    this.prevHP = state.hp
    this.drawInfo = getMonsterInfo(state.type)
    const { image, w, h } = this.drawInfo
    this.imageContainer = this.map.addImage(image, { x: this.curX, y: this.curY, w: 0, h: 0 })
    this.initialize()
    this.initializeDrawState()
  }

  // start control
  async startControl() {
    this.map.pauseDrag()
    this.drawRange()
    this.game.selectMon(this)

    if (this.game.mode === ActionMode.MOVE) {
      await this.startMove()
    } else {
      await this.startShoot()
    }

    this.map.markDirty()
  }

  sendAttack(a: AttackType) {
    // only send attack when no action state
    if (this.actionState === undefined) {
      this.game.receiveAction({id: this.state.id, type: ActionType.SHOOT, val: a})
    }
  }

  drawAttack(a: AttackType) {
    const attackDrawState = attackToDraw[a]
    this.changeActionState(attackDrawState)
  }

  private startShoot() {
    let [tx, ty] = [this.curX, this.curY]
    // this.drawState = DrawState.A1

    const range = this.drawInfo.shootRange

    // shooting
    const int = setInterval(() => {
      if (tx === this.curX && ty === this.curY) return
      if (Math.abs(tx - this.curX) <= range && Math.abs(ty - this.curY) <= range) {
        const pos = ty * 100 + tx
        this.game.receiveAction({id: this.state.id, type: ActionType.SHOOT, val: pos})
      }
    }, this.drawInfo.shootSpeed)

    this.game.startDrag('/images/energy2.png', {
      onDrop: (px, py) => {
        // on drop
        clearInterval(int)
        this.map.resumeDrag()
        // this.drawState = DrawState.Stand
      },
      onMove: (x, y) => {
        // on move
        tx = x
        ty = y
      },
      w: 1,
      h: 1
    })
  }

  private startMove() {
    const { imageMove } = this.drawInfo

    this.game.startDrag(imageMove, {
      onDrop: (x, y) => {
        this.map.resumeDrag()
        if (x !== this.state.target.x || y !== this.state.target.y) {
          this.game.receiveAction({id: this.state.id, type: ActionType.MOVE, val: xyToPosition(x, y)})
        }
      }
    })
  }

  private tickCount = 0
  private frameCount = 0
  // private frameStep = 5
  private baseState = DrawState.Stand
  private actionState: DrawState | undefined
  private onDrawLoop = () => {}

  private async initializeDrawState() {
    const sheet = await Assets.load<Spritesheet>(this.drawInfo.spritesheet)
    console.log(sheet)
    const sprite = this.getMonsterDraw()

    this.map.subscribe('tick', (e: CustomEvent<number>) => {
      const state = this.actionState || this.baseState
      const animation = sheet.animations[state]
      const framePerStep = (state === DrawState.Stand || state === DrawState.Die) ? 8 : 5
      if (this.tickCount % framePerStep === 0) {
        if (this.frameCount >= animation.length) {
          this.frameCount = 0
          this.tickCount = 0
          this.onDrawLoop()
        }
        const texture = animation[this.frameCount++]
        sprite.texture = texture
        const {x, y} = texture.defaultAnchor || {x: 0, y: 0}
        sprite.anchor.set(x,y)
      }
      this.tickCount++

      // move
      this.proceedMove(e.detail)

      this.map.markDirty()
    })
    this.map.markDirty()
  }

  // speed 1unit every 200ms
  private proceedMove(delta: number) {
    const d = delta / 100
    const { x: tx, y: ty } = this.state.pos
    if (tx !== this.curX || ty !== this.curY) {
      this.changeBaseState(DrawState.Run)
      // move
      const { x, y } = moveToward(this.curX, this.curY, tx, ty, d)
      this.imageContainer.x = x * PIXEL_SIZE
      this.imageContainer.y = y * PIXEL_SIZE

      console.log(x, y, tx, ty, this.state.target)

      this.curX = x
      this.curY = y
    } else {
      this.changeBaseState(DrawState.Stand)
    }
  }

  private changeBaseState(state: DrawState) {
    this.baseState = state
  }

  changeActionState(state: DrawState, onDone = () => {}) {
    // const curState = this.drawState
    // const _ = this.onDrawLoop
    // this.changeDrawState(state)
    if (this.actionState === undefined || state === DrawState.Hurt) {
      // change action state
      this.actionState = state
      // restart animation
      this.frameCount = 0
      this.tickCount = 0
      this.onDrawLoop = () => {
        // clear action state
        this.actionState = undefined
        this.onDrawLoop = () => {}
        onDone()
      }
    }
    
  }

  private initialize() {
    const { offX, offY } = this.drawInfo
    const imageContainer = this.imageContainer
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
    // const posxy = position10ToXY(this.state.pos)
    // const {x: tx, y: ty} = posxy

    // if (this.imageContainer) {
      // move
      // if (this.curX !== tx || this.curY !== ty) {
      //   sound.play('move', {volume: 0.5})
      //   const { imageMove } = this.drawInfo
      //   const monsterSprite = this.getMonsterDraw()

      //   // switch to imageMove
      //   const t_ = monsterSprite.texture
      //   monsterSprite.texture = Texture.from(imageMove)
      //   await this.moveObject(this.imageContainer, this.curX, this.curY, tx, ty)
      //   monsterSprite.texture = t_

      //   this.curX = tx
      //   this.curY = ty
      // }

      // hp
    this.drawHp()
    // }
  }

  remove() {
    this.changeActionState(DrawState.Die, () => this.imageContainer.parent.removeChild(this.imageContainer))
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
      this.changeActionState(DrawState.Hurt)
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
    const energy = this.map.addImage('/images/energy2.png', { x: this.curX, y: this.curY, w: 1, h: 1 })
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
