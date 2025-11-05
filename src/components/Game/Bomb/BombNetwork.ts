import { BombGame } from './BombGame'
import { BombMap } from './BombMap'
import { BombState, BombType, GameState, ItemState, PlayerState } from './types'

type GameMessage = 
  // client to host
  | { type: 'join' }
  | { type: 'addBomb', playerId: number, x: number, y: number, bombType: BombType }

  // host to client
  | { type: 'joinSuccess', players: PlayerState[], playerId: number }
  | { type: 'bombs', bombs: BombState[] }
  | { type: 'explosions', explosions: number[] }
  | { type: 'addItems', items: ItemState[] }
  | { type: 'removeItems', positions: number[] }
  | { type: 'players', players: PlayerState[] }

  | { type: 'gameState', state: GameState }

export class BombNetwork {
  
  sendTo?: (addr: string, data: string) => void
  sendAll?: (data: string) => void

  private bombGame?: BombGame
  private hostAddr?: string

  // for host
  private wsNameToPlayerId: { [wsName: string]: number } = {}

  constructor(private bombMap: BombMap) {
    // This is a mock network layer. In a real application,
    // this would involve actual network communication.
    // For now, we'll directly call BombGame methods.
  }

  isHost() {
    return this.bombGame !== undefined
  }

  // host a game
  createGame() {
    this.bombGame = new BombGame(this)
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

  // join game, host or client
  joinGame() {
    if (this.bombGame) {
      // self hosted
      const newPlayer = this.bombGame.addPlayer()
      const players = this.bombGame.getPlayerStates()
      this.handleGameUpdate({ type: 'joinSuccess', players, playerId: newPlayer.id })
      this.wsNameToPlayerId['host'] = newPlayer.id
    } else if (this.hostAddr) {
      // send join request to host
      this.sendTo?.(this.hostAddr, JSON.stringify({ type: 'join' }))
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
      if (this.hostAddr) {
        this.sendTo?.(this.hostAddr, JSON.stringify({ type: 'addBomb', playerId, x, y, bombType }))
      }
    }
  }

  // for host
  gameUpdate(msg: GameMessage) {
    this.sendAll?.(JSON.stringify(msg))
    this.handleGameUpdate(msg)
  }

  connected(addr: string) {
    console.log('BombNetwork connected to', addr)
    if (this.bombGame) {
      // host send cilent states
      const { players, items } = this.bombGame.getCurrentStates()
      this.sendTo?.(addr, JSON.stringify({ type: 'players', players }))
      this.sendTo?.(addr, JSON.stringify({ type: 'addItems', items }))
    } else {
      // client set host address
      this.hostAddr = addr
    }
  }

  receiveMsg(from: string, data: string) {
    const msg: GameMessage = JSON.parse(data)
    if (!msg.type) {
      console.warn('Invalid message received:', data)
      return
    }

    switch (msg.type) {
      // host
      case 'join':
        if (this.bombGame) {
          const id = this.wsNameToPlayerId[from]
          const newPlayer = this.bombGame.addPlayer(id)
          // const players = this.bombGame.getPlayerStates()
          this.sendTo?.(from, JSON.stringify({ type: 'joinSuccess', players: [], playerId: newPlayer.id }))
          this.wsNameToPlayerId[from] = newPlayer.id
          // this.sendAll?.(JSON.stringify({ type: 'players', players: [newPlayer] }))
          // this.handleGameUpdate({ type: 'players', players: [newPlayer] })
        }
        break
      case 'addBomb':
        if (this.bombGame) {
          const bomb =this.bombGame.addBomb(msg.playerId, msg.x, msg.y, msg.bombType)
          if (bomb) {
            // send bomb update to this player immediately,
            // rather than waiting for the game loop
            this.sendAll?.(JSON.stringify({ type: 'bombs', bombs: [bomb] }))
          }
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
        this.bombMap.removeItems(msg.positions)
        break
      case 'gameState':
        this.bombMap.updateGameState(msg.state)
        break
    }
  }
}