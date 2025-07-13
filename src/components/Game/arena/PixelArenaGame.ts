import { PointData } from 'pixi.js'

import { getAreaPixels, positionToXY, xyToPosition } from '../utils'
import { ActionType, ArenaAction, ArenaGameState, FireOnMap, MapItemType, MonsterState, MonsterType } from './types'
import { damgeAreas } from './constants';

let curId = 0

interface PixelArenaGameOpts {
  onNextRound: (actions: ArenaAction[], states: MonsterState[]) => void
  onItemsUpdate: (items: [number, MapItemType][]) => void
  onFiresUpdate: (fires: FireOnMap[]) => void
}

// Game server logic for Pixel Arena
// This class handles the game state and actions for the Pixel Arena game.
export class PixelArenaGame {
  private updatedItemPixels: number[] = []
  private updateFirePixels: number[] = []

  constructor(public state: ArenaGameState, private opts: PixelArenaGameOpts) {
    // The game object can be used to access game state, methods, etc.
    // For example, you might want to initialize some game settings here.
  }

  start() {
    // Logic to start the game
    console.log('Game started')

    this.addTeam0()
    // this.addTeam1()

    // items
    // this.addItem({ x: 4, y: 4 }, MapItemType.Car) // Example item
    // this.addItem({ x: 14, y: 14 }, MapItemType.Car) // Example item
    // this.addItem({ x: 6, y: 6 }, MapItemType.Bomb) // Example item
    // this.addItem({ x: 6, y: 8 }, MapItemType.Bomb) // Example item
    // this.addItem({ x: 16, y: 18 }, MapItemType.Bomb) // Example item
    // this.addItem({ x: 7, y: 10 }, MapItemType.Fire) // Example item
    // this.addItem({ x: 7, y: 12 }, MapItemType.Fire) // Example item
    // this.addItem({ x: 7, y: 14 }, MapItemType.Fire) // Example item

    // // monsters
    // this.addMonster(1, { x: 3, y: 3 }, 1) // Example monster
    // this.addMonster(1, { x: 5, y: 3 }, 15, MonsterType.FamilyBrainrot) // Example monster
    // this.addMonster(1, { x: 7, y: 3 }, 1, MonsterType.TrippiTroppi) // Example monster
    // this.addMonster(1, { x: 10, y: 5 }, 1, MonsterType.Tralarelo) // Example monster

    // send monsters
    // this.opts.onNextRound([], Object.values(this.state.monsters))
    // // Convert to array of [pos, MapItemType]
    // const itemsArray: [number, MapItemType][] = Object.entries(this.state.positionItemMap).map(
    //   ([pos, type]) => [Number(pos), type]
    // )
    // this.opts.onItemsUpdate(itemsArray)
  }

  addTeam0() {
    this.addMonster(0, { x: 12, y: 3 }, 1) // Example monster
    this.addMonster(0, { x: 14, y: 3 }, 15, MonsterType.Hero) // Example monster
    this.addMonster(0, { x: 16, y: 3 }, 1, MonsterType.Aqua) // Example monster

    for (let x = 3; x < 27; x += 2) { this.addItem({x, y: 5}, MapItemType.Bomb) }
    for (let x = 3; x < 27; x += 2) { this.addItem({x, y: 6}, MapItemType.Fire) }

    this.outputAllStates()
  }

  addTeam1() {
    this.addMonster(1, { x: 12, y: 26 }, 1, MonsterType.Tralarelo) // Example monster
    this.addMonster(1, { x: 14, y: 26 }, 15, MonsterType.FamilyBrainrot) // Example monster
    this.addMonster(1, { x: 16, y: 26 }, 1, MonsterType.TrippiTroppi) // Example monster

    for (let x = 3; x < 27; x += 2) { this.addItem({x, y: 24}, MapItemType.Bomb) }
    for (let x = 3; x < 27; x += 2) { this.addItem({x, y: 23}, MapItemType.Fire) }

    this.outputAllStates()
  }

  private outputAllStates() {
    this.opts.onNextRound([], Object.values(this.state.monsters))
    const itemsArray: [number, MapItemType][] = Object.entries(this.state.positionItemMap).map(
      ([pos, type]) => [Number(pos), type]
    )
    this.opts.onItemsUpdate(itemsArray)
    this.opts.onFiresUpdate(this.state.fires)
  }

  getAllStates(f: (m: MonsterState[], i: [number, MapItemType][], f: FireOnMap[]) => void) {
    const monsters = Object.values(this.state.monsters)
    const items: [number, MapItemType][] = Object.entries(this.state.positionItemMap).map(
      ([pos, type]) => [Number(pos), type]
    )
    const fires = this.state.fires

    f(monsters, items, fires)
  }

  stop() {
    // Logic to stop the game
    console.log('Game stopped');
  }

  private nextRound(actions: ArenaAction[], monsters: MonsterState[] = []) {
    // Logic to advance to the next round
    this.state.currentRound += 1
    console.log(`Advancing to round ${this.state.currentRound}`)
    this.state.roundActions = {} // Reset actions for the new round
    this.state.executedOrder = [] // Reset done actions count

    // TODO: remove dead monsters

    this.opts.onNextRound(actions, monsters) // Process actions and notify the next round
    this.sendUpdatedItems()
    this.sendUpdatedFires()
  }

  private sendUpdatedItems() {
    const items: [number, MapItemType][] =
      this.updatedItemPixels.map(p => [p, this.state.positionItemMap[p]])

    this.updatedItemPixels = []
    this.opts.onItemsUpdate(items)
  }

  private sendUpdatedFires() {
    const fires = this.updateFirePixels.map(p => this.state.posFireMap[p] || MapItemType.None)
    this.updateFirePixels = []
    this.opts.onFiresUpdate(fires)
  }

  addMonster(ownerId: number, pos: PointData, hp: number, type = MonsterType.Axie): MonsterState {
    // Add a new monster to the game state
    const id = curId++
    if (this.state.monsters[id]) {
      console.warn(`Monster with id ${id} already exists, updating position and HP`)
    }
    const monster = {
      id,
      ownerId,
      pos,
      hp,
      type,
      weapons: {
        [MapItemType.Bomb]: 0,
        [MapItemType.Fire]: 0,
      },
    }
    this.state.monsters[id] = monster // Add monster to the state
    this.state.positionMonsterMap[xyToPosition(pos.x, pos.y)] = id // Map position to monster id
    this.state.aliveNumber += 1 // Increment alive monster count

    return monster
  }

  addItem(pos: PointData, itemType: MapItemType) {
    const pixelPos = xyToPosition(pos.x, pos.y)
    this.state.positionItemMap[pixelPos] = itemType // Map position to item type
  }

  receiveAction(action: ArenaAction) {
    // TODO check monster alive

    // Count 
    // Override previous action
    const index = this.state.executedOrder.indexOf(action.id)
    if (index >= 0) {
      // If the action id already exists, remove it from the executed order
      this.state.executedOrder.splice(index, 1)
    }
    // Add to the last
    this.state.executedOrder.push(action.id)
    // Update action
    this.state.roundActions[action.id] = action

    console.log(`executedOrder: ${this.state.executedOrder}, aliveNumber: ${this.state.aliveNumber}`)

    // if all done
    if (this.state.executedOrder.length == 1) {
      console.log('All actions have been made for the round, execute')
      const { appliedActions, changedStates } = this.processActions() // Process all actions
      setTimeout(() => {
        console.log('Processing actions for the round:', appliedActions, changedStates)
        this.nextRound(appliedActions, changedStates) // Proceed to the next round
      }, 100) // Delay for processing actions
    } else {
      console.log(`Action received: ${action.actionType} by monster ${action.id}`)
    }
  }

  private processActions(): { appliedActions: ArenaAction[], changedStates: MonsterState[] } {
    // Process all actions for the current round
    const appliedActions: ArenaAction[] = []
    const updatedMonsterIds = new Set<number>()

    // Process move actions first
    for (const id of this.state.executedOrder) {
      const action = this.state.roundActions[id]
      if (action.actionType === ActionType.Move) {
        const executed = this.processMoveAction(action, updatedMonsterIds)
        if (executed) {
          appliedActions.push(executed)
        } else {
          console.warn(`Move action for monster ${action.id} was not executed due to invalid position`)
        }
      }
    }

    // Process shoot actions
    for (const id of this.state.executedOrder) {
      const action = this.state.roundActions[id]
      if (action.actionType === ActionType.Shoot || action.actionType === ActionType.ShootBomb || action.actionType === ActionType.ShootFire) {
        const executed = this.processShootAction(action, updatedMonsterIds)
        if (executed) {
          appliedActions.push(executed)
        }
      }
    }

    // Apply fires
    this.applyFires(updatedMonsterIds)

    const changedStates = Array.from(updatedMonsterIds).map(id => ({...this.state.monsters[id]}))

    return { appliedActions, changedStates }
  }

  private processMoveAction(action: ArenaAction, updatedMonsterIds: Set<number>): ArenaAction | undefined {
    // Logic to move the monster based on the action
    const monster = this.state.monsters[action.id]
    if (!monster) {
      console.warn(`Monster ${action.id} not found for move action`)
      return
    }

    // Check if target position is empty
    const targetPos = xyToPosition(action.target.x, action.target.y)
    if (this.state.positionMonsterMap[targetPos] !== undefined) {
      return
    }

    // Move the monster to the new position
    const prevPos = xyToPosition(monster.pos.x, monster.pos.y)
    // Remove previous position from map
    delete this.state.positionMonsterMap[prevPos]
    this.state.positionMonsterMap[targetPos] = action.id // Update position map

    monster.pos = action.target // Update position
    console.log(`Monster ${action.id} moved to ${action.target.x}, ${action.target.y}`)

    // check if received items
    if (this.state.positionItemMap[targetPos] !== undefined && monster.vehicle === undefined) {
      const itemType = this.state.positionItemMap[targetPos]
      console.log(`Monster ${action.id} received item ${itemType} at position (${action.target.x}, ${action.target.y})`)
      // Handle item pickup logic here if needed
      delete this.state.positionItemMap[targetPos] // Remove item from map after pickup
      this.pickupItem(monster, itemType) // Process item pickup
      updatedMonsterIds.add(monster.id)

      // item updated at this position
      this.updatedItemPixels.push(targetPos)
    }

    return action
  }

  private pickupItem(monster: MonsterState, itemType: MapItemType) {
    // Logic to handle item pickup by a monster
    if (itemType === MapItemType.Car) {
      monster.vehicle = itemType // Update monster's vehicle type
    } else if (itemType === MapItemType.Bomb || itemType === MapItemType.Fire) {
      // Increment the weapon count for the monster
      // const type = itemType === MapItemType.Bomb ? ActionType.ShootBomb : ActionType.ShootFire
      monster.weapons[itemType] += 1
      console.log(`Monster ${monster.id} picked up a ${itemType}, total: ${monster.weapons[itemType]}`)
    }
  }

  private processShootAction(action: ArenaAction, updatedMonsterIds: Set<number>): ArenaAction | undefined {
    const { monsters, positionMonsterMap } = this.state
    const monster = monsters[action.id]
    if (!monster) {
      console.warn(`Monster ${action.id} not found for shoot action`)
      return
    }

    // Update weapons
    if (action.actionType === ActionType.ShootBomb || action.actionType === ActionType.ShootFire) {
      const weaponType = action.actionType === ActionType.ShootBomb ? MapItemType.Bomb : MapItemType.Fire
      if (monster.weapons[weaponType] <= 0) return
      monster.weapons[weaponType]--
      updatedMonsterIds.add(action.id)
    }

    // this.applyActionShoot()

    // const damageArea = damgeAreas[action.actionType]
    // const { x, y, w, h } = damageArea || { x: 0, y: 0, w: 0, h: 0 }
    // const pixels = damageArea ? getAreaPixels({x: action.target.x + x, y: action.target.y + y, w, h}) : []

    // for (const pixel of pixels) {
    //   if (positionMonsterMap[pixel] !== undefined) {
    //     const monsterId = positionMonsterMap[pixel]
    //     this.monsterGotHit(monsterId)

    //     updatedMonsterIds.add(monsterId) // Track updated monster ids
    //   }
    // }

    if (action.actionType === ActionType.ShootFire) {
      this.addFire(action.id, action.target)
    } else {
      this.applyActionShoot(action, updatedMonsterIds)
    }

    return action
  }

  private applyActionShoot(action: ArenaAction, updatedMonsterIds: Set<number>) {
    const { positionMonsterMap } = this.state
    const { target, actionType } = action

    const damageArea = damgeAreas[actionType]
    const { x, y, w, h } = damageArea || { x: 0, y: 0, w: 0, h: 0 }
    const pixels = damageArea ? getAreaPixels({x: target.x + x, y: target.y + y, w, h}) : []

    for (const pixel of pixels) {
      if (positionMonsterMap[pixel] !== undefined) {
        const monsterId = positionMonsterMap[pixel]
        this.monsterGotHit(monsterId)

        updatedMonsterIds.add(monsterId) // Track updated monster ids
      }
    }
  }

  private addFire(monsterId: number, p: PointData) {
    const monster = this.state.monsters[monsterId]
    if (!monster) return
    const fire: FireOnMap = { pos: p, ownerId: monster.ownerId, living: 3 }
    this.state.fires.push(fire)

    const pixel = xyToPosition(p.x, p.y)
    this.state.posFireMap[pixel] = fire

    this.updateFirePixels.push(pixel)
  }

  private applyFires(updatedMonsterIds: Set<number>) {
    for (const fire of this.state.fires) {
      this.applyActionShoot({actionType: ActionType.ShootFire, target: fire.pos, id: 0}, updatedMonsterIds)
      fire.living --
    }

    // remove
    this.state.fires = this.state.fires.filter(f => {
      if (f.living > 0) return true

      const pixel = xyToPosition(f.pos.x, f.pos.y)
      delete this.state.posFireMap[pixel]
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
      console.log(`Monster ${monsterId} has been defeated`)
      delete this.state.positionMonsterMap[xyToPosition(monster.pos.x, monster.pos.y)]
      // delete this.state.monsters[monsterId]
      this.state.aliveNumber -= 1
    } else {
      console.log(`Monster ${monsterId} hit, remaining HP: ${monster.hp}`)
    }
  }
}
