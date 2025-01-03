import { Assets, Container, Graphics, PointData, Sprite, Spritesheet, Texture } from 'pixi.js'
import { sound } from '@pixi/sound'

import { ViewportMap } from '../ViewportMap'
import { ActionType, MonsterInfo, MonsterState } from './types'
import { ActionMode, Adventures } from './Adventures'
import { getMonsterInfo, LOOP_TIME } from './constants'
import { PIXEL_SIZE, xyToPosition } from '../utils'
import { moveToward, roundPos } from './gamelogic/utils'
import { AttackType } from './gamelogic/types'
import { PixiAnimation } from '../Animation'

// repeating animation state
export enum DrawBaseState {
  Stand = 'stand',
  Run = 'run',
}

// one-time animation state
export enum DrawActionState {
  Hurt = 'hurt',
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

const attackToDraw: {[k in AttackType]: DrawActionState} = {
  [AttackType.A1]: DrawActionState.A1,
  [AttackType.A2]: DrawActionState.A2,
  [AttackType.A3]: DrawActionState.A3,
  [AttackType.A4]: DrawActionState.A4,
  [AttackType.A5]: DrawActionState.A5,
  [AttackType.A6]: DrawActionState.A6,
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
  monsterContainer = new Container()
  map: ViewportMap

  // range = 4
  maxHp = 10
  isSelecting = false

  prevHP = 0
  drawInfo: MonsterInfo

  curMapIdx
  private isLeft = false

  private eventTarget = new EventTarget()

  private animation: PixiAnimation

  constructor(public game: Adventures, public state: MonsterState) {
    this.curP = state.pos
    this.curMapIdx = state.mapIdx
    // this.curX = state.pos.x
    // this.curY = state.pos.y

    this.map = game.map
    this.prevHP = state.hp
    this.drawInfo = getMonsterInfo(state.type)
    // const { image, w, h } = this.drawInfo
    const scene = this.map.getActiveScene()
    if (scene) {
      this.monsterContainer = scene.addImage('/images/select_aura.png', { x: this.curP.x, y: this.curP.y, w: 0, h: 0 })
      this.initialize()
      // this.initializeDrawState()
    }

    // animation
    this.animation = new PixiAnimation((f) => {
      const unsub = game.map.subscribe('tick', (e: CustomEvent<number>) => {
        f(e.detail)
        game.map.markDirty()
      })

      return unsub
    })
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
      this.game.requestAction({id: this.state.id, type: ActionType.MOVE, pos: nextP})
    }
  }

  // start control
  // async startControl() {
  //   this.map.pauseDrag()
  //   this.drawRange()
  //   this.game.selectMon(this)

  //   if (this.game.mode === ActionMode.MOVE) {
  //     await this.startMove()
  //   } else {
  //     await this.startShoot()
  //   }

  //   this.map.markDirty()
  // }

  /**
   * Send attack signal to server
   * @param a
   */
  sendAttack(a: AttackType) {
    // only send attack when no action state
    // if (this.actionState === undefined) {
    this.game.requestAction({id: this.state.id, type: ActionType.SHOOT, pos: {x: a, y: 100}})
    // }
  }

  /**
   * Draw melee or range attack
   * @param p
   */
  drawAttack(p: PointData) {
    if (p.y === 100) {
      // melee attack
      const attackDrawState = attackToDraw[p.x as AttackType]
      this.applyActionState(attackDrawState)
    } else {
      // range attack
      this.applyActionState(attackToDraw[AttackType.A5])
      // draw shoot
      this.shoot(p.x, p.y)
    }
  }

  /**
   * Start control range attack
   */
  startShoot() {
    let {x: tx, y: ty} = this.curP
    const range = this.drawInfo.shootRange
    // shooting
    const int = setInterval(() => {
      if (tx === this.curP.x && ty === this.curP.y) return
      if (Math.abs(tx - this.curP.x) <= range && Math.abs(ty - this.curP.y) <= range) {
        this.game.requestAction({id: this.state.id, type: ActionType.SHOOT, pos: {x: tx, y: ty}})
      }
    }, this.drawInfo.shootSpeed)

    this.game.startDrag('/images/energy2.png', {
      onDrop: (px, py) => {
        // on drop
        clearInterval(int)
        this.map.resumeDrag()
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

  startMove() {
    const { imageMove } = this.drawInfo

    this.game.startDrag(imageMove, {
      onDrop: (x, y) => {
        this.map.resumeDrag()
        if (x !== this.state.target.x || y !== this.state.target.y) {
          this.game.requestAction({id: this.state.id, type: ActionType.MOVE, pos: {x, y}})
        }
      }
    })
  }

  // Enter land
  enterLand(mapIdx: number) {
    this.game.requestAction({id: this.state.id, type: ActionType.ENTER, pos: {x: mapIdx, y: 0}})
  }

  // Monster animations

  // private tickCount = 0
  // private frameCount = 0
  // private baseState = DrawState.Stand
  // private actionState: DrawState | undefined
  // private animationStopMap: {[name: string]: () => void} = {}

  // private animate(animationName: string, sprite: Sprite, frames: Texture[], tickPerFrame: number) {
  //   // stop previous animation if any
  //   const stop = this.animationStopMap[animationName]
  //   if (stop) stop()

  //   let count = 0
  //   let frameCount = 0
  //   this.animationStopMap[animationName] = this.map.subscribe('tick', (e: CustomEvent<number>) => {
  //     if (count++ % tickPerFrame === 0) {
  //       if (frameCount >= frames.length) {

  //       }
  //     }
  //   })
  // }

  private initialize() {
    const { offX, offY, image } = this.drawInfo
    const monsterContainer = this.monsterContainer
    monsterContainer.interactive = true

    // monster
    const monsterDraw = new Sprite(Texture.from(image))
    monsterDraw.x = offX * PIXEL_SIZE
    monsterDraw.y = offY * PIXEL_SIZE
    monsterContainer.addChild(monsterDraw) // 1

    // hp
    const hp = new Graphics()
    monsterContainer.addChild(hp) // 2

    // select
    const selectAura = this.getSelectDraw()
    selectAura.scale = 0.5
    selectAura.x = -40
    selectAura.y = -25
    selectAura.visible = false

    // this.drawRange(this.drawInfo.shootRange)
    this.drawHp()

    const unsub = this.map.subscribe('tick', (e: CustomEvent<number>) => {
      // move
      if (this.state.mapIdx !== this.curMapIdx) {
        this.changeMap(this.state.mapIdx)
      }

      this.proceedMove(e.detail)
    })

    this.subscribeOnce('die', unsub)

    // start stand animation
    this.applyDrawState(DrawBaseState.Run, () => {})

    this.game.map.markDirty()
  }

  // private async initializeDrawState() {
  //   const sheet = await Assets.load<Spritesheet>(this.drawInfo.spritesheet)
  //   const sprite = this.getMonsterDraw()

  //   const unsub = this.map.subscribe('tick', (e: CustomEvent<number>) => {
  //     const state = this.actionState || this.baseState
  //     const animation = sheet.animations[state] || []
  //     const framePerStep = (state === DrawState.Stand || state === DrawState.Die) ? 10 : 5
  //     if (this.tickCount % framePerStep === 0) {
  //       if (this.frameCount >= animation.length) {
  //         this.frameCount = 0
  //         this.tickCount = 0
  //         // this.onDrawLoop()
  //         this.eventTarget.dispatchEvent(new Event('drawloop'))
  //       }

  //       const texture = animation[this.frameCount++]
  //       if (texture) {
  //         sprite.texture = texture
  //         const {x, y} = texture.defaultAnchor || {x: 0, y: 0}
  //         sprite.anchor.set(x,y)
  //       }
  //     }
  //     this.tickCount++

  //     this.map.markDirty()

  //     // move
  //     if (this.state.mapIdx !== this.curMapIdx) {
  //       this.changeMap(this.state.mapIdx)
  //     }

  //     this.proceedMove(e.detail)
  //   })

  //   this.subscribeOnce('die', unsub)
  // }

  private drawBaseState = DrawBaseState.Stand

  // Apply both base(repeating) and action(one-time) states
  private async applyDrawState(state: DrawBaseState | DrawActionState, onloop: () => void) {
    console.log('Start draw', state)
    const sprite = this.getMonsterDraw()
    const sheet = await Assets.load<Spritesheet>(this.drawInfo.spritesheet)
    const frames = sheet.animations[state] || []
    const tickPerFrame = (state === DrawBaseState.Stand || state === DrawActionState.Die) ? 10 : 5

    return this.animation.animate(sprite, frames, tickPerFrame, onloop)
  }

  // Apply action(one-time) state, return to base state after done
  private doingAction = false
  private async applyActionState(state: DrawActionState, done = () => true) {
    // doing
    this.doingAction = true
    // sound
    if (this.isSelecting) sound.play(state, { volume: 0.4 })
    const stop = await this.applyDrawState(state, () => {
      // stop doing
      this.doingAction = false
      if (done()) this.applyDrawState(this.drawBaseState, () => {})
      else {
        // stop the animation if not return to base state
        // this.animation.stopAnimation()
        stop()
      }
    })
  }

  private switchLeft(isLeft: boolean) {
    // this.isLeft = isLeft
    if (this.isLeft !== isLeft) {
      this.isLeft = isLeft
      this.monsterContainer.scale.x = isLeft ? -1 : 1
    }
  }

  private changeMap(mapIdx: number) {
    this.curMapIdx = mapIdx
    this.monsterContainer.parent.removeChild(this.monsterContainer)

    const scene = this.map.getActiveScene()
    scene?.container.addChild(this.monsterContainer)
    this.curP = {x: this.state.pos.x -1, y: this.state.pos.y}
  }

  // speed 1unit every 200ms
  private proceedMove(delta: number) {
    // const distanceToPos = distance(this.curP, this.state.pos)
    // if (distanceToPos === 0) return

    // console.log(distanceToPos)
    const d = delta / LOOP_TIME * this.drawInfo.moveSpeed
    const { x: tx, y: ty } = this.state.pos
    if (tx !== this.curP.x || ty !== this.curP.y) {
      this.changeBaseState(DrawBaseState.Run)
      if (this.curP.x < tx) {
        this.switchLeft(false)
      } else if (this.curP.x > tx) {
        this.switchLeft(true)
      }
      
      // move
      const { x, y } = moveToward(this.curP.x, this.curP.y, tx, ty, d)
      this.monsterContainer.x = (x + (this.isLeft ? this.drawInfo.w : 0)) * PIXEL_SIZE
      this.monsterContainer.y = y * PIXEL_SIZE

      this.curP = {x, y}
    } else {
      this.changeBaseState(DrawBaseState.Stand)
    }
  }

  private changeBaseState(state: DrawBaseState) {
    if (this.drawBaseState !== state) {
      this.drawBaseState = state
      // apply base state when not doing action
      if (!this.doingAction) this.applyDrawState(state, () => {})
      // screen follow
      if (state === DrawBaseState.Run) {
        if (this.isSelecting) {
          this.follow(true)
        }
      } else {
        if (this.isSelecting) {
          this.follow(false)
        }
      }
    }
  }

  // private changeActionState(state: DrawState, onDone = () => {}) {
  //   // change action state
  //   this.actionState = state
  //   // restart animation
  //   this.frameCount = 0
  //   this.tickCount = 0
  //   if (this.isSelecting) sound.play(state)

  //   this.subscribeOnce('drawloop', (e) => {
  //     this.actionState = undefined
  //     onDone()
  //   })
  // }

  // subcribe
  private subscribe(type: string, func: (e: CustomEvent) => void) {
    this.eventTarget.addEventListener(type, func as EventListener)

    return () => this.eventTarget.removeEventListener(type, func as EventListener)
  }

  // subcribe once
  private subscribeOnce(type: string, func: (e: CustomEvent) => void) {
    const unsub = this.subscribe(type, (e) => {
      func(e)
      unsub()
    })
  }

  select(isSelect: boolean) {
    if (!isSelect) {
      this.follow(false)
    }
    let select = this.getSelectDraw()
    select.visible = isSelect
    this.isSelecting = isSelect
  }

  private follow(bool: boolean) {
    if (bool) {
      this.game.map.viewport?.follow(this.monsterContainer, { speed: 10 })
    } else {
      this.game.map.viewport?.plugins.remove('follow')
    }
  }

  async updateState(state: MonsterState) {
    this.state = state
    await this.drawHp()
  }

  // async draw() {
  //   this.drawHp()
  // }

  // remove() {
  //   this.drawHp()
  //   this.changeActionState(DrawState.Die, () => {
  //     this.imageContainer.parent.removeChild(this.imageContainer)
  //     this.eventTarget.dispatchEvent(new Event('die'))
  //   })
  // }

  private getSelectDraw(): Sprite {
    return this.monsterContainer.getChildAt(0) as Sprite
  }

  private getHpDraw(): Graphics {
    return this.monsterContainer.getChildAt(2) as Graphics
  }

  private getMonsterDraw(): Sprite {
    return this.monsterContainer.getChildAt(1) as Sprite
  }

  private drawHp() {
    const hpdraw = this.getHpDraw()
    hpdraw.clear()
    const hp = this.state.hp

    if (this.prevHP > hp) {
      // get hurt
      setTimeout(() => {
        this.prevHP = hp
        if (hp > 0) {
          this.applyActionState(DrawActionState.Hurt)
        } else {
          this.applyActionState(DrawActionState.Die, () => {
            this.monsterContainer.parent.removeChild(this.monsterContainer)
            this.eventTarget.dispatchEvent(new Event('die'))

            return false
          })
        }
      }, 200)
    }

    hpdraw.rect(0, -5, PIXEL_SIZE * hp / this.maxHp, 3)
    hpdraw.fill('green')
  }

  // private drawRange(range: number) {
  //   // const range = this.game.mode === ActionMode.MOVE ? this.drawInfo.moveRange : this.drawInfo.shootRange
  //   let circle = this.monsterContainer.getChildAt(2) as Graphics
  //   circle.clear()
  //   circle.circle(PIXEL_SIZE / 2, PIXEL_SIZE / 2, PIXEL_SIZE * (range + 0.5))  // x, y, radius
  //   circle.fill(0x00FF00) // Color of the circle (green in this example)
  //   circle.alpha = 0.12
  //   circle.visible = false
  // }

  private async shoot(x: number, y: number) {
    const scene = this.map.getActiveScene()
    if (!scene) return
    const energy = scene.addImage('/images/energy2.png', { x: this.curP.x, y: this.curP.y, w: 1, h: 1 })
    sound.play('shoot', {volume: 0.4})
    await this.moveObject(energy, this.curP.x, this.curP.y, x, y)
    // scene.animate({x: x - 2, y: y - 3.1, w: 5, h: 5}, 27, 'explo1_')
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
        
        if (x === tarX && y === tarY) {
          unsub()
          res()
        }
      })
    })
  }
}
