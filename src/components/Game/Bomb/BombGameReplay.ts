import { BombNetwork } from './BombNetwork'
import { GameLoop } from './constant'
import { BombState, GameState, ItemState, PlayerState, RecordedGame } from './types'

export class BombGameReplay {

  private replayFrameCount = 0
  private replayingRound = 0
  private isPausing = true

  private recordedGame: RecordedGame = {
    gameId: 0,
    data: {}
  }

  constructor(
    private bombNetwork: BombNetwork,
  ) {
    setInterval(() => {
      if (!this.isPausing) {
        this.replayUpdate()
      }
    }, GameLoop)

    bombNetwork.gameUpdate({ type: 'gameState', state: {} })
  }

  setPause(pausing: boolean) {
    this.isPausing = pausing
    this.bombNetwork.gameUpdate({ type: 'gameState', state: { pausing } })
  }

  setRecordedGame(recordedGame: RecordedGame) {
    this.recordedGame = recordedGame
    this.replayFrameCount = 0
    this.replayingRound = 0
    this.bombNetwork.gameUpdate({ type: 'gameState', state: { gameId: this.recordedGame.gameId } })
  }

  jumpToRound(round: number) {
    this.replayingRound = round
    this.replayFrameCount = 0
    this.setPause(true)
    // reset game map
    this.bombNetwork.gameUpdate({ type: 'reset' })
    // set game state
    this.bombNetwork.gameUpdate({ type: 'gameState', state: { round, timeLeft: 100 } })
    // play first frame to setup the round
    this.replayUpdate()
  }

  jumpToFrame(frame: number) {
    const roundData = this.recordedGame.data[this.replayingRound]
    if (!roundData) return

    // Reset to start of round
    this.bombNetwork.gameUpdate({ type: 'reset' })

    // set state at target frame
    const { items, bombs, state, players } = this.stateAtFrame(frame) || { items: [], bombs: [], state: {}, players: [] }
    this.bombNetwork.gameUpdate({ type: 'addItems', items })
    this.bombNetwork.gameUpdate({ type: 'bombs', bombs })
    this.bombNetwork.gameUpdate({ type: 'gameState', state })
    this.bombNetwork.gameUpdate({ type: 'players', players })

    // continue replay from target frame
    this.replayFrameCount = frame
  }

  getCurrentRound(): number {
    return this.replayingRound
  }

  getCurrentFrame(): number {
    return this.replayFrameCount
  }

  getMaxFrame(): number {
    const roundData = this.recordedGame.data[this.replayingRound]
    return roundData?.maxFrame || 0
  }

  isPaused(): boolean {
    return this.isPausing
  }

  private replayUpdate() {
    const roundData = this.recordedGame.data[this.replayingRound]
    if (!roundData || this.replayFrameCount > roundData.maxFrame) {
      this.setPause(true)
      return
    }

    const msgs = roundData[this.replayFrameCount] || []
    for (const { msg } of msgs) {
      this.bombNetwork.gameUpdate(msg)
    }

    this.replayFrameCount++
  }

  private stateAtFrame(frame: number) {
    const roundData = this.recordedGame.data[this.replayingRound]
    if (!roundData) return null

    // calculate items from beginning to target frame
    // gameState
    const state: Partial<GameState> = {}
    const itemsMap: {[pos: number]: ItemState} = {}
    const playersMap: {[id: number]: PlayerState} = {}
    for (let f = 0; f < frame; f++) {
      const msgs = roundData[f] || []
      for (const { msg } of msgs) {
        if (msg.type === 'addItems') {
          // items.push(...msg.items)
          msg.items.forEach(i => { itemsMap[i.pos] = i })
        } else if (msg.type === 'removeItems') {
          for (const caughtItem of msg.items) {
            delete itemsMap[caughtItem.pos]
          }
        } else if (msg.type === 'gameState') {
          Object.assign(state, msg.state)
        } else if (msg.type === 'players') {
          msg.players.forEach(p => { playersMap[p.id] = p })
        }
      }
    }

    // only look back 3 second for performance, because bombs last maximum 3 seconds
    // 1 sec is 5 frames => 3 sec is 15 frames
    const bombStartFrame = Math.max(0, frame - 16)
    const bombsMap: {[pos: number]: BombState} = {}
    for (let f = bombStartFrame; f < frame; f++) {
      const msgs = roundData[f] || []
      for (const { msg } of msgs) {
        if (msg.type === 'bombs') {
          for (const bomb of msg.bombs) {
            if (bomb.live <= 0) {
              delete bombsMap[bomb.pos]
            } else {
              bombsMap[bomb.pos] = bomb
            }
          }
        }
      }
    }

    state.timeLeft = Math.round(100 - frame / 5)

    return {
      items: Object.values(itemsMap),
      bombs: Object.values(bombsMap),
      state,
      players: Object.values(playersMap),
    }
  }
}
