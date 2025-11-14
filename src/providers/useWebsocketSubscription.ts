import { useEffect } from 'react';

import { useWebSocket } from './WebsocketProvider';
import { ChannelPayloadMap, KnownChannel } from './types';

/**
 * Custom hook để tự động đăng ký và hủy đăng ký một channel.
 * @param channel Tên channel muốn lắng nghe.
 * @param onMessage Callback sẽ được gọi khi có tin nhắn từ channel này.
 */
export const useWebSocketSubscription = <T extends KnownChannel>(
  channel: T | null, // Cho phép null để "tạm dừng" sub
  onMessage: (data: ChannelPayloadMap[T]) => void
) => {
  const { subscribe, unsubscribe, isConnected } = useWebSocket();

  // Dùng useCallback để đảm bảo onMessage không bị tạo lại
  // nếu component cha không bọc nó trong useCallback
  // const stableOnMessage = useCallback(onMessage, [onMessage]);

  useEffect(() => {
    if (!isConnected) {
      return;
    }

    // Nếu channel là null hoặc rỗng, không làm gì cả
    if (!channel) {
      return;
    }

    // Đăng ký
    subscribe(channel, onMessage);

    // Trả về hàm cleanup, tự động được gọi khi component unmount
    // hoặc khi `channel` hay `stableOnMessage` thay đổi
    return () => {
      unsubscribe(channel, onMessage);
    };
  }, [isConnected, channel, onMessage, subscribe, unsubscribe]);
};