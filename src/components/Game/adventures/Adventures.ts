import { Address, RTCConnectClients } from '@/lib/RTCConnectClients'
import { ViewportMap } from '../ViewportMap'
import { ActionType, AdventureAction, AdventureStates, AdventureStateUpdates, MonsterState } from './types'
import { adventureUpdate } from './gameprocess'
// import { decodeAction, decodeAdventureStates, encodeAdventureStates } from './encode'
import { AdventureMonster, positionToXY } from './Monster'
import { decodeAction, decodeUpdates, encodeStates, encodeUpdates } from './encodes'

export enum ActionMode {
  MOVE,
  SHOOT
}

export class Adventures {
  states: AdventureStates = { posMonster: {}, monsters: {} }
  bufferActions: AdventureAction[] = []

  rtcClients = new RTCConnectClients()
  isServer = false

  mode = ActionMode.MOVE

  constructor(public map: ViewportMap) {
    this.map.subscribe('pixeldown', (e) => {
      const [x, y] = e.detail
      const pos = y * 100 + x
      const id = this.states.posMonster[pos]
      if (id >= 0) {
        const monster = this.monsterMap[id]
        if (monster) monster.startControl()
      }
    })
  }

  loadMonsters(monsterStates: MonsterState[]) {
    console.log('loadMonsters', monsterStates)
    for (const monsterState of monsterStates) {
      this.states.monsters[monsterState.id] = monsterState
      this.states.posMonster[monsterState.pos] = monsterState.id
    }
    this.drawMonsters(monsterStates)
  }

  // Server functions

  receiveAction(action: AdventureAction) {
    this.bufferActions.push(action)
  }

  resetBuffer() {
    this.bufferActions = []
  }

  applyBufferActions() {
    if (this.bufferActions.length === 0) return

    console.log('applyBufferActions', this.bufferActions)
    const updates = adventureUpdate(this.states, this.bufferActions)
    console.log(updates)

    this.resetBuffer()

    // send updates to clients
    const data = encodeUpdates(updates)
    this.rtcClients.sendAll(data)

    // draw updates states
    this.drawUpdates(updates)
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
      const data = encodeStates(this.states)
      this.rtcClients.sendTo(addr, data)
    }

    // start listening for connect
    this.rtcClients.waitForConnect()

    // apply buffer actions periodically
    setInterval(() => {
      this.applyBufferActions()
    }, 500)

    this.isServer = true
  }

  // client function
  connectToServer(addr: Address) {
    // receive updates from server
    this.rtcClients.onReceiveData = (addr, data) => {
      if (typeof data === 'string') {

      } else {
        // decode updates
        const updates = decodeUpdates(data)
        console.log('Receive updates', addr, data)

        // draw updates
        this.drawUpdates(updates)
      }
    }

    // offer connect to addrl
    this.rtcClients.offerConnectTo(addr)
  }

  async drawUpdates(updates: AdventureStateUpdates) {
    const { monsters, actions } = updates
    this.drawActions(actions)
    this.drawMonsters(Object.values(monsters))
  }

  private async drawActions(actions: AdventureAction[]) {
    for (const { id, type, val } of actions) {
      if (type === ActionType.SHOOT) {
        const monster = this.monsterMap[id]
        const [x, y] = positionToXY(val)
        monster.shoot(x, y)
      }
    }
  }

  async syncStates() {
    const monsters = Object.values(this.states.monsters)
    await this.drawMonsters(monsters)
  }

  monsterMap: {[id: number]: AdventureMonster} = {}
  selectingMonster: AdventureMonster | undefined

  selectMon(monster: AdventureMonster) {
    if (this.selectingMonster && this.selectingMonster !== monster) {
      this.selectingMonster.select(false)
    }

    monster.select(true)
    this.selectingMonster = monster
  }
  
  private async drawMonsters(monsterStates: MonsterState[]) {
    for (const monsterState of monsterStates) {
      this.drawMonster(monsterState)
    }
  }

  private async drawMonster(monsterState: MonsterState) {
    const monster = this.monsterMap[monsterState.id]
    if (!monster) {
      this.monsterMap[monsterState.id] = new AdventureMonster(this, monsterState)
    } else {
      monster.updateState(monsterState)
    }
  }

}
