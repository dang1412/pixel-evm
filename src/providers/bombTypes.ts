// Duplicate from server/src/ws/bombTypes.ts (other repo)

export enum BombType {
  Standard,
  Atomic,
}

export type BombGameCreatePayload = {
  host: string;
  originalGameId?: number;
}

export type BombGameMsg =
  // host
  | { type: 'create_game'; payload: BombGameCreatePayload }
  | { type: 'start_round'; payload: { gameId: number; round: number } }
  | { type: 'reset'; payload: { gameId: number; round: number } }
  | { type: 'scores'; payload: {
      gameId: number; 
      round: number; 
      players: { playerId: number; score: number; }[] 
    }}
  // client
  | { type: 'connect'; payload: { gameId: number; client: string; } }
  | { type: 'join'; payload: { gameId: number; client: string; playerId: number } }
  | { type: 'place_bomb'; payload: { gameId: number; round: number; playerId: number; pos: number; bombType: BombType } }
  | { type: 'defuse_bomb'; payload: { gameId: number; round: number; playerId: number; pos: number; } }
  | { type: 'buy_bomb'; payload: { gameId: number; playerId: number; bombType: BombType } }
  // api
  | { type: 'get_top_rank'; payload: { round: number } }

export type BombGameMsgResponse =
  // respond to 'create_game'
  | { type: 'game_created'; gameId: number }

  // respond to 'get_top_rank'
  | { type: 'top_rank'; players: { gameId: number; playerId: number; score: number; }[] }
