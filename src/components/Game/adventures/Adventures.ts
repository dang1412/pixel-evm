import { Address, RTCConnectClients } from '@/lib/RTCConnectClients'
import { ViewportMap } from '../ViewportMap'
import { ActionType, AdventureAction, AdventureStates } from './types'
import { adventureUpdate } from './gameprocess'
import { decodeAction, decodeAdventureStates, encodeAdventureStates } from './encode'

export class Adventures {
  states: AdventureStates = { posMonster: {}, monsterPos: {}, monsters: {}, actions: [] }
  bufferActions: AdventureAction[] = []

  rtcClients = new RTCConnectClients()

  isServer = false

  constructor(map: ViewportMap) {}

  // Server functions

  receiveAction(action: AdventureAction) {
    this.bufferActions.push(action)
  }

  resetBuffer() {
    this.bufferActions = []
  }

  applyBufferActions() {
    const updates = adventureUpdate(this.states, this.bufferActions)

    this.resetBuffer()

    // send updates to clients
    const data = encodeAdventureStates(updates)
    this.rtcClients.sendAll(data)

    // draw updates actions

    // draw updates states
  }

  startServer() {
    this.rtcClients.onReceiveData = (addr, data) => {
      if (typeof data === 'string') {

      } else {
        // decode action
        const action = decodeAction(data)
        console.log('Receive action', addr, action)
        this.receiveAction(action)
      }
    }

    this.rtcClients.onConnect = (addr) => {
      console.log('Connected from', addr)
      // send current game states
      const data = encodeAdventureStates(this.states)
      this.rtcClients.sendTo(addr, data)
    }

    // start listening for connect
    this.rtcClients.waitForConnect()

    // apply buffer actions periodically
    setInterval(() => {
      this.applyBufferActions()
    }, 1000)

    this.isServer = true
  }

  // client function
  connectToServer(addr: Address) {
    // receive updates from server
    this.rtcClients.onReceiveData = (addr, data) => {
      if (typeof data === 'string') {

      } else {
        // decode updates
        const updates = decodeAdventureStates(data)
        console.log('Receive updates', addr, data)

        // draw actions

        // draw updates
      }
    }

    // offer connect to addr
    this.rtcClients.offerConnectTo(addr)
  }

  async drawActions(actions: AdventureAction[]) {
  }

  async drawAllStates() {
    this.drawStates(this.states)
  }

  async drawStates(states: AdventureStates) {
  }
}
