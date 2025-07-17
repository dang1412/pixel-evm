import { Address } from '@/lib/RTCConnectClients'

import { getRTCMessageType } from './encode/common'
import { decodeAction, decodeActions, encodeActionsWithType, encodeActionWithType } from './encode/actions'
import { decodeMonstersData, encodeMonstersWithType } from './encode/monsters'
import { decodeMapItems, encodeMapItemsWithType } from './encode/mapItem'
import { decodeFires, encodeFiresWithType } from './encode/fire'

import { ActionType, ArenaGameState, RTCMessageType } from './types'
import { PixelArenaGame } from './PixelArenaGame'
import { PixelArenaMap } from './PixelArenaMap'


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

        const monstersData = encodeMonstersWithType(monsters)
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
    this.game.start()
    // this.game.addTeam0()
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
        this.game.getAllStates((monsters, items, fires) => {
          const data1 = encodeMonstersWithType(monsters)
          this.opts?.sendTo(addr, data1)

          const data2 = encodeFiresWithType(fires)
          this.opts?.sendTo(addr, data2)

          const data3 = encodeMapItemsWithType(items)
          this.opts?.sendTo(addr, data3)
        })

        this.game.addTeam1()
      } else {
        this.map.ownerId = 1
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
