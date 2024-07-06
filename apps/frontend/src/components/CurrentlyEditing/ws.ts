import { proxy, subscribe, snapshot } from 'valtio/vanilla';

type WsProps = {
  maxRetries?: number;
  uri: string;
  onError?: typeof WebSocket.prototype.onerror;
  onMessage: (message: ArrayBuffer) => void;
};

type WsState = {
  timer: ReturnType<typeof setTimeout> | null;
  retries: number;
  socket: WebSocket | null;
  lastMessage: ArrayBuffer | null;
  connect: () => void;
  shouldReconnect?: boolean;
};

export const reconnectingWebSocket = ({
  maxRetries = 5,
  uri,
  onError = console.error,
  onMessage,
}: WsProps) => {
  let socket = new WebSocket(uri);

  const ws = proxy<WsState>({
    timer: null,
    retries: 0,
    socket,
    lastMessage: null,
    shouldReconnect: true,
    connect: () => {
      socket = new WebSocket(uri);

      socket.onopen = () => {
        console.log('WS Connected');
        if (ws.retries > 0) ws.retries = 0;
      };

      socket.onclose = () => onClose();
      socket.onerror = onError;
      socket.onmessage = (event: MessageEvent<Blob>) => {
        event.data.arrayBuffer().then((result) => {
          ws.lastMessage = result;
        });
      };

      ws.socket = socket;
    },
  });

  const onClose = () => {
    if (ws.socket) {
      ws.socket = null;
    }
    if (ws.shouldReconnect) {
      ws.timer = setTimeout(
        () => {
          if (ws.retries < maxRetries) {
            ws.retries += 1;
            console.error(
              `Connection closed. Reconnecting. Attempt ${ws.retries}`,
            );
            ws.connect();
          }
        },
        (ws.retries + 1) * 2000,
      );
    }
  };

  return {
    connect: ws.connect,
    disconnect: () => {
      if (ws.socket) {
        ws.shouldReconnect = false;
        socket.close();
      }
    },
    unsub: subscribe(ws, () => {
      const { lastMessage } = snapshot(ws);
      if (lastMessage) onMessage(lastMessage as ArrayBuffer);
    }),
  };
};
