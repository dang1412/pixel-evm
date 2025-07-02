import { Assets, Container, PointData } from 'pixi.js'

import { ViewportMap } from '../ViewportMap'
import { xyToPosition } from '../utils'

import { PixelArenaGame } from './PixelArenaGame'
import { ActionType, ArenaAction, ArenaGameState, MonsterState } from './types'
import { PixelArenaMonster } from './PixelArenaMonster'

Assets.load(['/images/select_aura.png'])

export class PixelArenaMap {
  game: PixelArenaGame

  private monsters: {[id: number]: PixelArenaMonster} = {}
  private pixelToMonsterMap: {[pos: number]: PixelArenaMonster} = {}

  private selectedMonster?: PixelArenaMonster

  private auraContainer?: Container

  constructor(public map: ViewportMap, public sceneName: string, private onSelectMonster?: (monster: MonsterState, type: ActionType) => void) {
    const state: ArenaGameState = {
      monsters: {},
      positionMonsterMap: {},
      roundActions: {},
      currentRound: 0,
      aliveNumber: 0,
      executedOrder: [],
    }

    this.game = new PixelArenaGame(state, this.onNextRound.bind(this))

    // Init game when entered the scene
    const unsubscene = map.subscribe('sceneactivated', (event: CustomEvent) => {
      console.log('Scene activated:', event.detail)
      const addedScene = event.detail
      if (addedScene === sceneName) {
        unsubscene()
        this.initGame()
      }
    })

    // Control on the scene
    map.subscribe('pixeldown', (event: CustomEvent) => {
      if (map.activeScene !== sceneName) {
        return
      }

      const [x, y] = event.detail
      const posVal = xyToPosition(x, y)

      console.log(x, y, posVal, this.pixelToMonsterMap)

      // Check if there is a monster at the clicked position
      const monster = this.pixelToMonsterMap[posVal]
      if (monster) {
        this.selectMonster(monster)
        monster.controlAction()
      }
    })
  }

  updateMonsterActionType(actionType: ActionType) {
    if (this.selectedMonster) {
      this.selectedMonster.updateActionType(actionType)
    }
  }

  private selectMonster(monster: PixelArenaMonster) {
    if (this.selectedMonster?.state.id === monster.state.id) {
      // unselect the monster
    } else {
      const tx = monster.state.pos.x - 0.4
      const ty = monster.state.pos.y - 0.5
      const sx = this.selectedMonster ? this.selectedMonster.state.pos.x - 0.4 : tx
      const sy = this.selectedMonster ? this.selectedMonster.state.pos.y - 0.5 : ty
      this.map.moveObject(this.auraContainer!, sx, sy, tx, ty)
      this.selectedMonster = monster
      if (this.onSelectMonster) this.onSelectMonster({...monster.state}, monster.actionType)
    }
  }

  private onNextRound(actions: ArenaAction[]) {
    console.log('Next round actions:', actions)
    const monsters = this.game.state.monsters
    const ids = Object.keys(monsters).map(id => parseInt(id, 10))

    // apply moves
    for (const id of ids) {
      const monster = this.monsters[id]
      const monsterState = monsters[id]

      if (monster.state.pos !== monsterState.pos) {
        const oldPosVal = xyToPosition(monster.state.pos.x, monster.state.pos.y)
        const newPosVal = xyToPosition(monsterState.pos.x, monsterState.pos.y)
        // remove old position from pixelToMonsterMap
        delete this.pixelToMonsterMap[oldPosVal]
        // add new position to pixelToMonsterMap
        this.pixelToMonsterMap[newPosVal] = monster

        // move aura if selected
        if (this.selectedMonster && this.selectedMonster.state.id === id) {
          const sx = monster.state.pos.x - 0.4
          const sy = monster.state.pos.y - 0.5
          const tx = monsterState.pos.x - 0.4
          const ty = monsterState.pos.y - 0.5
          this.map.moveObject(this.auraContainer!, sx, sy, tx, ty)
        }

        // monster move
        monster.applyAction({ id, actionType: ActionType.Move, target: monsterState.pos })
      }
    }

    // apply shoots
    for (const action of actions) {
      const monster = this.monsters[action.id]
      if (monster) {
        monster.applyAction(action)
      } else {
        console.warn(`Monster with id ${action.id} not found for action ${action.actionType}`)
      }
    }
  }

  private initGame() {
    this.addMonster(1, { x: 3, y: 3 }, 3) // Example monster
    this.addMonster(2, { x: 5, y: 3 }, 3) // Example monster
    this.addMonster(3, { x: 7, y: 3 }, 3) // Example monster

    // aura
    const scene = this.map.getActiveScene()!
    this.auraContainer = scene.addImage('/images/select_aura.png', { x: 0, y: 0, w: 2, h: 2 })
  }

  private addMonster(id: number, pos: PointData, hp: number) {
    const monsterState = this.game.addMonster(id, pos, hp)
    const monster = new PixelArenaMonster(this, {...monsterState})
    this.monsters[id] = monster

    const posVal = xyToPosition(pos.x, pos.y)
    this.pixelToMonsterMap[posVal] = monster
    console.log(`Added monster ${monsterState.id} at position (${monsterState.pos.x}, ${monsterState.pos.y}) with HP ${monsterState.hp}`)
  }
}
