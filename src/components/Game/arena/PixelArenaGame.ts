import { PointData } from "pixi.js";

import { getAreaPixels, xyToPosition } from "../utils";
import {
  ActionType,
  ArenaAction,
  ArenaGameState,
  FireOnMap,
  GameMode,
  MapItemType,
  MonsterState,
  MonsterType,
  shootActions,
  shootWeapons,
} from "./types";
import { damgeAreas } from "./constants";

let curId = 0;

interface PixelArenaGameOpts {
  onNextRound: (actions: ArenaAction[], states: MonsterState[]) => void;
  onItemsUpdate: (items: [number, MapItemType][]) => void;
  onFiresUpdate: (fires: FireOnMap[]) => void;
}

// Game server logic for Pixel Arena
// This class handles the game state and actions for the Pixel Arena game.
export class PixelArenaGame {
  private updatedItemPixels: number[] = [];
  // private updateFirePixels: number[] = [];

  private gameMode = GameMode.AllMove;
  private roundOwnerLastMove: { [ownerId: number]: number } = {}; // ownerId -> monsterId

  constructor(public state: ArenaGameState, private opts: PixelArenaGameOpts) {
    // The game object can be used to access game state, methods, etc.
    // For example, you might want to initialize some game settings here.
  }

  setMode(mode: GameMode) {
    this.gameMode = mode;
  }

  start() {
    // Logic to start the game
    console.log("Game started");

    this.addTeam0();
    // this.addTeam1();

    const itemsArray: [number, MapItemType][] = [];
    for (let x = 3; x < 27; x += 2) {
      const item = this.addItem({ x, y: 14 }, MapItemType.Rocket);
      itemsArray.push(item);
    }
    for (let x = 3; x < 27; x += 2) {
      const item = this.addItem({ x, y: 15 }, MapItemType.Fire);
      itemsArray.push(item);
    }

    this.opts.onItemsUpdate(itemsArray);
  }

  addTeam0() {
    const m1 = this.addMonster(0, { x: 12, y: 3 }, 1); // Example monster
    const m2 = this.addMonster(0, { x: 14, y: 3 }, 6, MonsterType.Hero); // Example monster
    const m3 = this.addMonster(0, { x: 16, y: 3 }, 2, MonsterType.Aqua); // Example monster

    this.opts.onNextRound([], [m1, m2, m3]);
  }

  addTeam1() {
    const m1 = this.addMonster(1, { x: 12, y: 26 }, 1, MonsterType.Tralarelo); // Example monster
    const m2 = this.addMonster(
      1,
      { x: 14, y: 26 },
      1,
      MonsterType.FamilyBrainrot
    ); // Example monster
    const m3 = this.addMonster(
      1,
      { x: 16, y: 26 },
      1,
      MonsterType.TrippiTroppi
    ); // Example monster

    this.opts.onNextRound([], [m1, m2, m3]);
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
    f: (m: MonsterState[], i: [number, MapItemType][], f: FireOnMap[]) => void
  ) {
    const monsters = Object.values(this.state.monsters);
    const items: [number, MapItemType][] = Object.entries(
      this.state.positionItemMap
    ).map(([pos, type]) => [Number(pos), type]);
    const fires = this.state.fires;

    f(monsters, items, fires);
  }

  stop() {
    // Logic to stop the game
    console.log("Game stopped");
  }

  private nextRound(actions: ArenaAction[], monsters: MonsterState[] = []) {
    // Logic to advance to the next round
    this.state.currentRound += 1
    console.log(`Advancing to round ${this.state.currentRound}`)
    this.state.roundActions = {} // Reset actions for the new round
    this.state.executedOrder = [] // Reset done actions count
    this.roundOwnerLastMove = {}

    this.opts.onNextRound(actions, monsters) // Process actions and notify the next round
    this.sendUpdatedItems();
    this.sendUpdatedFires();

    // Remove dead monsters
    Object.values(this.state.monsters)
      .filter((m) => m.hp <= 0)
      .forEach((m) => delete this.state.monsters[m.id]);
    this.removeEmptyFires()
  }

  private sendUpdatedItems() {
    const items: [number, MapItemType][] = this.updatedItemPixels.map((p) => [
      p,
      this.state.positionItemMap[p],
    ]);

    this.updatedItemPixels = [];
    this.opts.onItemsUpdate(items);
  }

  private sendUpdatedFires() {
    const fires = this.state.fires
    this.opts.onFiresUpdate(fires);
  }

  private isRoundActionsDone() {
    switch (this.gameMode) {
      case GameMode.InstantMove:
        return this.isInstantMoveDone();
      case GameMode.EachPlayerMove:
        return this.isEachPlayerMoveDone();
      case GameMode.AllMove:
        return this.isAllMoveDone();
    }
  }

  private isInstantMoveDone() {
    return true;
  }

  // Check if all players made the move for current round
  private isEachPlayerMoveDone() {
    const playerSet = new Set<number>();
    Object.values(this.state.monsters).forEach((m) => playerSet.add(m.ownerId));

    return Object.keys(this.roundOwnerLastMove).length === playerSet.size;
  }

  private isAllMoveDone() {
    return this.state.executedOrder.length >= this.state.aliveNumber;
  }

  addMonster(
    ownerId: number,
    pos: PointData,
    hp: number,
    type = MonsterType.Axie
  ): MonsterState {
    // Add a new monster to the game state
    const id = curId++;
    if (this.state.monsters[id]) {
      console.warn(
        `Monster with id ${id} already exists, updating position and HP`
      );
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
    };
    this.state.monsters[id] = monster; // Add monster to the state
    this.state.positionMonsterMap[xyToPosition(pos.x, pos.y)] = id; // Map position to monster id
    this.state.aliveNumber += 1; // Increment alive monster count

    return monster;
  }

  private addItem(
    pos: PointData,
    itemType: MapItemType
  ): [number, MapItemType] {
    const pixelPos = xyToPosition(pos.x, pos.y);
    this.state.positionItemMap[pixelPos] = itemType; // Map position to item type

    return [pixelPos, itemType];
  }

  receiveAction(action: ArenaAction) {
    // TODO check monster alive

    // Count
    // Override previous action
    const index = this.state.executedOrder.indexOf(action.id);
    if (index >= 0) {
      // If the action id already exists, remove it from the executed order
      this.state.executedOrder.splice(index, 1);
    }

    // Execute final blow
    if (action.actionType === ActionType.FinalBlow) {
      this.executeFinalBlow(action)
    // Put to wait list
    } else {
      // Add to the last
      this.state.executedOrder.push(action.id);
      // Update action
      this.state.roundActions[action.id] = action;
      
      // update owner last move (for EachPlayerMove mode)
      const monster = this.state.monsters[action.id];
      if (monster) {
        this.roundOwnerLastMove[monster.ownerId] = action.id;
      }
    }
      
    console.log(
      `executedOrder: ${this.state.executedOrder}, aliveNumber: ${this.state.aliveNumber}`
    );

    // if all done
    if (this.isRoundActionsDone()) {
      console.log("All actions have been made for the round, execute");
      const { appliedActions, changedStates } = this.processActions(); // Process all actions
      setTimeout(() => {
        console.log(
          "Processing actions for the round:",
          appliedActions,
          changedStates
        )
        this.nextRound(appliedActions, changedStates); // Proceed to the next round
      }, 100); // Delay for processing actions
    } else {
      console.log(
        `Action received: ${action.actionType} by monster ${action.id}`
      );
    }
  }

  private getExecuteOrder(): number[] {
    if (this.gameMode !== GameMode.EachPlayerMove) {
      return this.state.executedOrder;
    }

    // EachPlayerMove execute order
    // TODO need to maintain the order same as this.state.executedOrder
    console.log(this.roundOwnerLastMove);
    return Object.values(this.roundOwnerLastMove);
  }

  private processActions(): {
    appliedActions: ArenaAction[]
    changedStates: MonsterState[]
  } {
    // Process all actions for the current round
    const appliedActions: ArenaAction[] = [];
    const updatedMonsterIds = new Set<number>();

    // Process move actions first
    const executeOrder = this.getExecuteOrder();
    for (const id of executeOrder) {
      const action = this.state.roundActions[id];
      if (action.actionType === ActionType.Move) {
        const executed = this.processMoveAction(action, updatedMonsterIds);
        if (executed) {
          appliedActions.push(executed);
        } else {
          console.warn(
            `Move action for monster ${action.id} was not executed due to invalid position`
          );
        }
      }
    }

    // Process shoot actions
    for (const id of executeOrder) {
      const action = this.state.roundActions[id];
      console.log('execute action', action)
      if (
        action.actionType === ActionType.Shoot ||
        action.actionType === ActionType.ShootRocket ||
        action.actionType === ActionType.ShootFire
      ) {
        const executed = this.processShootAction(action, updatedMonsterIds);
        if (executed) {
          appliedActions.push(executed);
        }
      }
    }

    // Apply fires
    this.applyFires(updatedMonsterIds);

    const changedStates = Array.from(updatedMonsterIds).map((id) => ({
      ...this.state.monsters[id],
    }));

    return { appliedActions, changedStates };
  }

  private processMoveAction(
    action: ArenaAction,
    updatedMonsterIds: Set<number>
  ): ArenaAction | undefined {
    // Logic to move the monster based on the action
    const monster = this.state.monsters[action.id];
    if (!monster || monster.hp <= 0) {
      console.warn(`Monster ${action.id} not found or dead for move action`);
      return
    }

    // Check if target position is empty
    const targetPos = xyToPosition(action.target.x, action.target.y);
    if (this.state.positionMonsterMap[targetPos] !== undefined) {
      return
    }

    // Move the monster to the new position
    const prevPos = xyToPosition(monster.pos.x, monster.pos.y);
    // Remove previous position from map
    delete this.state.positionMonsterMap[prevPos];
    this.state.positionMonsterMap[targetPos] = action.id; // Update position map

    monster.pos = action.target; // Update position
    console.log(
      `Monster ${action.id} moved to ${action.target.x}, ${action.target.y}`
    );

    // check if received items
    if (this.state.positionItemMap[targetPos]) {
      const itemType = this.state.positionItemMap[targetPos];
      // Handle item pickup logic here if needed
      if (this.tryPickupItem(monster, itemType)) {
        // Process item pickup
        console.log(
          `Monster ${action.id} received item ${itemType} at position (${action.target.x}, ${action.target.y})`
        );
        delete this.state.positionItemMap[targetPos]; // Remove item from map after pickup
        updatedMonsterIds.add(monster.id);
        // item updated at this position
        this.updatedItemPixels.push(targetPos);
      }
    }

    return action;
  }

  private tryPickupItem(monster: MonsterState, itemType: MapItemType) {
    // Logic to handle item pickup by a monster
    if (itemType === MapItemType.Car && monster.vehicle === MapItemType.None) {
      monster.vehicle = itemType; // Update monster's vehicle type
      return true;
    }
    if (itemType === MapItemType.Rocket || itemType === MapItemType.Fire) {
      // Increment the weapon count for the monster
      monster.weapons[itemType] += 1;
      console.log(
        `Monster ${monster.id} picked up a ${itemType}, total: ${monster.weapons[itemType]}`
      );
      return true;
    }

    return false;
  }

  private processShootAction(
    action: ArenaAction,
    updatedMonsterIds: Set<number>
  ): ArenaAction | undefined {
    const monster = this.state.monsters[action.id];
    console.log('processShootAction', monster, action)
    if (!monster || monster.hp <= 0) {
      console.warn(`Monster ${action.id} not found or dead for shoot action`);
      return;
    }

    // Update weapons
    if (shootWeapons.includes(action.actionType)) {
      const weaponType =
        action.actionType === ActionType.ShootRocket
          ? MapItemType.Rocket
          : action.actionType === ActionType.ShootBomb
          ? MapItemType.Bomb
          : MapItemType.Fire
      if (monster.weapons[weaponType] <= 0) return;
      monster.weapons[weaponType]--;
      updatedMonsterIds.add(action.id);
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
      this.addFire(action.id, action.target);
    } else {
      this.applyShootDamage(action, updatedMonsterIds);
    }

    return action;
  }

  private executeFinalBlow(action: ArenaAction) {
    const monster = this.state.monsters[action.id]
    if (!monster || monster.hp !== 1) return

    // monster.pos = action.target
    const updatedMonsterIds = new Set([monster.id])

    // Final blow equal to a rocket
    this.applyShootDamage({ ...action, actionType: ActionType.ShootRocket }, updatedMonsterIds)
    // Self hit and die
    this.monsterGotHit(action.id, 1)

    const changedStates = Array.from(updatedMonsterIds).map((id) => ({
      ...this.state.monsters[id],
    }))

    // Remove monster
    delete this.state.monsters[action.id]

    // Inform clients
    this.opts.onNextRound([action], changedStates)
    // Add fire
    console.log('executeFinalBlow', monster, monster.weapons[MapItemType.Fire])
    if (monster.weapons[MapItemType.Fire] > 0) {
      this.addFire(action.id, action.target)
      this.sendUpdatedFires()
    }
  }

  private applyShootDamage(
    action: ArenaAction,
    updatedMonsterIds: Set<number>
  ) {
    const { positionMonsterMap } = this.state
    const { target, actionType } = action

    const damageArea = damgeAreas[actionType]
    const { x, y, w, h } = damageArea || { x: 0, y: 0, w: 0, h: 0 }
    const pixels = damageArea
      ? getAreaPixels({ x: target.x + x, y: target.y + y, w, h })
      : [];

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
    const monster = this.state.monsters[monsterId];
    const fire: FireOnMap = { pos: p, ownerId: monster?.ownerId || 0, living: 3 };
    this.state.fires.push(fire);

    const pixel = xyToPosition(p.x, p.y);
    this.state.posFireMap[pixel] = fire;
  }

  private applyFires(updatedMonsterIds: Set<number>) {
    for (const fire of this.state.fires) {
      this.applyShootDamage(
        { actionType: ActionType.ShootFire, target: fire.pos, id: 0 },
        updatedMonsterIds
      );
      fire.living--;
    }
  }

  private removeEmptyFires() {
    // remove
    this.state.fires = this.state.fires.filter((f) => {
      if (f.living > 0) return true;

      const pixel = xyToPosition(f.pos.x, f.pos.y);
      delete this.state.posFireMap[pixel];
      return false;
    });
  }

  private monsterGotHit(monsterId: number, damage = 1) {
    const monster = this.state.monsters[monsterId];
    if (!monster) {
      console.warn(`Monster ${monsterId} not found for hit action`);
      return;
    }

    monster.hp -= damage;
    if (monster.hp <= 0) {
      console.log(`Monster ${monsterId} has been defeated`);
      delete this.state.positionMonsterMap[
        xyToPosition(monster.pos.x, monster.pos.y)
      ];
      // delete this.state.monsters[monsterId]
      this.state.aliveNumber -= 1;
    } else {
      console.log(`Monster ${monsterId} hit, remaining HP: ${monster.hp}`);
    }
  }
}
