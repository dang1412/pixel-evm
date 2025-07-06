import { PointData } from 'pixi.js'

import { xyToPosition } from '../utils'
import { ActionType, ArenaAction, ArenaGameState, MapItemType, MonsterState, MonsterType, VehicleType } from './types'

// Game server logic for Pixel Arena
// This class handles the game state and actions for the Pixel Arena game.
export class PixelArenaGame {
  constructor(public state: ArenaGameState, private onNextRound: (actions: ArenaAction[], states: MonsterState[]) => void) {
    // The game object can be used to access game state, methods, etc.
    // For example, you might want to initialize some game settings here.
  }

  start() {
    // Logic to start the game
    console.log('Game started');
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

    this.onNextRound(actions, monsters) // Process actions and notify the next round
  }

  addMonster(id: number, pos: PointData, hp: number, type: MonsterType): MonsterState {
    // Add a new monster to the game state
    if (this.state.monsters[id]) {
      console.warn(`Monster with id ${id} already exists, updating position and HP`)
    }
    const monster = {
      id,
      pos,
      hp,
      type,
      vehicle: VehicleType.None,
      weapons: {
        [ActionType.ShootBomb]: 0,
        [ActionType.ShootFire]: 0,
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
    if (this.state.executedOrder.length == this.state.aliveNumber) {
      console.log('All actions have been made for the round, execute')
      const { appliedActions, changedStates } = this.processActions() // Process all actions
      setTimeout(() => {
        console.log('Processing actions for the round:', appliedActions)
        this.nextRound(appliedActions, changedStates) // Proceed to the next round
      }, 200) // Delay for processing actions
    } else {
      console.log(`Action received: ${action.actionType} by monster ${action.id}`)
    }
  }

  private processActions(): { appliedActions: ArenaAction[], changedStates: MonsterState[] } {
    // Process all actions for the current round
    const appliedActions: ArenaAction[] = []

    // Process move actions first
    for (const id of this.state.executedOrder) {
      const action = this.state.roundActions[id]
      if (action.actionType === ActionType.Move) {
        const executed = this.processMoveAction(action)
        if (executed) {
          appliedActions.push(executed)
        } else {
          console.warn(`Move action for monster ${action.id} was not executed due to invalid position`)
        }
      }
    }

    const updatedMonsterIds = new Set<number>()

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

    const changedStates = Array.from(updatedMonsterIds).map(id => ({...this.state.monsters[id]}))

    return { appliedActions, changedStates }
  }

  private processMoveAction(action: ArenaAction): ArenaAction | undefined {
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
    if (this.state.positionItemMap[targetPos] !== undefined && monster.vehicle === VehicleType.None) {
      const itemType = this.state.positionItemMap[targetPos]
      console.log(`Monster ${action.id} received item ${itemType} at position (${action.target.x}, ${action.target.y})`)
      // Handle item pickup logic here if needed
      delete this.state.positionItemMap[targetPos] // Remove item from map after pickup
      this.pickupItem(monster, itemType) // Process item pickup
    }

    return action
  }

  private pickupItem(monster: MonsterState, itemType: MapItemType) {
    // Logic to handle item pickup by a monster
    if (itemType === MapItemType.Car) {
      monster.vehicle = VehicleType.Car // Update monster's vehicle type
    } else if (itemType === MapItemType.Bomb || itemType === MapItemType.Fire) {
      // Increment the weapon count for the monster
      const type = itemType === MapItemType.Bomb ? ActionType.ShootBomb : ActionType.ShootFire
      monster.weapons[type] += 1
      console.log(`Monster ${monster.id} picked up a ${itemType}, total: ${monster.weapons[type]}`)
    }
  }

  private processShootAction(action: ArenaAction, updatedMonsterIds: Set<number>): ArenaAction | undefined {
    const { monsters, positionMonsterMap } = this.state
    const monster = monsters[action.id]
    if (!monster) {
      console.warn(`Monster ${action.id} not found for shoot action`)
      return
    }

    const targetPos = xyToPosition(action.target.x, action.target.y)
    if (positionMonsterMap[targetPos] !== undefined) {
      const monsterId = positionMonsterMap[targetPos]
      this.monsterGotHit(monsterId)

      updatedMonsterIds.add(monsterId) // Track updated monster ids
    }

    return action
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
