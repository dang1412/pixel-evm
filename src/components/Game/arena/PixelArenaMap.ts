import { Assets, Container, PointData } from 'pixi.js'

import { ViewportMap } from '../ViewportMap'
import { positionToXY, xyToPosition } from '../utils'

import { PixelArenaGame } from './PixelArenaGame'
import { ActionType, ArenaAction, ArenaGameState, MapItemType, MonsterState, MonsterType } from './types'
import { PixelArenaMonster } from './PixelArenaMonster'
import { itemImages } from './constants'

Assets.load([
  '/images/select_aura.png',
  '/svgs/car.svg',
  '/svgs/rocket.svg',
])

export class PixelArenaMap {
  game: PixelArenaGame

  private monsters: {[id: number]: PixelArenaMonster} = {}
  private pixelToMonsterMap: {[pos: number]: PixelArenaMonster} = {}

  private selectedMonster?: PixelArenaMonster

  private auraContainer?: Container

  // Items on map
  private itemContainers: {[pos: number]: Container} = {}

  ownerId = 1

  constructor(public map: ViewportMap, public sceneName: string, private onSelectMonster?: (monster: MonsterState, type: ActionType) => void) {
    const state: ArenaGameState = {
      monsters: {},
      positionMonsterMap: {},
      roundActions: {},
      currentRound: 0,
      aliveNumber: 0,
      executedOrder: [],
      positionItemMap: {}
    }

    this.game = new PixelArenaGame(state, (actions: ArenaAction[], monsters: MonsterState[]) => {
      this.onNextRound(actions, monsters)
    })

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
      // const sx = this.selectedMonster ? this.selectedMonster.state.pos.x - 0.4 : tx
      // const sy = this.selectedMonster ? this.selectedMonster.state.pos.y - 0.5 : ty
      this.map.moveObject(this.auraContainer!, tx, ty)
      this.selectedMonster = monster
      if (this.onSelectMonster) this.onSelectMonster({...monster.state}, monster.actionType)
    }
  }

  private async onNextRound(actions: ArenaAction[], monsters: MonsterState[]) {
    console.log('Next round actions:', actions, monsters)

    // apply moves and shoots
    const moves = this.processMoveActions(actions)
    const shoots = this.processShootActions(actions)
    await Promise.all([moves, shoots])

    // Update map items after actions
    this.updateMapItems()

    // Update states
    for (const state of monsters) {
      const monster = this.monsters[state.id]
      if (monster) {
        // Hp, vehicle, and other state updates (including position)
        monster.updateState({...state})
        // Inform UI new state if selected
        if (this.selectedMonster && this.selectedMonster.state.id === state.id) {
          if (this.onSelectMonster) {
            this.onSelectMonster({...state}, monster.actionType)
          }
        }

        // If monster hp is 0, remove it from the arena
        if (state.hp <= 0) {
          this.selectedMonster = undefined // Unselect monster
          const pos = monster.remove() // Remove monster if hp is 0
          delete this.pixelToMonsterMap[pos] // Remove from pixelToMonsterMap
        }
      } else {
        console.warn(`Monster with id ${state.id} not found for state update`)
      }
    }
  }

  private async processMoveActions(actions: ArenaAction[]) {
    // Process move actions for monsters
    const movePrommises: Promise<void>[] = []
    for (const action of actions) {
      if (action.actionType === ActionType.Move) {
        const monster = this.monsters[action.id]
        if (monster) {
          const oldPosVal = xyToPosition(monster.state.pos.x, monster.state.pos.y)
          const newPosVal = xyToPosition(action.target.x, action.target.y)
          // remove old position from pixelToMonsterMap
          delete this.pixelToMonsterMap[oldPosVal]
          // add new position to pixelToMonsterMap
          this.pixelToMonsterMap[newPosVal] = monster
          const move = monster.applyAction(action)
          movePrommises.push(move)

          // move aura if selected
          if (this.selectedMonster && this.selectedMonster.state.id === action.id) {
            const sx = monster.state.pos.x - 0.4
            const sy = monster.state.pos.y - 0.5
            const tx = action.target.x - 0.4
            const ty = action.target.y - 0.5
            this.map.moveObject(this.auraContainer!, sx, sy, tx, ty)

            // Inform new postion after move
            move.then(() => this.onSelectMonster? this.onSelectMonster(monster.state, monster.actionType) : undefined)
          }
        } else {
          console.warn(`Monster with id ${action.id} not found for move action`)
        }
      }
    }

    return Promise.all(movePrommises)
  }

  private async processShootActions(actions: ArenaAction[]) {
    // Process shoot actions for monsters
    const shootPromises: Promise<void>[] = []
    for (const action of actions) {
      if (action.actionType === ActionType.Shoot) {
        const monster = this.monsters[action.id]
        if (monster) {
          const shoot = monster.applyAction(action)
          shootPromises.push(shoot)
        } else {
          console.warn(`Monster with id ${action.id} not found for shoot action`)
        }
      }
    }

    return Promise.all(shootPromises)
  }
  
  private initGame() {
    // aura
    const scene = this.map.getActiveScene()!
    this.auraContainer = scene.addImage('/images/select_aura.png', { x: 0, y: 0, w: 2, h: 2 })

    // items
    this.game.addItem({ x: 4, y: 4 }, MapItemType.Car) // Example item
    this.game.addItem({ x: 14, y: 14 }, MapItemType.Car) // Example item
    this.game.addItem({ x: 6, y: 6 }, MapItemType.Bomb) // Example item
    this.updateMapItems()

    // monsters
    this.addMonster(this.ownerId, { x: 3, y: 3 }, 3) // Example monster
    this.addMonster(this.ownerId, { x: 5, y: 3 }, 3) // Example monster
    this.addMonster(this.ownerId, { x: 7, y: 3 }, 3, MonsterType.TrippiTroppi) // Example monster
    this.addMonster(this.ownerId, { x: 10, y: 5 }, 3, MonsterType.Tralarelo) // Example monster
  }

  // Update items's draw on the map
  private updateMapItems() {
    const scene = this.map.getActiveScene()!
    const positionItemMap = this.game.state.positionItemMap
    // update existing items
    for (const pixelStr of Object.keys(positionItemMap)) {
      const pixel = Number(pixelStr)
      if (!this.itemContainers[pixel]) {
        // If item container does not exist, create it
        const { x, y } = positionToXY(pixel)
        const type = positionItemMap[pixel]
        const image = itemImages[type]
        this.itemContainers[pixel] = scene.addImage(image, { x, y, w: 1, h: 1 })
      }
    }

    // remove items that no longer exist
    console.log(this.itemContainers, positionItemMap)
    for (const pixelStr of Object.keys(this.itemContainers)) {
      const pixel = Number(pixelStr)
      if (positionItemMap[pixel] === undefined) {
        // If item no longer exists, remove its container
        console.log(pixelStr, pixel)
        this.itemContainers[pixel].destroy()
        delete this.itemContainers[pixel]
      }
    }
  }

  /**
   * Add a monster to the arena map.
   * @param id - Unique identifier for the monster.
   * @param pos - Position of the monster on the map.
   * @param hp - Health points of the monster.
   * @param type - Type of the monster (default is Axie).
   */
  private addMonster(id: number, pos: PointData, hp: number, type = MonsterType.Axie): void {
    const monsterState = this.game.addMonster(id, pos, hp, type)
    const monster = new PixelArenaMonster(this, {...monsterState})
    this.monsters[id] = monster

    const posVal = xyToPosition(pos.x, pos.y)
    this.pixelToMonsterMap[posVal] = monster
  }
}
