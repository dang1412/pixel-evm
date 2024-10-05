import { ViewportMap } from '../ViewportMap'
import { MonsterState } from './types'

export class AdventureMonster {
  curX: number
  curY: number

  constructor(public map: ViewportMap, public state: MonsterState) {
    this.curX = this.curY = 0
    this.updateState(state)
  }

  updateState(state: MonsterState) {
    this.state = state
    this.draw()
  }

  draw() {}

  shoot(x: number, y: number) {}
}
