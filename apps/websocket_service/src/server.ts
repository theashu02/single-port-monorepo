import { Elysia } from "elysia";
import { SERVICE_PORT, WS_PATH } from "./config";
import { handleSocketMessage } from "./features/chat/handlers";
import {
  handleSocketClose,
  handleSocketOpen,
} from "./features/presence/handlers";
import { configureLoggerMetrics, logInfo } from "./logger";
import { chatStore } from "./state/chat-store";
import {
  connectRealtimeStore,
  realtimeStore,
  subscribeRealtimeBus,
} from "./state/redis-realtime";
import { toRealtimeSocket } from "./transport/socket";

export const configureServiceMetrics = () => {
  let latestOnlineUsers = 0;
  let latestBusyUsers = 0;

  setInterval(() => {
    void realtimeStore.totals().then((totals) => {
      latestOnlineUsers = totals.online;
      latestBusyUsers = totals.busy;
    });
  }, 5000).unref();

  configureLoggerMetrics(() => ({
    onlineUsers: latestOnlineUsers,
    busyUsers: latestBusyUsers,
    pendingInvites: chatStore.pendingInviteCount(),
    activeChannels: chatStore.activeChannelCount(),
  }));
};

export const createWebSocketService = () => {
  configureServiceMetrics();

  return new Elysia()
    .get("/health", () => ({ ok: true }))
    .ws(WS_PATH, {
      open(ws) {
        void handleSocketOpen(toRealtimeSocket(ws)).catch((error) => {
          logInfo("socket.open_failed", {
            error: error instanceof Error ? error.message : "unknown",
          });
          ws.close(1011, "Unable to open websocket");
        });
      },

      message(ws, rawMessage) {
        void handleSocketMessage(toRealtimeSocket(ws), rawMessage).catch(
          (error) => {
            logInfo("socket.message_failed", {
              error: error instanceof Error ? error.message : "unknown",
            });
          },
        );
      },

      close(ws) {
        void handleSocketClose(toRealtimeSocket(ws)).catch((error) => {
          logInfo("socket.close_failed", {
            error: error instanceof Error ? error.message : "unknown",
          });
        });
      },
    });
};

export const startWebSocketService = async (port = SERVICE_PORT) => {
  await connectRealtimeStore();
  const app = createWebSocketService().listen(port);
  await subscribeRealtimeBus((topic, data) => app.server?.publish(topic, data));

  logInfo("service.started", {
    port: app.server?.port ?? null,
    path: WS_PATH,
  });

  return app;
};

export type WebSocketService = ReturnType<typeof createWebSocketService>;
