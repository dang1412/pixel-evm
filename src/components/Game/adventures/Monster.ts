import { Container, FederatedPointerEvent, Graphics, Sprite } from 'pixi.js'
import { PIXEL_SIZE, ViewportMap } from '../ViewportMap'
import { ActionType, MonsterState } from './types'
import { Adventures } from './Adventures'

const MAP_W = 100
const MAP_H = 100

function positionToXY(p: number): [number, number] {
  const x = p % MAP_W
  const y = Math.floor(p / MAP_W)

  return [x, y]
}

export class AdventureMonster {
  curX: number
  curY: number
  imageContainer: Container | undefined
  map: ViewportMap

  constructor(public game: Adventures, public state: MonsterState) {
    [this.curX, this.curY] = positionToXY(state.pos)
    this.map = game.map
    this.initialize()    
  }

  private async initialize() {
    const imageContainer = await this.map.addImage('/images/axie.png', { x: this.curX, y: this.curY, w: 1.3, h: 1 })
    imageContainer.interactive = true

    // const pixelSize = this.map.getPixelSize()

    // draw range
    let circle = new Graphics()
    circle.clear()
    circle.circle(15, 15, PIXEL_SIZE * 3.5)  // x, y, radius
    circle.fill(0x00FF00) // Color of the circle (green in this example)
    circle.alpha = 0.12
    circle.visible = false

    imageContainer.addChild(circle)

    // start control
    const startControl = async (e: FederatedPointerEvent) => {
      this.map.pauseDrag()
      circle.visible = true

      // add moving shadow
      const shadow = await this.map.addImage('/images/axie.png', { x: this.curX, y: this.curY, w: 1.3, h: 1 })
      shadow.alpha = 0.2

      // subcribe to pixelmove event
      // unsub when done
      const unsub = this.map.subscribe('pixelmove', (e: CustomEvent<[number, number]>) => {
        const [px, py] = e.detail
        console.log('pixelmove', px, py)
        shadow.x = px * PIXEL_SIZE
        shadow.y = py * PIXEL_SIZE

        // hide shadow when too far
        if (Math.abs(px - this.curX) > 3 || Math.abs(py - this.curY) > 3) {
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
        const canmove = shadow.visible
        // remove shadow
        shadow.parent.removeChild(shadow)
        // unsubscribe pixelmove
        unsub()
        this.map.resumeDrag()
        circle.visible = false
        this.map.markDirty()

        // inform game about the move
        if (canmove) {
          const [x, y] = e.detail
          const pos = y * 100 + x
          this.game.receiveAction({id: this.state.id, type: ActionType.MOVE, val: pos})
        }
      }

      this.map.subscribeOnce('pixelup', doneControl)

      this.map.markDirty()
    }

    // events
    imageContainer.on('mousedown', startControl)

    this.map.markDirty()
    this.imageContainer = imageContainer
  }

  updateState(state: MonsterState) {
    this.state = state
    this.draw()
  }

  async draw() {
    // TODO move from curX, curY to pos
    const [tx, ty] = positionToXY(this.state.pos)

    // change position
    if (this.imageContainer) {
      // this.imageContainer.x = this.curX * PIXEL_SIZE
      // this.imageContainer.y = this.curY * PIXEL_SIZE
      this.moveTo(this.imageContainer, this.curX, this.curY, tx, ty)
      this.curX = tx
      this.curY = ty
    }

    this.map.markDirty()
  }

  shoot(x: number, y: number) {}

  private moveTo(object: Container, px: number, py: number, tx: number, ty: number) {
    let x = px * PIXEL_SIZE
    let y = py * PIXEL_SIZE

    const tarX = tx * PIXEL_SIZE
    const tarY = ty * PIXEL_SIZE

    const deltaX = tarX - x
    const deltaY = tarY - y

    const move = () => {
      x += deltaX / 15
      y += deltaY / 15
      object.x = x
      object.y = y
      this.map.markDirty()
      if (x === tarX && y === tarY) {
        unsub()
      }
    }

    const unsub = this.map.subscribe('tick', move)
  }
}
