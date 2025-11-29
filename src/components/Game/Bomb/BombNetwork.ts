import { ClientMessage } from '@/providers/types'

import { BombGame } from './BombGame'
import { BombMap } from './BombMap'
import { BombType, GameMessage } from './types'
import { BombGameReplay } from './BombGameReplay'

export class BombNetwork {

  sendTo?: (addr: string, data: string) => void
  sendAll?: (data: string) => void
  notify?: (message: string, type?: 'success' | 'error' | 'info') => void

  private bombGame?: BombGame
  hostWsName?: string
  myWsName?: string

  // for host
  private wsNameToPlayerId: { [wsName: string]: number } = {}

  private gameReplay?: BombGameReplay

  constructor(private bombMap: BombMap) {
    // This is a mock network layer. In a real application,
    // this would involve actual network communication.
    // For now, we'll directly call BombGame methods.
  }

  isHost() {
    return this.bombGame !== undefined
  }

  // host a game
  createGame(sendServer: (msg: ClientMessage) => void) {
    this.hostWsName = this.myWsName
    this.bombGame = new BombGame(this, this.myWsName || '', sendServer)
  }

  createGameReplay() {
    const gameReplay = new BombGameReplay(this)
    this.gameReplay = gameReplay

    return gameReplay
  }

  getBombGame() {
    return this.bombGame
  }

  // for host
  removePlayer(wsName: string) {
    if (this.bombGame) {
      const playerId = this.wsNameToPlayerId[wsName]
      console.log('Removing player', playerId)
      if (playerId !== undefined) {
        this.bombGame.removePlayer(playerId)
      }
    }
  }

  // TODO self receive msg in case of self hosted to reduce duplicate code
  // join game, host or client
  joinGame(name: string) {
    if (this.bombGame) {
      // self hosted
      const newPlayer = this.bombGame.addPlayer(this.myWsName || '', name)
      if (!newPlayer) return

      const players = this.bombGame.getPlayerStates()
      this.handleGameUpdate({ type: 'joinSuccess', players, playerId: newPlayer.id })
      this.wsNameToPlayerId['host'] = newPlayer.id
    } else if (this.hostWsName) {
      // send join request to host
      this.sendToAddr(this.hostWsName, { type: 'join', name })
    }
  }

  // action: place bomb
  placeBomb(playerId: number, x: number, y: number, bombType = BombType.Standard) {
    if (this.bombGame) {
      // host
      const bomb = this.bombGame.addBomb(playerId, x, y, bombType)
      if (bomb) {
        this.bombMap.updateBombs([bomb])
      }
    } else {
      // send add bomb request to host
      this.sendToHost({ type: 'addBomb', playerId, x, y, bombType })
    }
  }

  buyBomb(bombType: BombType, quantity: number) {
    if (this.bombGame) {
      // host
      if (!this.bombMap.playerId) return
      this.bombGame.buyBomb(this.bombMap.playerId, bombType, quantity)
    } else {
      // send buy bomb request to host
      this.sendToHost({ type: 'buyBomb', bombType, quantity })
    }
  }

  private sendToHost(msg: GameMessage) {
    if (this.hostWsName) {
      this.sendToAddr(this.hostWsName, msg)
    }
  }

  private sendToAddr(addr: string, msg: GameMessage) {
    this.sendTo?.(addr, JSON.stringify(msg))
  }

  // for host
  gameUpdate(msg: GameMessage) {
    this.sendAll?.(JSON.stringify(msg))
    this.handleGameUpdate(msg)
  }

  private connected(addr: string) {
    console.log('BombNetwork connected to', addr)
    if (this.bombGame) {
      // host send cilent states
      const { players, items, state } = this.bombGame.getCurrentStates()
      this.sendToAddr(addr, { type: 'players', players })
      this.sendToAddr(addr, { type: 'addItems', items })
      this.sendToAddr(addr, { type: 'gameState', state })

      // notify server about new connection
      this.bombGame.connected(addr)
      this.notify?.('A client has connected: ' + addr, 'info')
    } else {
      // client set host address
      this.hostWsName = addr
      this.notify?.('Connected to host ' + addr, 'info')
    }
  }

  receiveMsg(from: string, data: string) {
    if (data === '_connected_') {
      this.connected(from)
    } else if (data === '_closed_') {
      this.notify?.('Connection closed: ' + from, 'info')
      if (this.isHost()) {
        // remove player
        this.removePlayer(from)
      }
    } else {
      try {
        const msg: GameMessage = JSON.parse(data)
        if (!msg.type) {
          console.warn('Invalid message received:', data)
          return
        }
        this.receiveGameMsg(from, msg)
      } catch (e) {
        console.error('Failed to parse message:', data, e)
      }
    }
  }

  private receiveGameMsg(from: string, msg: GameMessage) {
    switch (msg.type) {
      // host
      case 'join':
        if (this.bombGame) {
          const id = this.wsNameToPlayerId[from]
          const newPlayer = this.bombGame.addPlayer(from, msg.name, id)
          if (!newPlayer) return

          // send playerId
          this.sendToAddr(from, { type: 'joinSuccess', players: [], playerId: newPlayer.id })
          this.wsNameToPlayerId[from] = newPlayer.id
        }
        break
      case 'addBomb':
        if (this.bombGame) {
          // TODO get playerId from wsNameToPlayerId map for security
          const bomb =this.bombGame.addBomb(msg.playerId, msg.x, msg.y, msg.bombType)
          if (bomb) {
            // send bomb update to this player immediately,
            // rather than waiting for the game loop
            this.sendAll?.(JSON.stringify({ type: 'bombs', bombs: [bomb] }))
          }
        }
        break
      case 'buyBomb':
        if (this.bombGame) {
          const playerId = this.wsNameToPlayerId[from]
          this.bombGame.buyBomb(playerId, msg.bombType, msg.quantity)
        }
        break
      // client
      default:
        this.handleGameUpdate(msg)
        break
    }
  }

  private handleGameUpdate(msg: GameMessage) {
    switch (msg.type) {
      case 'joinSuccess':
        console.log('Joined game successfully', msg)
        this.bombMap.playerId = msg.playerId
        this.bombMap.updatePlayers(msg.players)
        break
      case 'bombs':
        this.bombMap.updateBombs(msg.bombs)
        break
      case 'explosions':
        this.bombMap.addExplosions(msg.explosions)
        break
      case 'players':
        this.bombMap.updatePlayers(msg.players)
        break
      case 'addItems':
        for (const item of msg.items) {
          this.bombMap.addItem(item.pos, item)
        }
        break
      case 'removeItems':
        this.bombMap.removeItems(msg.items)
        break
      case 'gameState':
        this.bombMap.updateGameState(msg.state)
        break

      case 'reset':
        this.bombMap.resetGame()
        break
    }
  }
}