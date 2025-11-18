import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  useCallback,
  ReactNode,
} from 'react';
import { ChannelPayloadMap, ClientMessage } from './types';

// Giả định kiểu dữ liệu tin nhắn server trả về
interface WebSocketMessage {
  channel: string;
  data: any;
}

// Kiểu dữ liệu cho các hàm callback được đăng ký
type MessageCallback<T = any> = (data: T) => void;

// Danh sách listeners, dùng useRef để tránh re-render không cần thiết
// Cấu trúc: { "channel_A": [callback1, callback2], "channel_B": [callback3] }
type ListenerMap = Record<string, MessageCallback[]>;

interface WebSocketContextType<T = ClientMessage> {
  // Hàm để gửi tin nhắn đi (bao gồm cả tin nhắn subscribe/unsubscribe)
  send: (message: T) => void;
  // Hàm để đăng ký lắng nghe một channel
  subscribe: <T extends keyof ChannelPayloadMap>(channel: T, callback: MessageCallback<ChannelPayloadMap[T]>) => () => void;
  // Hàm để hủy đăng ký
  unsubscribe: (channel: string, callback: MessageCallback) => void;
  isConnected: boolean;
}

const WebSocketContext = createContext<WebSocketContextType | null>(null);

interface WebSocketProviderProps {
  url: string;
  children: ReactNode;
}

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({
  url,
  children,
}) => {
  const [isConnected, setIsConnected] = useState(false);
  const ws = useRef<WebSocket | null>(null);
  // Dùng useRef để lưu trữ listeners
  // vì chúng ta không muốn việc thêm/bớt listener làm component này re-render
  const listeners = useRef<ListenerMap>({});

  useEffect(() => {
    // Khởi tạo kết nối
    const socket = new WebSocket(url);
    ws.current = socket;

    socket.onopen = () => {
      console.log('WebSocket Connected');
      setIsConnected(true);
      // Bạn có thể tự động gửi lại các subscription đã có nếu muốn
      // (cần logic phức tạp hơn để lưu lại các channel đã sub)
    };

    socket.onclose = () => {
      console.log('WebSocket Disconnected');
      setIsConnected(false);
      // Có thể thêm logic reconnect ở đây
    };

    socket.onerror = (error) => {
      console.error('WebSocket Error:', error);
    };

    // Đây là BỘ ĐỊNH TUYẾN (Router) quan trọng nhất
    socket.onmessage = (event) => {
      try {
        // GIẢ ĐỊNH QUAN TRỌNG:
        // Server trả về JSON có dạng { channel: "...", data: ... }
        const message = JSON.parse(event.data);
        if (message.channel) {
          const { channel, data } = message as WebSocketMessage;

          // Tìm tất cả các callback đã đăng ký cho channel này
          const channelListeners = listeners.current[channel];
          if (channelListeners) {
            // Gửi dữ liệu đến tất cả các component đang lắng nghe
            channelListeners.forEach((callback) => {
              callback(data);
            });
          }
        } else {
          console.warn('Received message without channel:', message);
        }
      } catch (error) {
        console.warn('Failed to parse WebSocket message:', event.data);
      }
    };

    // Dọn dẹp khi component unmount
    return () => {
      socket.close();
      ws.current = null;
    };
  }, [url]); // Chỉ chạy lại khi URL thay đổi

  // Hàm gửi tin nhắn, dùng useCallback để tối ưu
  const send = useCallback((message: any) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket not connected. Message not sent:', message);
    }
  }, []);

  // Hàm đăng ký channel
  const subscribe = useCallback(
    <T extends keyof ChannelPayloadMap>(channel: T, callback: MessageCallback<ChannelPayloadMap[T]>) =>
  {
    if (!listeners.current[channel]) {
      listeners.current[channel] = [];
    }

    // Gửi tin nhắn subscribe lên server
    // (theo yêu cầu của bạn là dùng ws.send để sub)
    // Bạn có thể kiểm tra nếu là listener đầu tiên thì mới send
    const isFirstSubscriber = listeners.current[channel].length === 0;
    if (isFirstSubscriber) {
      send({
        action: 'subscribe',
        channel: channel,
      });
    }

    listeners.current[channel].push(callback);
    console.log(`Subscribed to channel: ${channel}`);

    // return unsubscribe function
    return () => {
      unsubscribe(channel, callback)
    }

  }, [send]); // Phụ thuộc vào hàm `send`

  // Hàm hủy đăng ký channel
  const unsubscribe = useCallback(
    (channel: string, callback: MessageCallback) => {
      const channelListeners = listeners.current[channel];
      if (channelListeners) {
        // Xóa callback cụ thể khỏi mảng
        listeners.current[channel] = channelListeners.filter(
          (cb) => cb !== callback
        );

        // Nếu không còn ai nghe channel này, gửi tin nhắn unsubscribe
        if (listeners.current[channel].length === 0) {
          send({
            action: 'unsubscribe',
            channel: channel,
          });
          console.log(`Unsubscribed from channel: ${channel}`);
          // Xóa luôn key để giữ object sạch sẽ
          delete listeners.current[channel];
        }
      }
    },
    [send] // Phụ thuộc vào hàm `send`
  );

  const contextValue: WebSocketContextType = {
    send,
    subscribe,
    unsubscribe,
    isConnected,
  };

  return (
    <WebSocketContext.Provider value={contextValue}>
      {children}
    </WebSocketContext.Provider>
  );
};

// Hook tiện ích để truy cập Context
export const useWebSocket = <T = ClientMessage>(): WebSocketContextType<T> => {
  const context = useContext(WebSocketContext) as WebSocketContextType<T>;
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};