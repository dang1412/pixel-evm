import { Assets, Container, Graphics, PointData, Sprite, Spritesheet } from 'pixi.js'
import { sound } from '@pixi/sound'

import { ViewportMap } from '../ViewportMap'
import { ActionType, MonsterInfo, MonsterState } from './types'
import { ActionMode, Adventures } from './Adventures'
import { getMonsterInfo, LOOP_TIME } from './constants'
import { PIXEL_SIZE, xyToPosition } from '../utils'
import { moveToward, roundPos } from './gamelogic/utils'
import { AttackType } from './gamelogic/types'

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

function distance(p1: PointData, p2: PointData): number {
  const dx = p1.x -p2.x
  const dy = p1.y -p2.y
  return parseFloat(Math.abs(dx ** 2 + dy ** 2).toFixed(1))
}

export enum MoveDir {
  U,
  D,
  L,
  R,
  UL,
  UR,
  DL,
  DR
}

export class AdventureMonster {
  curP: PointData
  // curY: number
  imageContainer: Container
  map: ViewportMap

  // range = 4
  maxHp = 10
  isSelecting = false

  prevHP = 0
  drawInfo: MonsterInfo

  private isLeft = false

  constructor(public game: Adventures, public state: MonsterState) {
    this.curP = state.pos
    // this.curX = state.pos.x
    // this.curY = state.pos.y
    
    this.map = game.map
    this.prevHP = state.hp
    this.drawInfo = getMonsterInfo(state.type)
    const { image, w, h } = this.drawInfo
    this.imageContainer = this.map.addImage(image, { x: this.curP.x, y: this.curP.y, w: 0, h: 0 })
    this.initialize()
    this.initializeDrawState()
  }

  move(dir: MoveDir) {
    const speed = this.drawInfo.moveSpeed
    const sqrtSpeed = speed
    const curP = this.state.pos
    const nextP = {...curP}
    switch (dir) {
      case MoveDir.U:
        nextP.y -= speed * 1.4
        break
      case MoveDir.D:
        nextP.y += speed * 1.4
        break
      case MoveDir.L:
        nextP.x -= speed * 1.4
        break
      case MoveDir.R:
        nextP.x += speed * 1.4
        break
      case MoveDir.UL:
        nextP.x -= sqrtSpeed
        nextP.y -= sqrtSpeed
        break
      case MoveDir.UR:
        nextP.x += sqrtSpeed
        nextP.y -= sqrtSpeed
        break
      case MoveDir.DL:
        nextP.x -= sqrtSpeed
        nextP.y += sqrtSpeed
        break
      case MoveDir.DR:
        nextP.x += sqrtSpeed
        nextP.y += sqrtSpeed
        break
    }
    if (nextP.x !== curP.x || nextP.y !== curP.y) {
      roundPos(nextP)
      this.game.receiveAction({id: this.state.id, type: ActionType.MOVE, pos: nextP})
    }
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
      this.game.receiveAction({id: this.state.id, type: ActionType.SHOOT, pos: {x: 100, y: a}})
      // this.drawAttack(a)
    }
  }

  drawAttack(p: PointData) {
    if (p.x === 100) {
      // melee attack
      const attackDrawState = attackToDraw[p.y as AttackType]
      this.changeActionState(attackDrawState)
    } else {
      // range attack
      this.changeActionState(attackToDraw[AttackType.A5])
      // draw shoot
      this.shoot(p.x, p.y)
    }
  }

  private startShoot() {
    let {x: tx, y: ty} = this.curP
    // this.drawState = DrawState.A1

    const range = this.drawInfo.shootRange

    // shooting
    const int = setInterval(() => {
      if (tx === this.curP.x && ty === this.curP.y) return
      if (Math.abs(tx - this.curP.x) <= range && Math.abs(ty - this.curP.y) <= range) {
        this.game.receiveAction({id: this.state.id, type: ActionType.SHOOT, pos: {x: tx, y: ty}})
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
          this.game.receiveAction({id: this.state.id, type: ActionType.MOVE, pos: {x, y}})
        }
      }
    })
  }

  private tickCount = 0
  private frameCount = 0
  private baseState = DrawState.Stand
  private actionState: DrawState | undefined
  private onDrawLoop = () => {}

  private async initializeDrawState() {
    const sheet = await Assets.load<Spritesheet>(this.drawInfo.spritesheet)
    console.log(sheet)
    const sprite = this.getMonsterDraw()

    this.map.subscribe('tick', (e: CustomEvent<number>) => {
      const state = this.actionState || this.baseState
      const animation = sheet.animations[state] || []
      const framePerStep = (state === DrawState.Stand || state === DrawState.Die) ? 10 : 5
      if (this.tickCount % framePerStep === 0) {
        if (this.frameCount >= animation.length) {
          this.frameCount = 0
          this.tickCount = 0
          this.onDrawLoop()
        }

        const texture = animation[this.frameCount++]
        if (texture) {
          sprite.texture = texture
          const {x, y} = texture.defaultAnchor || {x: 0, y: 0}
          sprite.anchor.set(x,y)
        }
      }
      this.tickCount++

      this.map.markDirty()

      // move
      this.proceedMove(e.detail)
    })
  }

  private switchLeft(isLeft: boolean) {
    // this.isLeft = isLeft
    if (this.isLeft !== isLeft) {
      this.isLeft = isLeft
      this.imageContainer.scale.x = isLeft ? -1 : 1
    }
  }

  // speed 1unit every 200ms
  private proceedMove(delta: number) {
    // const distanceToPos = distance(this.curP, this.state.pos)
    // if (distanceToPos === 0) return

    // console.log(distanceToPos)
    const d = delta / LOOP_TIME * this.drawInfo.moveSpeed
    const { x: tx, y: ty } = this.state.pos
    if (tx !== this.curP.x || ty !== this.curP.y) {
      this.changeBaseState(DrawState.Run)
      if (this.curP.x < tx) {
        this.switchLeft(false)
      } else if (this.curP.x > tx) {
        this.switchLeft(true)
      }
      
      // move
      const { x, y } = moveToward(this.curP.x, this.curP.y, tx, ty, d)
      this.imageContainer.x = (x + (this.isLeft ? this.drawInfo.w : 0)) * PIXEL_SIZE
      this.imageContainer.y = y * PIXEL_SIZE

      this.curP = {x, y}
    } else {
      this.changeBaseState(DrawState.Stand)
    }
  }

  private changeBaseState(state: DrawState) {
    if (this.baseState !== state) {
      this.baseState = state
      if (state === DrawState.Run) {
        if (this.isSelecting) {
          // sound.play('running', {loop: true})
          this.follow(true)
        }
      } else {
        if (this.isSelecting) {
          // sound.stop('running')
          this.follow(false)
        }
      }
    }
  }

  private changeActionState(state: DrawState, onDone = () => {}) {
    // change action state
    this.actionState = state
    // restart animation
    this.frameCount = 0
    this.tickCount = 0
    if (this.isSelecting) sound.play(state)
    this.onDrawLoop = () => {
      // clear action state
      this.actionState = undefined
      this.onDrawLoop = () => {}
      onDone()
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

    this.draw()
    this.drawRange()

    this.map.markDirty()
  }

  select(isSelect: boolean) {
    if (!isSelect) {
      this.follow(false)
    }
    let circle = this.getRangeDraw()
    circle.visible = isSelect
    this.isSelecting = isSelect
    this.map.markDirty()
  }

  private follow(bool: boolean) {
    if (bool) {
      this.game.map.viewport?.follow(this.imageContainer, { speed: 10 })
    } else {
      this.game.map.viewport?.plugins.remove('follow')
    }
  }

  async updateState(state: MonsterState) {
    this.state = state
    await this.draw()
  }

  async draw() {
    this.drawHp()
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
      setTimeout(() => {
        sound.play('grunt', {volume: 0.4})
        this.prevHP = hp
        this.changeActionState(DrawState.Hurt)
      }, 200)
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

  private async shoot(x: number, y: number) {
    const energy = this.map.addImage('/images/energy2.png', { x: this.curP.x, y: this.curP.y, w: 1, h: 1 })
    sound.play('shoot', {volume: 0.4})
    await this.moveObject(energy, this.curP.x, this.curP.y, x, y)
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
