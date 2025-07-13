import { Address } from '@/lib/RTCConnectClients'

import { decodeAction, decodeActions, encodeAction, encodeActionsWithType, encodeActionWithType } from './encode/actions'
import { getRTCMessageType, setRTCMessageType } from './encode/common'
import { decodeMonstersData, encodeMonsters } from './encode/monsters'
import { PixelArenaGame } from './PixelArenaGame'
import { PixelArenaMap } from './PixelArenaMap'
import { ActionType, ArenaAction, ArenaGameState, FireOnMap, MapItemType, MonsterState, RTCMessageType } from './types'
import { decodeMapItems, encodeMapItemsWithType } from './encode/mapItem'
import { decodeFires, encodeFiresWithType } from './encode/fire'


export interface ArenaNetworkOpts {
  sendTo: (addr: Address, data: ArrayBuffer) => void,
  sendAll: (data: ArrayBuffer) => void
}

export class ArenaNetwork {
  isServer = false
  game?: PixelArenaGame

  addrToIdMap: {[addr: Address]: number} = {}
  opponentAddr?: Address

  constructor(public map: PixelArenaMap, private opts?: ArenaNetworkOpts) {}

  setOpts(opts: ArenaNetworkOpts) {
    this.opts = opts
  }

  startServer(addr: Address) {
    this.isServer = true
    this.addrToIdMap[addr] = 0
    const state: ArenaGameState = {
      monsters: {},
      positionMonsterMap: {},
      roundActions: {},
      currentRound: 0,
      aliveNumber: 0,
      executedOrder: [],
      positionItemMap: {},

      fires: [],
      posFireMap: {}
    }
    this.game = new PixelArenaGame(state, {
      onNextRound: (actions, monsters) => {
        this.map.onNextRound(actions)
        this.map.updateMonsterStates(monsters)

        // send to clients
        const actionsData = encodeActionsWithType(actions)
        this.opts?.sendAll(actionsData)

        const monstersData = encodeMonsters(monsters)
        setRTCMessageType(monstersData, RTCMessageType.MonsterStates)
        this.opts?.sendAll(monstersData)
      },
      onFiresUpdate: (fires) => {
        console.log('onFiresUpdate', fires)
        this.map.updateFires(fires)

        // send to clients
        const data = encodeFiresWithType(fires)
        this.opts?.sendAll(data)
      },
      onItemsUpdate:(items) => {
        console.log('onItemsUpdate', items)
        this.map.updateMapItems(items)

        // send to clients
        const data = encodeMapItemsWithType(items)
        this.opts?.sendAll(data)
      },
    })

    this.map.ownerId = 0
    this.game.addTeam0()
    // this.game.getAllStates((monsters, items, fires) => {
    //   this.map.updateMonsterStates(monsters)
    //   this.map.updateMapItems(items)
    //   this.map.updateFires(fires)
    // })
  }

  // sendAllStates(monsters: MonsterState[], items: [number, MapItemType][], fires: FireOnMap[]) {
  //   // Update client on server
  //   this.map.updateMonsterStates(monsters)
  //   this.map.updateMapItems(items)
  //   this.map.updateFires(fires)

  //   // Other clients
  //   const data = encodeMonsters(monsters)
  //   setRTCMessageType(data, RTCMessageType.MonsterStates)
  //   this.opts?.sendTo(addr, data)
  // }

  connected(addr: Address) {
    if (!this.opponentAddr) {
      this.opponentAddr = addr
      if (this.isServer && this.game) {
        this.addrToIdMap[addr] = 1
        this.game.addTeam1()
        // this.game.getAllStates((monsters, items, fires) => {
        //   const data = encodeMonsters(monsters)
        //   setRTCMessageType(data, RTCMessageType.MonsterStates)
        //   this.opts?.sendTo(addr, data)
        //   this.map.updateMonsterStates(monsters)
        //   this.map.updateMapItems(items)
        //   this.map.updateFires(fires)
        // })
      } else {
        this.addrToIdMap[addr] = 0
      }
    }
  }

  sendAction(type: ActionType) {
    const action = this.map.updateSelectingMonsterAction(type)
    console.log('sendAction', action, this.opponentAddr)
    if (action) {
      if (this.isServer) {
        this.game?.receiveAction(action)
      } else if (this.opponentAddr) {
        // send to server
        const data = encodeActionWithType(action)
        this.opts?.sendTo(this.opponentAddr, data)
      }
    }
  }

  receiveData(addr: string, data: ArrayBuffer) {
    const type = getRTCMessageType(data)
    if (this.isServer) {
      // action
      if (type === RTCMessageType.Action) {
        const action = decodeAction(data)
        this.game?.receiveAction(action)
      }
    } else {
      // Actions
      if (type === RTCMessageType.Actions) {
        const actions = decodeActions(data)
        this.map.onNextRound(actions)
      // Monsters
      } else if (type === RTCMessageType.MonsterStates) {
        const monsters = decodeMonstersData(data)
        this.map.updateMonsterStates(monsters)
      // MapItems
      } else if (type === RTCMessageType.MapItems) {
        const items = decodeMapItems(data)
        this.map.updateMapItems(items)
      // Fires
      } else if (type === RTCMessageType.Fires) {
        const fires = decodeFires(data)
        this.map.updateFires(fires)
      }
    }
  }
}
