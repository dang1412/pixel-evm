import { PointData } from 'pixi.js'

import { getAreaPixels, getPixelsFromLine, xyToPosition } from '../utils'
import {
  ActionType,
  ArenaAction,
  ArenaGameState,
  CountDownItemOnMap,
  GameMode,
  MapItemType,
  MonsterState,
  MonsterType,
  shootActions,
  shootWeapons,
} from './types'
import { damgeAreas } from './constants'

let curId = 0

const GameLoopTime = 0.25 // 0.25 seconds per game loop

function getRandom(from: number, to: number) {
  return Math.floor(Math.random() * (to - from) + from)
}

interface PixelArenaGameOpts {
  onActionsDone: (actions: ArenaAction[], states: MonsterState[]) => void
  onItemsUpdate: (items: [number, MapItemType][]) => void
  onFiresUpdate: (fires: CountDownItemOnMap[]) => void
  onBombsUpdate: (bombs: CountDownItemOnMap[]) => void
}

const initialMonsters: MonsterState[] = []
const initialItems: [number, MapItemType][] = []

// Game server logic for Pixel Arena
// This class handles the game state and actions for the Pixel Arena game.
export class PixelArenaGame {
  private updatedItemPixelSet = new Set<number>()
  // private updateFirePixels: number[] = []

  private gameMode = GameMode.EachPlayerMove
  private stepOwnerLastMove: { [ownerId: number]: number } = {} // ownerId -> monsterId

  private positionMonsterMap: { [pos: number]: number } = {} // pixel to monster id
  private stepActions: { [id: number]: ArenaAction } = {}
  private currentStep: number = 0
  private aliveNumber: number = 0
  private executedOrder: number[] = []

  private posFireMap: { [pos: number]: CountDownItemOnMap } = {}
  private posBombMap: { [pos: number]: CountDownItemOnMap } = {}

  constructor(public state: ArenaGameState, private opts: PixelArenaGameOpts) {
    // The game object can be used to access game state, methods, etc.
    // For example, you might want to initialize some game settings here.
    setInterval(() => {
      this.proceedStep()
    }, GameLoopTime * 1000)
  }

  setMode(mode: GameMode) {
    console.log('Change game mode', mode)
    this.gameMode = mode
  }

  start() {
    // Logic to start the game
    console.log('Game started')

    this.addTeam0()
    // this.addTeam1()

    // this.addItem({ x: getRandom(1, 29), y: getRandom(10, 20) }, MapItemType.Rocket)
    const itemsArray: [number, MapItemType][] = []
    for (let x = 3; x < 20; x += 2) {
      const item = this.addItem({ x: getRandom(1, 29), y: getRandom(10, 20) }, MapItemType.Rocket)
      // itemsArray.push(item)
    }
    for (let x = 3; x < 20; x += 2) {
      const item = this.addItem({ x: getRandom(1, 29), y: getRandom(10, 20) }, MapItemType.Fire)
      // itemsArray.push(item)
    }
    for (let x = 3; x < 20; x += 2) {
      const item = this.addItem({ x: getRandom(1, 29), y: getRandom(10, 20) }, MapItemType.Bomb)
      // itemsArray.push(item)
    }

    this.sendUpdatedItems()
    // this.opts.onItemsUpdate(itemsArray)
  }

  addTeam0() {
    const m1 = this.addMonster(0, { x: 12, y: 3 }, 3) // Example monster
    const m2 = this.addMonster(0, { x: 14, y: 3 }, 6, MonsterType.Hero) // Example monster
    const m3 = this.addMonster(0, { x: 16, y: 3 }, 3, MonsterType.Aqua) // Example monster
    const m4 = this.addMonster(0, { x: 14, y: 1 }, 2, MonsterType.Baby) // Example monster

    this.opts.onActionsDone([], [m1, m2, m3, m4])
  }

  addTeam1() {
    const m1 = this.addMonster(1, { x: 12, y: 26 }, 3, MonsterType.Tralarelo) // Example monster
    const m2 = this.addMonster( 1, { x: 14, y: 26 }, 6, MonsterType.FamilyBrainrot) // Example monster
    const m3 = this.addMonster( 1, { x: 16, y: 26 }, 3, MonsterType.TrippiTroppi) // Example monster
    const m4 = this.addMonster( 1, { x: 14, y: 28 }, 3, MonsterType.Saitama) // Example monster

    this.opts.onActionsDone([], [m1, m2, m3, m4])
  }

  // private outputAllStates() {
  //   this.opts.onNextRound([], Object.values(this.state.monsters))
  //   const itemsArray: [number, MapItemType][] = Object.entries(this.state.positionItemMap).map(
  //     ([pos, type]) => [Number(pos), type]
  //   )
  //   this.opts.onItemsUpdate(itemsArray)
  //   this.opts.onFiresUpdate(this.state.fires)
  // }

  getAllStates(
    f: (m: MonsterState[], i: [number, MapItemType][], f: CountDownItemOnMap[]) => void
  ) {
    const monsters = Object.values(this.state.monsters)
    const items: [number, MapItemType][] = Object.entries(
      this.state.positionItemMap
    ).map(([pos, type]) => [Number(pos), type])
    const fires = this.state.fires

    f(monsters, items, fires)
  }

  stop() {
    // Logic to stop the game
    console.log('Game stopped')
  }

  private stepDone(actions: ArenaAction[], monsters: MonsterState[] = []) {
    // Logic to advance to the next round
    this.currentStep += 1
    console.log(`Advancing to round ${this.currentStep}`)
    this.stepActions = {} // Reset actions for the new round
    this.executedOrder = [] // Reset done actions count
    this.stepOwnerLastMove = {}

    // send actions and monsters to client
    if (actions.length || monsters.length) {
      this.opts.onActionsDone(actions, monsters) // Process actions and notify the next round
    }
    // send all fires
    this.sendAllFires()
    // send all bombs
    this.sendAllBombs()
    // send updated items
    this.sendUpdatedItems()

    // Remove dead monsters
    Object.values(this.state.monsters)
      .filter((m) => m.hp <= 0)
      .forEach((m) => delete this.state.monsters[m.id])

    // Remove empty fires
    this.removeEmptyFires()

    // Remove exploded bombs
    this.removeExplodedBombs()
  }

  private sendUpdatedItems() {
    const items: [number, MapItemType][] = Array.from(this.updatedItemPixelSet).map((p) => [
      p,
      this.state.positionItemMap[p],
    ])

    this.updatedItemPixelSet.clear()
    if (items.length) this.opts.onItemsUpdate(items)
  }

  private sendAllFires() {
    // send fires, ceil living to upper integer
    const fires = this.state.fires.map(f => ({...f, living: Math.ceil(f.living)}))
    if (fires.length) {
      // const copy = JSON.parse(JSON.stringify(fires)) as CountDownItemOnMap[]
      this.opts.onFiresUpdate(fires)
    }
  }

  private sendAllBombs() {
    // only send bombs which living is integer
    const bombs = this.state.bombs.filter(b => Number.isInteger(b.living))
    if (bombs.length) {
      const copy = JSON.parse(JSON.stringify(bombs)) as CountDownItemOnMap[]
      this.opts.onBombsUpdate(copy)
    }
  }

  private isStepActionsDone() {
    // if (this.executedOrder.length === 0) return false

    switch (this.gameMode) {
      case GameMode.InstantMove:
        return this.isInstantMoveDone()
      case GameMode.EachPlayerMove:
        return this.isEachPlayerMoveDone()
      case GameMode.AllMove:
        return this.isAllMoveDone()
    }
  }

  private isInstantMoveDone() {
    return true
  }

  // Check if all players made the move for current round
  private isEachPlayerMoveDone() {
    const playerSet = new Set<number>()
    Object.values(this.state.monsters).forEach((m) => playerSet.add(m.ownerId))

    return Object.keys(this.stepOwnerLastMove).length === playerSet.size
  }

  private isAllMoveDone() {
    return this.executedOrder.length >= this.aliveNumber
  }

  private addMonster(
    ownerId: number,
    pos: PointData,
    hp: number,
    type = MonsterType.Axie
  ): MonsterState {
    // Add a new monster to the game state
    const id = curId++
    if (this.state.monsters[id]) {
      console.warn(
        `Monster with id ${id} already exists, updating position and HP`
      )
    }
    const monster: MonsterState = {
      id,
      ownerId,
      pos,
      hp,
      type,
      vehicle: MapItemType.None,
      weapons: {
        [MapItemType.Rocket]: 0,
        [MapItemType.Fire]: 0,
        [MapItemType.Bomb]: 0,
      },
    }
    this.state.monsters[id] = monster // Add monster to the state
    this.positionMonsterMap[xyToPosition(pos.x, pos.y)] = id // Map position to monster id
    this.aliveNumber += 1 // Increment alive monster count

    // Add to initialMonsters
    initialMonsters.push({...monster, weapons: {
      [MapItemType.Rocket]: 0,
      [MapItemType.Fire]: 0,
      [MapItemType.Bomb]: 0,
    },})

    return monster
  }

  private addItem(
    pos: PointData,
    itemType: MapItemType
  ): [number, MapItemType] {
    const pixelPos = xyToPosition(pos.x, pos.y)
    this.state.positionItemMap[pixelPos] = itemType // Map position to item type
    this.updatedItemPixelSet.add(pixelPos)

    const item = [pixelPos, itemType] as [number, MapItemType]

    // add to initialItems
    initialItems.push([...item])

    return item
  }

  receiveAction(action: ArenaAction) {
    // TODO check monster alive

    // Count
    // Override previous action
    const index = this.executedOrder.indexOf(action.id)
    if (index >= 0) {
      // If the action id already exists, remove it from the executed order
      this.executedOrder.splice(index, 1)
    }

    this.executedOrder.push(action.id)
    // Update action
    this.stepActions[action.id] = action

    // update owner last move (for EachPlayerMove mode)
    const monster = this.state.monsters[action.id]
    if (monster) {
      this.stepOwnerLastMove[monster.ownerId] = action.id
    }

    console.log(
      `received order: ${this.executedOrder}, aliveNumber: ${this.aliveNumber}`
    )
  }

  private proceedStep() {
    // actions not done or no actions
    if (!this.isStepActionsDone()) return

    console.log('All actions have been made for the round, execute')
    const { appliedActions, changedStates } = this.processActions() // Process all actions
    // setTimeout(() => {
    console.log(
      'Processing actions for the round:',
      appliedActions,
      changedStates
    )
    this.stepDone(appliedActions, changedStates) // Proceed to the next round
    // }, 50) // Delay for processing actions
  }

  private calMonsterActionDistance(id: number) {
    const monster = this.state.monsters[id]
    const action = this.stepActions[id]
    if (!monster || !action) return Infinity
    const from = monster.pos
    const to = action.target

    return Math.hypot(from.x - to.x, from.y - to.y)
  }

  private getExecuteOrder(): number[] {
    if (this.gameMode !== GameMode.EachPlayerMove) {
      // short distance first
      this.executedOrder.sort((i, j) => this.calMonsterActionDistance(i) - this.calMonsterActionDistance(j))
      return this.executedOrder
    }

    // EachPlayerMove execute order
    // TODO need to maintain the order same as this.state.executedOrder
    console.log(this.stepOwnerLastMove)
    return Object.values(this.stepOwnerLastMove)
  }

  private processActions(): {
    appliedActions: ArenaAction[]
    changedStates: MonsterState[]
  } {
    // Process all actions for the current round
    const appliedActions: ArenaAction[] = []
    const updatedMonsterIds = new Set<number>()

    const executeOrder = this.getExecuteOrder()

    // Process final blow actions first
    for (const id of executeOrder) {
      const action = this.stepActions[id]
      if (action.actionType === ActionType.FinalBlow) {
        const executed = this.executeFinalBlow(action, updatedMonsterIds)
        if (executed) {
          appliedActions.push(executed)
        } else {
          console.warn(
            `Final blow action for monster ${action.id} was not executed`
          )
        }
      }
    }

    // Process shoot bomb actions
    for (const id of executeOrder) {
      const action = this.stepActions[id]
      if (action.actionType === ActionType.ShootBomb) {
        console.log('execute shoot bomb', action)
        const executed = this.processShootBomb(action, updatedMonsterIds)
        if (executed) {
          appliedActions.push(executed)
        }
      }
    }

    // Process move actions
    for (const id of executeOrder) {
      const action = this.stepActions[id]
      if (action.actionType === ActionType.Move) {
        const executed = this.processMoveAction(action, updatedMonsterIds)
        if (executed) {
          appliedActions.push(executed)
        } else {
          console.warn(
            `Move action for monster ${action.id} was not executed due to invalid position`
          )
        }
      }
    }

    // Process shoot actions
    for (const id of executeOrder) {
      const action = this.stepActions[id]
      if (
        action.actionType === ActionType.Shoot ||
        action.actionType === ActionType.ShootRocket ||
        action.actionType === ActionType.ShootFire
      ) {
        const executed = this.processShootAction(action, updatedMonsterIds)
        if (executed) {
          appliedActions.push(executed)
        }
      }
    }

    // Apply fires damage
    this.processFires(updatedMonsterIds)

    // Process bomb
    this.processBombs(updatedMonsterIds)

    const changedStates = Array.from(updatedMonsterIds).map((id) => ({
      ...this.state.monsters[id],
    }))

    return { appliedActions, changedStates }
  }

  private hasMonster(x: number, y: number): boolean {
    const pixel = xyToPosition(x, y)
    const monsterId = this.positionMonsterMap[pixel]
    const monster = this.state.monsters[monsterId]

    return monster && monster.hp > 0
  }

  private hasBomb(x: number, y: number): boolean {
    const pixel = xyToPosition(x, y)
    const bomb = this.posBombMap[pixel]
    return bomb && bomb.living > 0
  }

  private getNextMovePosition(from: PointData, to: PointData): PointData {
    // Get the next move position based on the current position and target
    const points = getPixelsFromLine(from.x, from.y, to.x, to.y)
    let j = 0
    for (let i = 1; i < points.length; i++) {
      const [x, y] = points[i]
      const pixel = xyToPosition(x, y)
      if (this.posBombMap[pixel]) {
        // has bomb
        break
      }

      // move next
      j = i
    }

    // move back until found empty position
    while (j > 0 && this.hasMonster(points[j][0], points[j][1])) {
      j--
    }

    return { x: points[j][0], y: points[j][1] }
  }

  private processMoveAction(
    action: ArenaAction,
    updatedMonsterIds: Set<number>
  ): ArenaAction | undefined {
    // Logic to move the monster based on the action
    const monster = this.state.monsters[action.id]
    if (!monster || monster.hp <= 0) {
      console.warn(`Monster ${action.id} not found or dead for move action`)
      return
    }

    // Check path
    const target = this.getNextMovePosition(monster.pos, action.target)
    action.target = target // Update action target to the next valid position

    // Check if target position is empty
    const targetPos = xyToPosition(action.target.x, action.target.y)
    if (this.positionMonsterMap[targetPos] !== undefined) {
      return
    }

    // Move the monster to the new position
    const prevPos = xyToPosition(monster.pos.x, monster.pos.y)
    // Remove previous position from map
    delete this.positionMonsterMap[prevPos]
    this.positionMonsterMap[targetPos] = action.id // Update position map

    monster.pos = action.target // Update position
    console.log(
      `Monster ${action.id} moved to ${action.target.x}, ${action.target.y}`
    )

    // check if received items
    if (this.state.positionItemMap[targetPos]) {
      const itemType = this.state.positionItemMap[targetPos]
      // Handle item pickup logic here if needed
      if (this.tryPickupItem(monster, itemType)) {
        // Process item pickup
        console.log(
          `Monster ${action.id} received item ${itemType} at position (${action.target.x}, ${action.target.y})`
        )
        delete this.state.positionItemMap[targetPos] // Remove item from map after pickup
        updatedMonsterIds.add(monster.id)
        // item updated at this position
        this.updatedItemPixelSet.add(targetPos)
      }
    }

    return action
  }

  private tryPickupItem(monster: MonsterState, itemType: MapItemType) {
    // Logic to handle item pickup by a monster
    if (itemType === MapItemType.Car && monster.vehicle === MapItemType.None) {
      monster.vehicle = itemType // Update monster's vehicle type
      return true
    }
    if (itemType === MapItemType.Rocket || itemType === MapItemType.Fire || itemType === MapItemType.Bomb) {
      // Increment the weapon count for the monster
      monster.weapons[itemType] += 1
      console.log(
        `Monster ${monster.id} picked up a ${itemType}, total: ${monster.weapons[itemType]}`
      )
      return true
    }

    return false
  }

  private getShootPosition(from: PointData, to: PointData): PointData {
    // Get the next move position based on the current position and target
    const points = getPixelsFromLine(from.x, from.y, to.x, to.y)
    let j = 0
    for (let i = 1; i < points.length; i++) {
      // move next
      j = i
      const [x, y] = points[i]
      const pixel = xyToPosition(x, y)
      if (this.posBombMap[pixel] || this.hasMonster(x, y)) {
        // has bomb or monster
        break
      }
    }

    return { x: points[j][0], y: points[j][1] }
  }

  private getShootBombPosition(from: PointData, to: PointData): PointData {
    // Get the next move position based on the current position and target
    const points = getPixelsFromLine(from.x, from.y, to.x, to.y)
    // start at last pos
    let j = points.length - 1
    // for (let i = 1; i < points.length; i++) {
    //   const [x, y] = points[i]
    //   const pixel = xyToPosition(x, y)
    //   if (this.posBombMap[pixel]) {
    //     // has bomb
    //     break
    //   }

    //   // move next
    //   j = i
    // }

    // move back until found empty position, or at start
    for (j = points.length - 1; j > 0; j--) {
      const [x, y] = points[j]
      if (!this.hasMonster(x, y) && !this.hasBomb(x, y)) {
        break
      }
    }

    return { x: points[j][0], y: points[j][1] }
  }

  private processShootBomb(action: ArenaAction, updatedMonsterIds: Set<number>): ArenaAction | undefined {
    const monster = this.state.monsters[action.id]
    if (!monster || monster.hp <= 0) {
      console.warn(`Monster ${action.id} not found or dead for shoot bomb action`)
      return
    }
    // bomb
    if (action.actionType === ActionType.ShootBomb) {
      if (monster.weapons[MapItemType.Bomb] <= 0) return

      // calculate shoot block
      action.target = this.getShootBombPosition(monster.pos, action.target)

      const executed = this.addBomb(action)
      if (executed) {
        monster.weapons[MapItemType.Bomb]--
        updatedMonsterIds.add(action.id)
      }

      return executed
    }
  }

  private processShootAction(
    action: ArenaAction,
    updatedMonsterIds: Set<number>
  ): ArenaAction | undefined {
    const monster = this.state.monsters[action.id]
    if (!monster || monster.hp <= 0) {
      console.warn(`Monster ${action.id} not found or dead for shoot action`)
      return
    }
    console.log('processShootAction', monster, action)

    // calculate shoot block
    action.target = this.getShootPosition(monster.pos, action.target)

    // fire
    if (action.actionType === ActionType.ShootFire) {
      if (monster.weapons[MapItemType.Fire] <= 0) return
      monster.weapons[MapItemType.Fire]--
      updatedMonsterIds.add(action.id)
      this.addFire(action.id, action.target)
      return action
    }

    // rocket
    if (action.actionType === ActionType.ShootRocket) {
      if (monster.weapons[MapItemType.Rocket] <= 0) return
      monster.weapons[MapItemType.Rocket]--
      updatedMonsterIds.add(action.id)
    }

    // normal or rocket shoot
    this.applyShootDamage(action, updatedMonsterIds)

    return action
  }

  private executeFinalBlow(action: ArenaAction, updatedMonsterIds: Set<number>): ArenaAction | undefined {
    const monster = this.state.monsters[action.id]
    if (!monster || monster.hp !== 1) return

    // Final blow equal to a rocket
    this.applyShootDamage({ ...action, actionType: ActionType.ShootRocket }, updatedMonsterIds)
    // Self hit and die
    this.monsterGotHit(action.id, 1)
    updatedMonsterIds.add(action.id)

    // Add fire
    if (monster.weapons[MapItemType.Fire] > 0) {
      this.addFire(action.id, action.target)
    }

    return action
  }

  private applyShootDamage(
    action: ArenaAction,
    updatedMonsterIds: Set<number>
  ) {
    const positionMonsterMap = this.positionMonsterMap
    const { target, actionType } = action

    const damageArea = damgeAreas[actionType]
    const { x, y, w, h } = damageArea || { x: 0, y: 0, w: 0, h: 0 }
    const pixels = damageArea
      ? getAreaPixels({ x: target.x + x, y: target.y + y, w, h })
      : []

    const damage = action.actionType === ActionType.ShootRocket ? 2 : 1

    for (const pixel of pixels) {
      if (positionMonsterMap[pixel] !== undefined) {
        const monsterId = positionMonsterMap[pixel]
        this.monsterGotHit(
          monsterId,
          damage,
        )

        updatedMonsterIds.add(monsterId) // Track updated monster ids
      }
    }
  }

  private addFire(monsterId: number, p: PointData) {
    const monster = this.state.monsters[monsterId]
    const living = this.gameMode === GameMode.InstantMove ? 4 + GameLoopTime/2 : 4 // Instant move fire time
    const newFire: CountDownItemOnMap = { pos: p, ownerId: monster?.ownerId || 0, living }

    const pixel = xyToPosition(p.x, p.y)
    const fire = this.posFireMap[pixel]
    if (fire) {
      fire.living += newFire.living
      fire.ownerId = newFire.ownerId
    } else {
      this.posFireMap[pixel] = newFire
      this.state.fires.push(newFire)
    }
  }

  private processFires(updatedMonsterIds: Set<number>) {
    for (const fire of this.state.fires) {
      if (Number.isInteger(fire.living)) {
        this.applyShootDamage(
          { actionType: ActionType.ShootFire, target: fire.pos, id: 0 },
          updatedMonsterIds
        )
      }
      // in InstantMove, each step is GameLoopTime seconds
      // otherwise each step counted as 1 second
      fire.living -= this.gameMode === GameMode.InstantMove ? GameLoopTime/2 : 1 // Instant move fire damage
      if (this.gameMode !== GameMode.InstantMove) fire.living = Math.ceil(fire.living)
    }
  }

  private addBomb(action: ArenaAction): ArenaAction | undefined {
    const { id, target } = action

    // check if already has bomb at this position
    const pixel = xyToPosition(target.x, target.y)
    const bomb = this.posBombMap[pixel]
    const monsterAtTarget = this.positionMonsterMap[pixel]
    if (bomb || monsterAtTarget) {
      return undefined
    }

    const monster = this.state.monsters[id]
    const living = this.gameMode === GameMode.InstantMove ? 4 + GameLoopTime/2 : 4 // Instant move bomb time
    const newBomb: CountDownItemOnMap = { pos: target, ownerId: monster?.ownerId || 0, living }
    
    // new
    this.posBombMap[pixel] = newBomb
    this.state.bombs.push(newBomb)

    return action
  }

  private processBombs(updatedMonsterIds: Set<number>) {
    for (const bomb of this.state.bombs) {
      // in InstantMove, each step is GameLoopTime seconds
      // otherwise each step counted as 1 second
      bomb.living -= this.gameMode === GameMode.InstantMove ? GameLoopTime/2 : 1 // Instant move bomb damage
      if (this.gameMode !== GameMode.InstantMove) bomb.living = Math.ceil(bomb.living)
      if (bomb.living <= 0) {
        // bomb explode
        this.applyShootDamage(
          { actionType: ActionType.ShootRocket, target: bomb.pos, id: 0 },
          updatedMonsterIds
        )
      }
    }
  }

  private removeEmptyFires() {
    // remove
    this.state.fires = this.state.fires.filter((f) => {
      if (f.living > 0) return true

      const pixel = xyToPosition(f.pos.x, f.pos.y)
      delete this.posFireMap[pixel]
      return false
    })
  }

  private removeExplodedBombs() {
    // remove
    this.state.bombs = this.state.bombs.filter((b) => {
      if (b.living > 0) return true

      const pixel = xyToPosition(b.pos.x, b.pos.y)
      delete this.posBombMap[pixel]
      return false
    })
  }

  private monsterGotHit(monsterId: number, damage = 1) {
    const monster = this.state.monsters[monsterId]
    if (!monster) {
      console.warn(`Monster ${monsterId} not found for hit action`)
      return
    }

    monster.hp -= damage
    if (monster.hp <= 0) {
      monster.hp = 0
      console.log(`Monster ${monsterId} has been defeated`)
      delete this.positionMonsterMap[
        xyToPosition(monster.pos.x, monster.pos.y)
      ]
      // delete this.state.monsters[monsterId]
      this.aliveNumber -= 1
    } else {
      console.log(`Monster ${monsterId} hit, remaining HP: ${monster.hp}`)
    }
  }

  restartGame() {
    const monsters = JSON.parse(JSON.stringify(initialMonsters)) as MonsterState[]
    this.resetGameState(monsters, initialItems)
  }

  private resetGameState(monsters: MonsterState[], items: [number, MapItemType][]) {
    console.log(`Reset game to state`, monsters, items)
    this.currentStep = 0
    this.stepActions = {} // Reset actions for the new round
    this.executedOrder = [] // Reset done actions count
    this.stepOwnerLastMove = {}
    this.aliveNumber = 0

    // monsters
    this.state.monsters = {}
    this.positionMonsterMap = {}
    monsters.forEach(m => {
      const pixel = xyToPosition(m.pos.x, m.pos.y)
      this.positionMonsterMap[pixel] = m.id
      if (m.hp > 0){
        this.aliveNumber++
        this.state.monsters[m.id] = {...m}
      }
    })

    this.state.fires = []
    this.posFireMap = {}
    this.state.bombs = []
    this.posBombMap = {}

    // items
    this.state.positionItemMap = {}
    items.forEach(([pos, item]) => this.state.positionItemMap[pos] = item)

    this.opts.onActionsDone([], monsters) // Process actions and notify the next round
    this.opts.onItemsUpdate(items)

    this.opts.onFiresUpdate([])
    this.opts.onBombsUpdate([])
  }
}

//   private positionMonsterMap: { [pos: number]: number } = {} // pixel to monster id
//   private roundActions: { [id: number]: ArenaAction } = {}
//   private currentRound: number = 0
//   private aliveNumber: number = 0
//   private executedOrder: number[] = []

//   private posFireMap: { [pos: number]: CountDownItemOnMap } = {}
//   private posBombMap: { [pos: number]: CountDownItemOnMap } = {}
