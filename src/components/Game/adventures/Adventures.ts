import { sound } from '@pixi/sound'
import { Assets, Container, Sprite, Spritesheet, Texture } from 'pixi.js'

import { ViewportMap } from '../ViewportMap'
import { PIXEL_SIZE, positionToXY, xyToPosition } from '../utils'
import { Address, SendAllFunc, SendToFunc } from '../hooks/useWebRTCConnects'
import { ActionType, AdventureAction, AdventureStates, AdventureStateUpdates, MonsterState } from './types'
import { AdventureMonster, DrawState, MoveDir } from './Monster'
import { decodeAction, decodeUpdates, encodeAction, encodeUpdates } from './encodes'
import { getMonsterInfo, getMonsterTypes, LOOP_TIME} from './constants'
import { getMonsterPixels, updateCoverPixel, updateRemoveMonster } from './gamelogic/utils'
import { mainLoop } from './gamelogic/mainloop'
import { AttackType } from './gamelogic/types'

export enum ActionMode {
  MOVE,
  SHOOT
}

export interface AdventureOptions {
  sendAll: SendAllFunc
  sendTo: SendToFunc
}

const types = getMonsterTypes()

/**
 * Loading sheet with merging animations from linked sheets
 */
async function loadSpriteSheet(path: string) {
  const sheet = await Assets.load<Spritesheet>(path)
  const linkedSheets = sheet.linkedSheets
  for (const linked of linkedSheets) {
    // sheet.animations.push(...linked.animations)
    sheet.animations = Object.assign(sheet.animations, linked.animations)
  }

  return sheet
}

export interface DragOptions {
  onDrop: (x: number, y: number) => void
  onMove?: (x: number, y: number) => void
  w?: number
  h?: number
}

const controlIcons = ['/svgs/walk.svg', '/svgs/gun.svg']

export class Adventures {
  states: AdventureStates = { posMonster: {}, monsters: {}, coverPixels: {}, monsterIsLeft: {} }
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
      const ids = this.states.posMonster[pos] || []
      const id = ids[0]
      if (id >= 0) {
        const monster = this.monsterMap[id]
        if (monster) {
          this.selectMon(monster)
        }
      }
    })

    sound.add('move', '/sounds/whistle.mp3')
    sound.add('shoot', '/sounds/sword.mp3')
    sound.add('die', '/sounds/char-die.mp3')
    sound.add('explode1', '/sounds/explosion3.mp3')
    sound.add('explode2', '/sounds/explosion4.mp3')
    sound.add('grunt', '/sounds/grunt2.mp3')
    sound.add('running', '/sounds/running.mp3')
    sound.add('a1', '/sounds/sword2.mp3')
    sound.add('a2', '/sounds/sword.mp3')
    sound.add('a3', '/sounds/sword1.mp3')
    sound.add('a4', '/sounds/sword.mp3')
    sound.add('a5', '/sounds/sword.mp3')
    sound.add('a6', '/sounds/sword.mp3')
    sound.add('hurt', '/sounds/grunt2.mp3')

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
    Assets.load<Spritesheet>('/animations/fire3-0.json')
    Assets.load<Spritesheet>('/animations/explosion1.json')
    Assets.load<Spritesheet>('/animations/strike-0.json')
    Assets.load<Spritesheet>('/animations/smash.json')
    Assets.load([...controlIcons, '/images/energy2.png'])
    // await loadSpriteSheet('/animations/megaman/mm-01.json')
    // await loadSpriteSheet('/animations/monster/monster.json')

    const monsterPromises = types.map((t) => loadSpriteSheet(getMonsterInfo(t).spritesheet))
    await Promise.all(monsterPromises)

    const keyPressedMap: {[k: string]: boolean} = {}

    let lastAttackKey = ''
    document.addEventListener('keyup', (e) => {
      keyPressedMap[e.key] = false
      if (e.key === lastAttackKey) lastAttackKey = ''
    })

    document.addEventListener('keydown', (e) => {
      if (!keyPressedMap[e.key]) {
        keyPressedMap[e.key] = true
        proceedMove()
        if (!lastAttackKey && e.key >= '1' && e.key <= '6') {
          lastAttackKey = e.key
          proceedAttack()
        }
      }
    })

    const proceedAttack = () => {
      switch (lastAttackKey) {
        case '1':
          this.selectingMonster?.sendAttack(AttackType.A1)
          break
        case '2':
          this.selectingMonster?.sendAttack(AttackType.A2)
          break
        case '3':
          this.selectingMonster?.sendAttack(AttackType.A3)
          break
        case '4':
          this.selectingMonster?.sendAttack(AttackType.A4)
          break
        case '5':
          this.selectingMonster?.sendAttack(AttackType.A5)
          break
        case '6':
          this.selectingMonster?.sendAttack(AttackType.A6)
          break
      }
    }

    const proceedMove = () => {
      // move
      let dir: MoveDir | undefined = undefined
      const isU = keyPressedMap['w'] || keyPressedMap['ArrowUp']
      const isD = keyPressedMap['s'] || keyPressedMap['ArrowDown']
      const isL = keyPressedMap['a'] || keyPressedMap['ArrowLeft']
      const isR = keyPressedMap['d'] || keyPressedMap['ArrowRight']
      if (isU) {
        dir = isL ? MoveDir.UL : isR ? MoveDir.UR : MoveDir.U
      } else if (isD) {
        dir = isL ? MoveDir.DL : isR ? MoveDir.DR : MoveDir.D
      } else if (isL) {
        dir = MoveDir.L
      } else if (isR) {
        dir = MoveDir.R
      }

      if (dir !== undefined) {
        this.selectingMonster?.move(dir)
      }
    }

    setInterval(() => {
      proceedAttack()
      proceedMove()
    }, LOOP_TIME)

    this.drawControls()
  }

  private drawControls() {
    const SIZE = 40
    const PAD = 10
    const SIZE_PAD = SIZE + PAD

    const ctrlContainer = new Container()
    ctrlContainer.interactive = true
    ctrlContainer.x = PAD
    ctrlContainer.y = this.map.canvas.height - SIZE_PAD

    for (let i = 0; i < controlIcons.length; i++) {
      const icon = controlIcons[i]
      const image = new Sprite(Texture.from(icon))
      const scale = Math.min(SIZE / image.width, SIZE / image.height)
      image.scale.set(scale)
      image.x = i * SIZE_PAD + (SIZE - image.width) / 2
      image.y = (SIZE - image.height) / 2
      ctrlContainer.addChild(image)
    }

    this.map.wrapper.addChild(ctrlContainer)

    ctrlContainer.on('pointerdown', async (e) => {
      const [_, __, rawx] = this.map.getPixelXY(e)
      const i = Math.floor((rawx - PAD) / SIZE_PAD)

      if (i === 0) {
        this.selectingMonster?.startMove()
      } else if (i === 1) {
        this.selectingMonster?.startShoot()
      }
    })
  }

  startDrag(image: string, {onDrop, onMove = (x, y) => {}, w = 0, h = 0}: DragOptions) {
    const shadow = this.map.addImage(image, {x: -1, y: 0, w, h})
    shadow.alpha = 0.4

    const unsub = this.map.subscribe('pixelmove', (e: CustomEvent<[number, number]>) => {
      const [px, py] = e.detail
      shadow.x = px * PIXEL_SIZE
      shadow.y = py * PIXEL_SIZE
      onMove(px, py)
      this.map.markDirty()
    })

    this.map.subscribeOnce('pixelup', (e: CustomEvent<[number, number]>) => {
      const [px, py] = e.detail
      unsub()
      shadow.parent.removeChild(shadow)
      onDrop(px, py)

      this.map.markDirty()
    })
  }

  async loadMonsterList() {
    const monsterContainer = new Container()
    monsterContainer.interactive = true

    const monsterHeight = 70
    monsterContainer.x = this.map.canvas.width - 50
    monsterContainer.y = this.map.canvas.height - types.length * monsterHeight

    for (let i = 0; i < types.length; i++) {
      const monsterInfo = getMonsterInfo(types[i])
      const image = new Sprite(Texture.from(monsterInfo.image))
      const targetHeight = monsterHeight - 5
      image.scale.set(targetHeight / image.height)

      image.y = i * monsterHeight

      monsterContainer.addChild(image)
    }

    this.map.wrapper.addChild(monsterContainer)

    monsterContainer.on('pointerdown', async (e) => {
      const [_, __, rawx, rawy] = this.map.getPixelXY(e)
      const i = Math.floor((rawy - monsterContainer.y) / monsterHeight)
      const type = types[i]
      const { image } = getMonsterInfo(type)

      this.startDrag(image, {
        onDrop: (x, y) => {
          // drop monster
          if (this.isServer) {
            this.addMonster({ id: 0, hp: 10, type, pos: {x, y}, target: {x, y} })
          } else {
            this.sendActionToServer({ id: type, type: ActionType.ONBOARD, pos: {x, y} })
          }
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
      const data = encodeUpdates({monsters: {[state.id]: state}, actions: []})
      if (data) this.options.sendAll(data)
    }
  }

  // Server functions
  receiveAction(action: AdventureAction) {
    if (this.isServer) {
      // server
      if (action.type === ActionType.ONBOARD) {
        const p = action.pos
        this.addMonster({id: 0, hp: 10, type: action.id, target: p, pos: p})
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
    const updates = mainLoop(this.states, this.bufferActions)

    this.resetBuffer()
    
    const data = encodeUpdates(updates)
    if (data) {
      console.log('updates', updates)
      // send updates to clients
      this.options.sendAll(data)
      // server draw updates states
      this.drawUpdates(updates)
    }
  }

  // Server send a client all current states
  sendStates(addr: Address) {
    const data = encodeUpdates({monsters: this.states.monsters, actions: []})
    if (data) this.options.sendTo(addr, data)
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
    }, LOOP_TIME)

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
    for (const { id, type, pos } of actions) {
      if (type === ActionType.SHOOT) {
        const monster = this.monsterMap[id]
        monster.drawAttack(pos)
      }
    }
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
      // update monsterState for client
      if (!this.isServer) this.updateMonsterState(monsterState)
      this.drawMonster(monsterState)
    }
  }

  // update state and postion - only client
  private updateMonsterState(state: MonsterState) {
    const { x, y } = state.pos
    const nextCoverPixels = getMonsterPixels(x, y, state.type)
    updateCoverPixel(this.states, state.id, nextCoverPixels)
    console.log('updateCoverPixel', this.states, state)

    // update state
    this.states.monsters[state.id] = state
  }

  private async drawMonster(monsterState: MonsterState) {
    const monster = this.monsterMap[monsterState.id]
    if (!monster) {
      this.monsterMap[monsterState.id] = new AdventureMonster(this, monsterState)
    } else {
      if (monsterState.hp === 0 && !this.isServer) {
        // client remove monster from states
        updateRemoveMonster(this.states, monsterState.id)
      }

      monster.updateState(monsterState)
    }
  }
}
