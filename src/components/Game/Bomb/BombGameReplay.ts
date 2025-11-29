import { BombNetwork } from './BombNetwork'
import { GameLoop } from './constant'
import { RecordedGame } from './types'

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
    // this.bombNetwork.gameUpdate({ type: 'gameState', state: { pausing } })
  }

  setRecordedGame(recordedGame: RecordedGame) {
    this.recordedGame = recordedGame
    this.replayFrameCount = 0
    this.replayingRound = 0
  }

  jumpToRound(round: number) {
    this.replayingRound = round
    this.replayFrameCount = 0
    this.setPause(true)
    // reset game map
    this.bombNetwork.gameUpdate({ type: 'reset' })
    // play first frame to setup the round
    this.replayUpdate()
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
}
