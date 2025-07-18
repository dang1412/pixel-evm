import { Assets, Container, PointData } from 'pixi.js'
import { sound } from '@pixi/sound'

import { ViewportMap } from '../ViewportMap'
import { positionToXY, xyToPosition } from '../utils'

import { ActionType, ArenaAction, ArenaGameState, FireOnMap, MapItemType, MonsterState, MonsterType } from './types'
import { PixelArenaMonster } from './PixelArenaMonster'
import { itemImages } from './constants'
import { ArenaFire } from './ArenaFire'

Assets.load([
  '/images/select_aura.png',
  '/svgs/car.svg',
  '/svgs/rocket.svg',
  '/svgs/fire.svg',
])

sound.add('move', '/sounds/whistle.mp3')
sound.add('shoot', '/sounds/sword.mp3')
sound.add('hurt', '/sounds/grunt2.mp3')
sound.add('die', '/sounds/char-die.mp3')
sound.add('explode1', '/sounds/explosion3.mp3')
sound.add('explode2', '/sounds/explosion4.mp3')
sound.add('beam-fire', '/sounds/beam-fire.mp3')
sound.add('fire-sound', '/sounds/fire-sound.mp3')

export interface PixelArenaMapOpts {
  sceneName: string
  onMonstersUpdate: (monsters: MonsterState[]) => void
  onMonsterSelect: (id: number) => void
  onActionPosition: (action?: ArenaAction, p?: PointData) => void
}

export class PixelArenaMap {
  // game: PixelArenaGame

  private monsters: {[id: number]: PixelArenaMonster} = {}
  private pixelToMonsterMap: {[pos: number]: PixelArenaMonster} = {}

  private selectedMonster?: PixelArenaMonster

  private auraContainer?: Container

  // Items on map
  private itemContainers: {[pos: number]: Container} = {}

  ownerId = 1

  // temp action for controlling selected monster
  private tempAction?: ArenaAction

  // fires
  private fires: {[pos: number]: ArenaFire} = {}

  private actionsExecutedPromise = Promise.resolve({} as any)

  constructor(public map: ViewportMap, private opts: PixelArenaMapOpts) {
    // const state: ArenaGameState = {
    //   monsters: {},
    //   positionMonsterMap: {},
    //   roundActions: {},
    //   currentRound: 0,
    //   aliveNumber: 0,
    //   executedOrder: [],
    //   positionItemMap: {},

    //   fires: [],
    //   posFireMap: {}
    // }

    // this.game = new PixelArenaGame(state, (actions: ArenaAction[], monsters: MonsterState[]) => {
    //   this.onNextRound(actions, monsters)
    // })

    // Init game when entered the scene
    const unsubscene = map.subscribe('sceneactivated', (event: CustomEvent) => {
      console.log('Scene activated:', event.detail)
      const addedScene = event.detail
      if (addedScene === opts.sceneName) {
        unsubscene()
        this.initGame()
        // this.informUI()
      }
    })

    // Control on the scene
    map.subscribe('pixeldown', (event: CustomEvent) => {
      if (map.activeScene !== opts.sceneName) {
        return
      }

      // hide monster control
      opts.onActionPosition()
      // redraw selecting monster action
      this.selectedMonster?.drawAction()
      this.map.markDirty()

      const [x, y] = event.detail
      const posVal = xyToPosition(x, y)

      // Check if there is a monster at the clicked position
      const monster = this.pixelToMonsterMap[posVal]
      if (monster) {
        this.selectMonster(monster)
        if (monster.state.ownerId === this.ownerId) {
          monster.controlAction()
        }
      }
    })
  }

  // receive action target from monster
  onActionPosition(action: ArenaAction, p: PointData) {
    this.tempAction = action
    this.opts.onActionPosition(action, p)
  }

  // receive action type from UI
  updateSelectingMonsterAction(actionType: ActionType): ArenaAction | undefined {
    if (this.selectedMonster && this.tempAction) {
      const action = {...this.tempAction, actionType}
      this.selectedMonster.updateActionAndDraw(action)
      this.map.markDirty()
      this.tempAction = undefined

      // this.game.receiveAction(action)
      return action
    }
  }

  selectMonsterById(id: number) {
    const monster = this.monsters[id]
    if (monster) this.selectMonster(monster)
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
      this.opts.onMonsterSelect(monster.state.id)
      this.informUI()
    }
  }

  async onNextRound(actions: ArenaAction[]) {
    console.log('Next round actions:', actions)

    // apply moves and shoots
    const moves = this.processMoveActions(actions)
    const shoots = this.processShootActions(actions)
    this.actionsExecutedPromise = Promise.all([moves, shoots])
    await this.actionsExecutedPromise

    // Update map items after actions
    // this.updateMapItems()

    // clear current actions
    for (const monster of Object.values(this.monsters)) if (monster.state.hp > 0) {
      monster.updateActionAndDraw()
    }
  }

  async updateMonsterStates(monsters: MonsterState[]) {
    // wait after actions done
    await this.actionsExecutedPromise
    // Update states
    for (const state of monsters) {
      const monster = this.monsters[state.id]
      if (monster) {
        // Hp, vehicle, and other state updates (including position)
        monster.updateState({...state})

        // If monster hp is 0, remove it from the arena
        if (state.hp <= 0) {
          this.selectedMonster = undefined // Unselect monster
          const pos = monster.remove() // Remove monster if hp is 0
          delete this.pixelToMonsterMap[pos] // Remove from pixelToMonsterMap
        }
      } else {
        this.addMonster(state)
        console.warn(`Add new monster`)
      }
    }

    this.informUI()
  }

  async updateFires(fires: FireOnMap[]) {
    // wait after actions done
    await this.actionsExecutedPromise
    const newFirePixels = new Set<number>()
    for (const fire of fires) {
      const pixel = xyToPosition(fire.pos.x, fire.pos.y)
      const f = {...fire}
      const arenaFire = this.fires[pixel] || new ArenaFire(this, f)
      arenaFire.setFire(f)

      this.fires[pixel] = arenaFire

      newFirePixels.add(pixel)
      sound.play('fire-sound', { loop: true, volume: 0.3 })
    }

    const currentFires = Object.keys(this.fires)
      .map(p => Number(p))
      .filter(p => !newFirePixels.has(p))
      .map(p => this.fires[p])

    for (const arenaFire of currentFires) {
      arenaFire.next()
      if (arenaFire.isStopped()) {
        const { x, y } = arenaFire.getPos()
        const pixel = xyToPosition(x, y)
        delete this.fires[pixel]
      }
    }

    if (Object.keys(this.fires).length === 0) {
      sound.stop('fire-sound')
    }
  }

  private informUI() {
    const selectingOwnerId = this.selectedMonster?.state.ownerId
    if (selectingOwnerId === undefined) return

    // inform UI current owner's alive monsters
    const allMonsters = Object.values(this.monsters)
    const currentOwnerMonsters = allMonsters
      .filter(m => m.state.ownerId === selectingOwnerId && m.state.hp > 0)
      .map(m => m.state)
    this.opts.onMonstersUpdate(currentOwnerMonsters)
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
            // move.then(() => this.onSelectMonster? this.onSelectMonster(monster.state, monster.actionType) : undefined)
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
      if ([ActionType.Shoot, ActionType.ShootBomb, ActionType.ShootFire].includes(action.actionType)) {
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
    // this.game.addItem({ x: 4, y: 4 }, MapItemType.Car) // Example item
    // this.game.addItem({ x: 14, y: 14 }, MapItemType.Car) // Example item
    // this.game.addItem({ x: 6, y: 6 }, MapItemType.Bomb) // Example item
    // this.game.addItem({ x: 6, y: 8 }, MapItemType.Bomb) // Example item
    // this.game.addItem({ x: 16, y: 18 }, MapItemType.Bomb) // Example item
    // this.game.addItem({ x: 7, y: 10 }, MapItemType.Fire) // Example item
    // this.game.addItem({ x: 7, y: 12 }, MapItemType.Fire) // Example item
    // this.game.addItem({ x: 7, y: 14 }, MapItemType.Fire) // Example item
    // this.updateMapItems()

    // monsters
    // this.addMonster(this.ownerId, { x: 3, y: 3 }, 1) // Example monster
    // this.addMonster(this.ownerId, { x: 5, y: 3 }, 15, MonsterType.FamilyBrainrot) // Example monster
    // this.addMonster(this.ownerId, { x: 7, y: 3 }, 1, MonsterType.TrippiTroppi) // Example monster
    // this.addMonster(this.ownerId, { x: 10, y: 5 }, 1, MonsterType.Tralarelo) // Example monster
  }

  // Update items's draw on the map
  async updateMapItems(items: [number, MapItemType][]) {
    const scene = this.map.getActiveScene()!
    // wait after actions done
    await this.actionsExecutedPromise
    // const positionItemMap = this.game.state.positionItemMap
    // update existing items
    for (const item of items) {
      const [pixel, type] = item
      if (type) {
        // If item container does not exist, create it
        const { x, y } = positionToXY(pixel)
        const image = itemImages[type]
        this.itemContainers[pixel] = scene.addImage(image, { x, y, w: 1, h: 1 }, this.itemContainers[pixel])
      } else {
        this.itemContainers[pixel]?.destroy()
        delete this.itemContainers[pixel]
      }
    }

    // remove items that no longer exist
    // for (const pixelStr of Object.keys(this.itemContainers)) {
    //   const pixel = Number(pixelStr)
    //   if (positionItemMap[pixel] === undefined) {
    //     // If item no longer exists, remove its container
    //     console.log(pixelStr, pixel)
    //     this.itemContainers[pixel].destroy()
    //     delete this.itemContainers[pixel]
    //   }
    // }
  }

  /**
   * Add a monster to the arena map.
   * @param ownerId - owner id.
   * @param pos - Position of the monster on the map.
   * @param hp - Health points of the monster.
   * @param type - Type of the monster (default is Axie).
   */
  private addMonster(state: MonsterState): void {
    // const monsterState = this.game.addMonster(ownerId, pos, hp, type)
    const monster = new PixelArenaMonster(this, {...state})
    this.monsters[state.id] = monster

    const pixel = xyToPosition(state.pos.x, state.pos.y)
    this.pixelToMonsterMap[pixel] = monster
  }
}
