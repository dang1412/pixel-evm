import { BombGameMsg, BombGameMsgResponse } from './bombTypes'

export interface BoxClaimedArgs {
  user: `0x${string}` // 20bytes
  position: number  // 2bytes
  token: number // 1byte
}

// Duplicate from server/src/ws/types.ts (other repo)

export interface ChannelPayloadMap {
  'btc-price': { price: number; timestamp: number };
  'eth-price': { price: number; timestamp: number };
  'global-chat': { user: string; text: string; messageId: string };
  'admin-notifications': { type: 'error' | 'info'; message: string };
  'box-claimed': BoxClaimedArgs[];
  [key: `message-to-${string}`]: { from: string, content: string};
  'bomb-game': BombGameMsgResponse;
}

// Helper type để lấy tên các channel
export type KnownChannel = keyof ChannelPayloadMap;

// Tin nhắn client GỬI LÊN
export type ClientMessage =
  | { action: 'subscribe'; channel: string }
  | { action: 'unsubscribe'; channel: string }
  | { action: 'chat_message'; payload: { user?: string; text: string } }
  | { action: 'send_message'; payload: { from: string; to: string; content: string } }
  | { action: 'bomb_game'; msg: BombGameMsg }