import { Assets, Container, PointData, Sprite, Spritesheet } from 'pixi.js'
import { sound } from '@pixi/sound'

// import { ViewportMap } from '../ViewportMap'
import { positionToXY, xyToPosition } from '../utils'

import { ActionType, ArenaAction, CountDownItemOnMap, MapItemType, MonsterState } from './types'
import { PixelArenaMonster } from './PixelArenaMonster'
import { itemImages } from './constants'
import { ArenaFire } from './ArenaFire'
import { createAnimation } from '../helpers/createAnimation'
import { ArenaBomb } from './ArenaBomb'
import { PixelMap } from '../pixelmap/PixelMap'

Assets.load([
  '/images/select_aura.png',
  '/images/palmtree1.png',
  '/images/palmtree2.png',
  '/images/mountain.png',
  '/images/red-diamond-2.png',
  '/images/bomb.png',
  '/svgs/car.svg',
  '/svgs/rocket.svg',
  '/svgs/fire.svg',
  '/svgs/skull.svg',
  '/svgs/bomb.svg',
])

const explodePromise = Assets.load<Spritesheet>('/animations/explosion1.json')

sound.add('move', '/sounds/whistle.mp3')
sound.add('shoot', '/sounds/sword.mp3')
sound.add('hurt', '/sounds/grunt2.mp3')
sound.add('die', '/sounds/char-die.mp3')
sound.add('scream', '/sounds/scream.mp3')
sound.add('explode1', '/sounds/explosion3.mp3')
sound.add('explode2', '/sounds/explosion4.mp3')
sound.add('beam-fire', '/sounds/beam-fire.mp3')
sound.add('fire-sound', '/sounds/fire-sound.mp3')

export interface PixelArenaMapOpts {
  sceneName: string
  onMonstersUpdate: (monsters: MonsterState[]) => void
  onMonsterSelect: (id: number) => void
  onActionPosition: (target?: PointData, pos?: PointData) => void
}

export class PixelArenaMap {
  // game: PixelArenaGame

  private monsters: {[id: number]: PixelArenaMonster} = {}
  private pixelToMonsterMap: {[pos: number]: PixelArenaMonster} = {}

  private selectedMonster?: PixelArenaMonster

  // private auraContainer?: Container

  // Items on map
  private itemContainers: {[pos: number]: Container} = {}

  ownerId = 1

  // temp action for controlling selected monster
  // private tempAction?: ArenaAction
  private controlTarget?: PointData

  // fires
  private fires: {[pos: number]: ArenaFire} = {}
  // bombs
  private bombs: {[pos: number]: ArenaBomb} = {}

  private actionsExecutedPromise = Promise.resolve({} as any)

  private selectingIds = new Set<number>()

  constructor(public map: PixelMap, private opts: PixelArenaMapOpts) {
    const view = map.getView()
    // Init map when entered the scene
    const unsubscene = view.subscribe('sceneactivated', (event: CustomEvent) => {
      console.log('Scene activated:', event.detail)
      const addedScene = event.detail
      if (addedScene === opts.sceneName) {
        unsubscene()
        this.initGame()
      }
    })

    // Control on the scene
    view.subscribe('pixeldown', (event: CustomEvent) => {
      if (view.activeScene !== opts.sceneName) {
        return
      }

      // hide monster control
      opts.onActionPosition()
      // redraw selecting monster action
      this.applyToSelectedMonsters((m) => m.drawAction())
      // this.selectedMonster?.drawAction()
      view.markDirty()

      const [x, y] = event.detail
      const posVal = xyToPosition(x, y)

      // Check if there is a monster at the clicked position
      const monster = this.pixelToMonsterMap[posVal]
      if (monster) {
        // this.selectMonster(monster)
        // if (monster.state.ownerId === this.ownerId) {
          // monster.controlAction()
        // }
        this.startControl(monster, x, y)
      }
    })

    view.subscribe('pixelclick', (event: CustomEvent) => {
      if (view.activeScene !== opts.sceneName) {
        return
      }

      const [x, y] = event.detail
      const posVal = xyToPosition(x, y)

      // Check if there is a monster at the clicked position
      const monster = this.pixelToMonsterMap[posVal]
      if (monster) {
        const isSelect = monster.toggleSelect()
        this.selectMonster(monster, isSelect)
        this.informUI()
        // if (isSelect) {
        //   this.selectingIds.add(monster.state.id)
        //   this.opts.onMonsterSelect(monster.state.id)
        //   this.opts.onMonstersUpdate([monster.state])
        // } else {
        //   this.selectingIds.delete(monster.state.id)
        // }
      } else {
        // unselect all
        // for (const id of this.selectingIds) {
        //   const monster = this.monsters[id]
        //   if (monster) monster.select(false)
        // }
        // this.applyToSelectedMonsters((m) => m.select(false))
        // this.selectingIds.clear()
      }
    })
  }

  private selectMonster(m: PixelArenaMonster, isSelect = true) {
    m.select(isSelect)
    if (isSelect) {
      this.selectingIds.add(m.state.id)
      this.opts.onMonsterSelect(m.state.id)
      // this.opts.onMonstersUpdate([m.state])
    } else {
      this.selectingIds.delete(m.state.id)
    }
  }

  private unSelectAll() {
    this.applyToSelectedMonsters((m) => m.select(false))
    this.selectingIds.clear()
  }

  private selectExclusive(m: PixelArenaMonster) {
    this.unSelectAll()
    this.selectMonster(m)
    this.informUI()
  }

  private applyToSelectedMonsters(f: (m: PixelArenaMonster) => void) {
    for (const id of [...this.selectingIds]) {
      const monster = this.monsters[id]
      if (monster) f(monster)
    }
  }

  private startControl(monster: PixelArenaMonster, startx: number, starty: number) {
    const image = '/svgs/crosshairs.svg'

    this.getView().startDrag(image, {
      onDrop: (x, y, rx, ry) => {
        if (x === startx && y === starty) return
        const target = this.controlTarget = { x, y }
        // action.target = { x, y }
        // this.drawAction(action)
        // // inform map
        // this.arenaMap.onActionPosition(action, { x: rx, y: ry })
        this.opts.onActionPosition({ x, y }, { x: rx, y: ry })
        // draw temp action
        this.applyToSelectedMonsters((m) => m.drawAction(
          { id: m.state.id, target, actionType: ActionType.None },
          m.state.id === monster.state.id,
        ))
      },
      // isInRange: (x, y) => {
      //   const dx = Math.abs(x - this.state.pos.x)
      //   const dy = Math.abs(y - this.state.pos.y)
      //   const change = dx + dy
      //   return change > 0 && dx <= 8 && dy <= 8
      // },
      onMove: (x, y) => {
        if (!monster.isBeingSelected()) {
          this.selectExclusive(monster)
        } else {
          this.opts.onMonsterSelect(monster.state.id)
        }
        // Draw a line from the monster's current position to (x, y)
        // action.target = { x, y }
        // this.drawAction(action)
        // g = scene.drawLine(
        //   { x: this.state.pos.x + 0.5, y: this.state.pos.y + 0.5 },
        //   { x: x + 0.5, y: y + 0.5 },
        //   g
        // )
      },
      x: startx,
      y: starty,
      w: 1,
      h: 1
    })
  }

  // receive action target from monster
  // onActionPosition(action: ArenaAction, p: PointData) {
  //   this.tempAction = action
  //   this.opts.onActionPosition(action, p)
  // }

  // receive action type from UI
  updateSelectingMonsterAction(actionType: ActionType): ArenaAction[] {
    // if (this.selectedMonster && this.tempAction) {
    //   const action = {...this.tempAction, actionType}
    //   this.selectedMonster.updateActionAndDraw(action)
    //   this.map.getView().markDirty()
    //   this.tempAction = undefined

    //   return action
    // }
    const target = this.controlTarget
    if (!target) return []

    const actions: ArenaAction[] = []

    this.applyToSelectedMonsters((m) => {
      const action = { id: m.state.id, target, actionType }
      m.updateActionAndDraw(action)
      actions.push(action)
    })

    return actions
  }

  selectMonsterById(id: number) {
    const monster = this.monsters[id]
    if (monster) this.selectMonster(monster)
  }

  // private moveAura(x: number, y: number, tx = x, ty = y) {
  //   if (this.auraContainer) {
  //     const dx = 0.45
  //     const dy = 0.5
  //     this.map.getView().moveObject(this.auraContainer, x - dx, y - dy, tx - dx, ty - dy)
  //   }
  // }

  // private selectMonster(monster: PixelArenaMonster) {
  //   // if (this.selectedMonster?.state.id === monster.state.id) {
  //   //   // unselect the monster
  //   // } else {
  //     // const tx = monster.state.pos.x - 0.4
  //     // const ty = monster.state.pos.y - 0.5
  //     // const sx = this.selectedMonster ? this.selectedMonster.state.pos.x - 0.4 : tx
  //     // const sy = this.selectedMonster ? this.selectedMonster.state.pos.y - 0.5 : ty
  //     // this.map.moveObject(this.auraContainer!, tx, ty)
  //     // this.moveAura(monster.state.pos.x, monster.state.pos.y)
  //     // this.selectedMonster = monster
  //     monster.select(true)
  //     this.opts.onMonsterSelect(monster.state.id)
  //     this.informUI()
  //   // }
  // }

  async onExecutedActions(actions: ArenaAction[]) {
    console.log('Next round actions:', actions)
    // wait for previous actions
    // apply finalblows, then moves and shoots
    this.actionsExecutedPromise = this.actionsExecutedPromise
      .then(() => this.processFinalBlow(actions))
      .then(() => Promise.all([
        this.processMoveActions(actions),
        this.processShootActions(actions)
      ]))

    // clear current actions
    for (const monster of Object.values(this.monsters)) if (monster.state.hp > 0) {
      monster.updateActionAndDraw()
    }
  }

  private processFinalBlow(actions: ArenaAction[]) {
    // Process final blow action
    const allMoves: Promise<void>[] = []
    for (const action of actions) if (action.actionType === ActionType.FinalBlow) {
      // const final = actions[0]
      const monster = this.monsters[action.id]
      if (monster) {
        // move monster to target position
        const move = monster.moveTo(action.target.x, action.target.y)
        move.then(() => this.animateExplode(action.target.x, action.target.y))
        allMoves.push(move)
      }
    }

    if (allMoves.length) sound.play('scream', { volume: 0.4 })

    return Promise.all(allMoves)
  }

  async updateMonsterStates(monsters: MonsterState[]) {
    console.log('Receive monsters------', monsters)
    // wait after actions done
    await this.actionsExecutedPromise
    // Update states
    for (const state of monsters) {
      const monster = this.monsters[state.id]
      if (monster) {
        this.updateMonsterPos(monster, state.pos)
        // Hp, vehicle, and other state updates (including position)
        monster.updateState({...state}).then(() => {
          // If monster hp is 0, remove it from the arena
          if (state.hp <= 0) {
            this.selectedMonster = undefined // Unselect monster
            const pos = monster.remove() // Remove monster if hp is 0
            delete this.pixelToMonsterMap[pos] // Remove from pixelToMonsterMap
            delete this.monsters[state.id]  // Delete
            this.selectingIds.delete(state.id)
          }
        })
      } else {
        this.addMonster(state)
        console.warn(`Add new monster`)
      }
    }

    this.informUI()

    this.map.getView().markDirty()
  }

  async updateFires(fires: CountDownItemOnMap[]) {
    console.log('Update fires:', fires)

    // Wait after actions done
    await this.actionsExecutedPromise
    // Update fires from server
    for (const fire of fires) {
      const pixel = xyToPosition(fire.pos.x, fire.pos.y)
      const f = {...fire}
      const arenaFire = this.fires[pixel] || new ArenaFire(this, f)
      arenaFire.setFire(f)

      this.fires[pixel] = arenaFire

      sound.play('fire-sound', { loop: true, volume: 0.1 })
    }

    const firePixels = new Set<number>(fires.map(f => xyToPosition(f.pos.x, f.pos.y)))
    // Remove stopped fires, or not from server
    Object.keys(this.fires)
      .map(p => Number(p))
      .filter(p => !firePixels.has(p) || this.fires[p].isStopped())
      .forEach(p => {
        const f = this.fires[p]
        f.stop()
        delete this.fires[p]
      })

    if (Object.keys(this.fires).length === 0) {
      sound.stop('fire-sound')
    }

    this.map.getView().markDirty()
  }

  async updateBombs(bombs: CountDownItemOnMap[]) {
    console.log('Update bombs:', bombs)
    await this.actionsExecutedPromise
    for (const bomb of bombs) {
      const pixel = xyToPosition(bomb.pos.x, bomb.pos.y)
      const arenaBomb = this.bombs[pixel] || new ArenaBomb(this, bomb)
      arenaBomb.update(bomb.living)

      this.bombs[pixel] = arenaBomb
    }

    // delete exploded bomb
    Object.keys(this.bombs).map(p => Number(p)).forEach(p => {
      const bomb = this.bombs[p]
      if (bomb && bomb.isExploded()) {
        delete this.bombs[p]
      }
    })

    this.map.getView().markDirty()
  }

  private informUI() {
    // const selectingOwnerId = this.selectedMonster?.state.ownerId
    // if (selectingOwnerId === undefined) return

    // // inform UI current owner's alive monsters
    // const allMonsters = Object.values(this.monsters)
    // const currentOwnerMonsters = allMonsters
    //   .filter(m => m.state.ownerId === selectingOwnerId && m.state.hp > 0)
    //   .map(m => m.state)

    const selectingMonsters = [...this.selectingIds]
      .map(id => this.monsters[id].state)
      .filter(m => m.hp > 0)
    this.opts.onMonstersUpdate(selectingMonsters)
  }
  
  private updateMonsterPos(monster: PixelArenaMonster, target: PointData) {
    const prevx = monster.state.pos.x
    const prevy = monster.state.pos.y
    if (prevx === target.x && prevy === target.y) return
    const oldPosVal = xyToPosition(prevx, prevy)
    const newPosVal = xyToPosition(target.x, target.y)
    // remove old position from pixelToMonsterMap
    delete this.pixelToMonsterMap[oldPosVal]
    // add new position to pixelToMonsterMap
    this.pixelToMonsterMap[newPosVal] = monster
  }

  private async processMoveActions(actions: ArenaAction[]) {
    // Process move actions for monsters
    const movePrommises: Promise<void>[] = []
    for (const action of actions) {
      if (action.actionType === ActionType.Move) {
        const monster = this.monsters[action.id]
        if (monster) {
          const prevx = monster.state.pos.x
          const prevy = monster.state.pos.y
          // const oldPosVal = xyToPosition(prevx, prevy)
          // const newPosVal = xyToPosition(action.target.x, action.target.y)
          // // remove old position from pixelToMonsterMap
          // delete this.pixelToMonsterMap[oldPosVal]
          // // add new position to pixelToMonsterMap
          // this.pixelToMonsterMap[newPosVal] = monster
          this.updateMonsterPos(monster, action.target)
          const move = monster.applyAction(action)
          movePrommises.push(move)

          // move aura if selected
          if (this.selectedMonster && this.selectedMonster.state.id === action.id) {
            // const sx = prevx - 0.4
            // const sy = prevy - 0.5
            // const tx = action.target.x - 0.4
            // const ty = action.target.y - 0.5
            // this.map.moveObject(this.auraContainer!, sx, sy, tx, ty)
            // this.moveAura(prevx, prevy, action.target.x, action.target.y)

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
      if ([ActionType.Shoot, ActionType.ShootRocket, ActionType.ShootFire, ActionType.ShootBomb].includes(action.actionType)) {
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
    const scene = this.getScene()
    if (!scene) return

    // Decor
    scene.addImage('/images/palmtree1.png', { x: 3, y: 3, w: 4, h: 4 })
    scene.addImage('/images/palmtree2.png', { x: 24, y: 3, w: 4, h: 4 })

    scene.addImage('/images/palmtree2.png', { x: 3, y: 24, w: 4, h: 4 })
    scene.addImage('/images/palmtree1.png', { x: 24, y: 24, w: 4, h: 4 })

    scene.addImage('/images/mountain.png', { x: 12, y: 13, w: 6, h: 4 })
    scene.addImage('/images/red-diamond-2.png', { x: 14, y: 15, w: 2, h: 1.25 })

    // aura
    // this.auraContainer = scene.addImage('/images/select_aura.png', { x: 0, y: 0, w: 2, h: 2 })
  }

  // Update items's draw on the map
  async updateMapItems(items: [number, MapItemType][]) {
    const scene = this.getScene()
    if (!scene) return

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
        this.itemContainers[pixel] = scene.addImage(image, { x: x + 0.15, y: y + 0.15, w: 0.7, h: 0.7 }, this.itemContainers[pixel])
        this.itemContainers[pixel].alpha = 0.8
      } else {
        this.itemContainers[pixel]?.destroy()
        delete this.itemContainers[pixel]
      }
    }

    this.getView().markDirty()
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

  async animateExplode(x: number, y: number) {
    const scene = this.getScene()
    if (!scene) return

    sound.play('explode1', {volume: 0.1})
    const sheet = await explodePromise
    const frames = sheet.animations['explode']
    const container = scene.addImage('', {x: x - 2, y: y - 3.1, w: 5, h: 5})
    const sprite = container.getChildAt(0) as Sprite

    const animation = createAnimation(this.map.getView())
    return animation.animateOnce(sprite, frames, 3).then(() => {
      container.destroy()
    })
  }

  getView() {
    return this.map.getView()
  }

  getScene() {
    return this.getView().getScene(this.opts.sceneName)
  }
}
