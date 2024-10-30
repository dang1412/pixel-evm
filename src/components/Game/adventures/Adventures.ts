import { sound } from '@pixi/sound'
import { Assets, Container, Sprite, Spritesheet, Texture } from 'pixi.js'

import { PIXEL_SIZE, positionToXY, ViewportMap, xyToPosition } from '../ViewportMap'
import { Address, SendAllFunc, SendToFunc } from '../hooks/useWebRTCConnects'
import { ActionType, AdventureAction, AdventureStates, AdventureStateUpdates, MonsterState, MonsterType } from './types'
import { adventureUpdate } from './gameprocess'
import { AdventureMonster, DrawState } from './Monster'
import { decodeAction, decodeUpdates, encodeAction, encodeUpdates } from './encodes'
import { getMonsterInfo, getMonsterTypes, monsterInfos } from './constants'

export enum ActionMode {
  MOVE,
  SHOOT
}

export interface AdventureOptions {
  sendAll: SendAllFunc
  sendTo: SendToFunc
}

const types = getMonsterTypes()

async function loadSpriteSheet(path: string) {
  const sheet = await Assets.load<Spritesheet>(path)
  const linkedSheets = sheet.linkedSheets
  for (const linked of linkedSheets) {
    // sheet.animations.push(...linked.animations)
    sheet.animations = Object.assign(sheet.animations, linked.animations)
  }

  return sheet
}

export class Adventures {
  states: AdventureStates = { posMonster: {}, monsters: {} }
  bufferActions: AdventureAction[] = []

  // rtcClients = new RTCConnectClients()
  isServer = false
  serverAddr = ''

  mode = ActionMode.MOVE

  // lastId
  lastId = 0

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

    // map.options.onDrop = (data, px, py) => {
    //   const type = Number(data.getData('monsterType')) as MonsterType
    //   const pos = xyToPosition(px, py)
    //   if (this.isServer) {
    //     if (this.states.posMonster[pos] === undefined) this.addMonster({ id: 0, hp: 10, type, pos })
    //   } else {
    //     this.sendActionToServer({ id: type, type: ActionType.ONBOARD, val: pos })
    //   }
    // }
  }

  async init() {
    const fire3 = await Assets.load<Spritesheet>('/animations/fire3-0.json')
    console.log('Fire3', fire3)
    Assets.load<Spritesheet>('/animations/explosion1.json')
    Assets.load<Spritesheet>('/animations/strike-0.json')
    Assets.load<Spritesheet>('/animations/smash.json')
    Assets.load('/images/energy2.png')
    // await Assets.load<Spritesheet>('/animations/megaman/mm-01.json')
    await loadSpriteSheet('/animations/megaman/mm-01.json')

    const monsterPromises = types.map((t) => {if (t !== MonsterType.MEGAMAN) Assets.load(getMonsterInfo(t).image)})
    await Promise.all(monsterPromises)

    document.addEventListener('keydown', (e) => {
      switch (e.key) {
        case '1': this.selectingMonster?.changeDrawStateOnce(DrawState.A1); break
        case '2': this.selectingMonster?.changeDrawStateOnce(DrawState.A2); break
        case '3': this.selectingMonster?.changeDrawStateOnce(DrawState.A3); break
        case '4': this.selectingMonster?.changeDrawStateOnce(DrawState.A4); break
        case '5': this.selectingMonster?.changeDrawStateOnce(DrawState.A5); break
      }
    })
  }

  async loadMonsterList() {
    const monsterContainer = new Container()
    monsterContainer.interactive = true

    const monsterHeight = 100
    monsterContainer.x = this.map.canvas.width - 70
    monsterContainer.y = this.map.canvas.height - types.length * monsterHeight

    for (let i = 0; i < types.length; i++) {
      const monsterInfo = getMonsterInfo(types[i])
      const image = new Sprite(Texture.from(monsterInfo.image))
      const targetHeight = monsterHeight - 5
      image.scale.set(targetHeight / image.height)
      // image.width = 55
      // image.height = 

      image.y = i * monsterHeight

      monsterContainer.addChild(image)
    }

    this.map.wrapper.addChild(monsterContainer)

    monsterContainer.on('pointerdown', async (e) => {
      const [_, __, rawx, rawy] = this.map.getPixelXY(e)
      console.log('monsterContainer', rawx, rawy, monsterContainer.x, monsterContainer.y)
      const i = Math.floor((rawy - monsterContainer.y) / monsterHeight)
      const type = types[i]
      // const type = MonsterType.MEGAMAN
      const { image, w, h } = getMonsterInfo(type)

      const shadow = await this.map.addImage(image, {x: 1, y: 1, w: 0, h: 0})
      shadow.alpha = 0.4

      const unsub = this.map.subscribe('pixelmove', (e: CustomEvent<[number, number]>) => {
        const [px, py] = e.detail
        shadow.x = px * PIXEL_SIZE
        shadow.y = py * PIXEL_SIZE
        this.map.markDirty()
      })

      this.map.subscribeOnce('pixelup', (e: CustomEvent<[number, number]>) => {
        const [px, py] = e.detail
        unsub()
        shadow.parent.removeChild(shadow)
        this.map.markDirty()

        // drop monster
        const pos = xyToPosition(px, py)
        if (this.isServer) {
          if (this.states.posMonster[pos] === undefined) this.addMonster({ id: 0, hp: 10, type, pos })
        } else {
          this.sendActionToServer({ id: type, type: ActionType.ONBOARD, val: pos })
        }
      })
    })

    this.map.markDirty()
  }

  addMonsters(monsterStates: MonsterState[]) {
    for (let state of monsterStates) {
      this.addMonster(state)
    }
  }

  addMonster(state: MonsterState) {
    if (this.isServer) {
      state.id = ++this.lastId
      this.updateMonsterState(state)
      this.drawMonster(state)

      // send to clients
      const encode = encodeUpdates({monsters: {[state.id]: state}, actions: []})
      this.options.sendAll(encode)
    }
  }

  // Server functions

  receiveAction(action: AdventureAction) {
    if (this.isServer) {
      // server
      if (action.type === ActionType.ONBOARD) {
        this.addMonster({id: 0, hp: 10, type: action.id, pos: action.val})
      } else {
        this.bufferActions.push(action)
      }
    } else if (this.serverAddr) {
      // client
      this.sendActionToServer(action)
    }
  }

  sendActionToServer(action: AdventureAction) {
    // client
    const encode = encodeAction(action)
    this.options.sendTo(this.serverAddr as Address, encode)
    console.log('Send action to server', this.serverAddr, encode)
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
    }, 200)

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

  // update state and postion
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
