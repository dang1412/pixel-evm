import { Address } from '@/lib/RTCConnectClients'

import { getRTCMessageType } from './encode/common'
import { decodeAction, decodeActions, encodeActionsWithType, encodeActionWithType } from './encode/actions'
import { decodeMonstersData, encodeMonstersWithType } from './encode/monsters'
import { decodeMapItems, encodeMapItemsWithType } from './encode/mapItem'
import { decodeFires, encodeBombsWithType, encodeFiresWithType } from './encode/fire'

import { ActionType, ArenaGameState, GameMode, RTCMessageType } from './types'
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

  gameStarted = false

  constructor(public map: PixelArenaMap, private opts?: ArenaNetworkOpts) {}

  setOpts(opts: ArenaNetworkOpts) {
    this.opts = opts
  }

  startServer() {
    this.isServer = true
    const state: ArenaGameState = {
      monsters: {},
      positionItemMap: {},
      fires: [],
      bombs: [],
    }
    this.game = new PixelArenaGame(state, {
      onActionsDone: (actions, monsters) => {
        this.map.onExecutedActions(actions)
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
      onItemsUpdate: (items) => {
        console.log('onItemsUpdate', items)
        this.map.updateMapItems(items)

        // send to clients
        const data = encodeMapItemsWithType(items)
        this.opts?.sendAll(data)
      },
      onBombsUpdate: (bombs) => {
        console.log('onBombsUpdate', bombs)
        this.map.updateBombs(bombs)

        // send to clients
        const data = encodeBombsWithType(bombs)
        this.opts?.sendAll(data)
      },
    })

    this.map.ownerId = 0
    this.game.start()
    
    window.addEventListener('keydown', (e) => {
      if (e.key === '1') {
        this.game?.setMode(GameMode.InstantMove)
      } else if (e.key === '2') {
        this.game?.setMode(GameMode.EachPlayerMove)
      } else if (e.key === '3') {
        this.game?.setMode(GameMode.AllMove)
      } else if (e.key === '4') {
        this.game?.setMode(GameMode.RealTimeMove)
      }
    })
  }

  restart() {
    if (this.game) {
      this.game.restartGame()
    }
  }

  undo() {
    if (this.game) {
      this.game.undo()
    }
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
    const actions = this.map.updateSelectingMonsterAction(type)
    console.log('sendAction', actions, this.opponentAddr)
    if (actions.length) {
      if (this.isServer) {
        for (const action of actions) {
          this.game?.receiveAction(action)
        }
      } else if (this.opponentAddr) {
        // send to server
        const data = encodeActionsWithType(actions)
        this.opts?.sendTo(this.opponentAddr, data)
      }
    }
  }

  receiveData(addr: string, data: ArrayBuffer) {
    const type = getRTCMessageType(data)
    if (this.isServer) {
      // Receive action from client
      // TODO check if valid
      const actions = type === RTCMessageType.Action ? [decodeAction(data)] :
        type === RTCMessageType.Actions ? decodeActions(data) : []

      for (const action of actions) {
        this.game?.receiveAction(action)
      }
      // if (type === RTCMessageType.Action) {
      //   const action = decodeAction(data)
      //   this.game?.receiveAction(action)
      // } else if (type === RTCMessageType.Actions) {
      //   const actions = decodeActions(data)
      //   this.game?.receiveAction(action)
      // }
    } else {
      // Receive updates from server
      // Actions
      if (type === RTCMessageType.Actions) {
        const actions = decodeActions(data)
        this.map.onExecutedActions(actions)
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
      // Bombs
      } else if (type === RTCMessageType.Bombs) {
        const bombs = decodeFires(data)
        this.map.updateBombs(bombs)
      }
    }
  }
}
