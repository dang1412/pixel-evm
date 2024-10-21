import { sound } from '@pixi/sound'

// import { Address, RTCConnectClients, RTCConnectState } from '@/lib/RTCConnectClients'
import { ViewportMap } from '../ViewportMap'
import { ActionType, AdventureAction, AdventureStates, AdventureStateUpdates, MonsterState } from './types'
import { adventureUpdate } from './gameprocess'
// import { decodeAction, decodeAdventureStates, encodeAdventureStates } from './encode'
import { AdventureMonster, positionToXY } from './Monster'
import { decodeAction, decodeUpdates, encodeAction, encodeStates, encodeUpdates } from './encodes'
import { Address, SendAllFunc, SendToFunc } from '../hooks/useWebRTCConnects'
import { Assets, Spritesheet } from 'pixi.js'

export enum ActionMode {
  MOVE,
  SHOOT
}

export interface AdventureOptions {
  sendAll: SendAllFunc
  sendTo: SendToFunc
}

export class Adventures {
  states: AdventureStates = { posMonster: {}, monsters: {} }
  bufferActions: AdventureAction[] = []

  // rtcClients = new RTCConnectClients()
  isServer = false
  serverAddr = ''

  mode = ActionMode.MOVE

  constructor(public map: ViewportMap, private options: AdventureOptions) {
    this.map.subscribe('pixeldown', (e) => {
      const [x, y] = e.detail
      const pos = y * 100 + x
      const id = this.states.posMonster[pos]
      if (id >= 0) {
        const monster = this.monsterMap[id]
        if (monster) monster.startControl()
      }
    })

    sound.add('move', '/sounds/whistle.mp3')
    sound.add('shoot', '/sounds/sword.mp3')
    sound.add('die', '/sounds/char-die.mp3')
    sound.add('explode1', '/sounds/explosion3.mp3')
    sound.add('explode2', '/sounds/explosion4.mp3')
    sound.add('grunt', '/sounds/grunt2.mp3')

    Assets.load<Spritesheet>('/animations/fire3-0.json')
    Assets.load<Spritesheet>('/animations/explosion1.json')
    Assets.load<Spritesheet>('/animations/strike-0.json')
    Assets.load<Spritesheet>('/animations/smash.json')
  }

  loadMonsters(monsterStates: MonsterState[]) {
    console.log('loadMonsters', monsterStates)
    // for (const monsterState of monsterStates) {
    //   this.states.monsters[monsterState.id] = monsterState
    //   this.states.posMonster[monsterState.pos] = monsterState.id
    // }
    this.drawMonsters(monsterStates)
  }

  // Server functions

  receiveAction(action: AdventureAction) {
    if (this.isServer) {
      // server
      this.bufferActions.push(action)
    } else if (this.serverAddr) {
      // client
      const encode = encodeAction(action)
      this.options.sendTo(this.serverAddr as Address, encode)
      console.log('Send action to server', this.serverAddr, encode)
    }
  }

  private resetBuffer() {
    this.bufferActions = []
  }

  // server
  private applyBufferActions() {
    if (this.bufferActions.length === 0) return

    console.log('applyBufferActions', this.bufferActions)
    const updates = adventureUpdate(this.states, this.bufferActions)
    console.log(updates)

    this.resetBuffer()

    // send updates to clients
    const data = encodeUpdates(updates)
    this.options.sendAll(data)

    // draw updates states
    this.drawUpdates(updates)
  }

  // Server send a client all current states
  sendStates(addr: Address) {
    const data = encodeUpdates({monsters: this.states.monsters, actions: []})
    this.options.sendTo(addr, data)
  }

  // Server receives action from client
  receiveActionData(data: ArrayBuffer) {
    const action = decodeAction(data)
    this.receiveAction(action)
  }

  // Client receives updates from server
  receiveUpdatesData(data: ArrayBuffer) {
    const updates = decodeUpdates(data)
    this.drawUpdates(updates)
  }

  startServer() {
    // apply buffer actions periodically
    setInterval(() => {
      this.applyBufferActions()
    }, 500)

    this.isServer = true
  }

  private async drawUpdates(updates: AdventureStateUpdates) {
    const { monsters, actions } = updates
    // draw actions shoot
    await this.drawActions(actions)
    // draw move, hp...
    this.drawMonsters(Object.values(monsters))
  }

  private async drawActions(actions: AdventureAction[]) {
    const shoots: Promise<void>[] = []
    for (const { id, type, val } of actions) {
      if (type === ActionType.SHOOT) {
        const monster = this.monsterMap[id]
        const [x, y] = positionToXY(val)
        shoots.push(monster.shoot(x, y))
      }
    }

    await Promise.all(shoots)
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
      this.updateMonsterState(monsterState)
      this.drawMonster(monsterState)
    }
  }

  private updateMonsterState(state: MonsterState) {
    const curState = this.states.monsters[state.id]
    const oldPos = curState? curState.pos : -1
    if (oldPos >= 0 && this.states.posMonster[oldPos] === state.id) {
      // delete old pos
      delete this.states.posMonster[oldPos]
    }

    // update state
    this.states.monsters[state.id] = state
    this.states.posMonster[state.pos] = state.id
  }

  private async drawMonster(monsterState: MonsterState) {
    const monster = this.monsterMap[monsterState.id]
    if (!monster) {
      this.monsterMap[monsterState.id] = new AdventureMonster(this, monsterState)
      // this.states.monsters[monsterState.id] = monsterState
      // this.states.posMonster[monsterState.pos] = monsterState.id
    } else {
      if (monsterState.hp === 0) {
        this.remove(monsterState.id)
      } else {
        monster.updateState(monsterState)
      }
    }
  }

  private remove(id: number) {
    // remove from states
    const removeMonster = this.states.monsters[id]
    if (removeMonster) {
      const pos = removeMonster.pos
      if (this.states.posMonster[pos] === id) {
        delete this.states.posMonster[pos]
      }
      delete this.states.monsters[id]
    }

    // remove draw
    const monster = this.monsterMap[id]
    if (monster) monster.remove()
  }

}
