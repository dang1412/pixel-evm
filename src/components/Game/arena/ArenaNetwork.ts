import { PixelArenaGame } from './PixelArenaGame'
import { PixelArenaMap } from './PixelArenaMap'
import { ActionType, ArenaAction, ArenaGameState, MonsterState } from './types'

export class ArenaNetwork {
  isServer = false
  game?: PixelArenaGame

  constructor(public map: PixelArenaMap) {}

  startServer(addr: string) {
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
        this.map.onNextRound(actions, monsters)
      },
      onFiresUpdate: (fires) => {
        console.log('onFiresUpdate', fires)
        this.map.updateFires(fires)
      },
      onItemsUpdate:(items) => {
        console.log('onItemsUpdate', items)
        this.map.updateMapItems(items)
      },
    })

    this.game.start()
  }

  sendAction(type: ActionType) {
    const action = this.map.updateSelectingMonsterAction(type)
    if (action) this.game?.receiveAction(action)
  }
}
