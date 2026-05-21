import { Elysia } from "elysia";
import { ONLINE_USERS_TOPIC, PRESENCE_SAMPLE_SIZE, SERVICE_PORT, WS_PATH } from "./config";
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

interface AppWithServer {
  server?: { publish(topic: string, data: string): void } | null;
}

export const configureServiceMetrics = (app: AppWithServer) => {
  let latestOnlineUsers = 0;
  let latestBusyUsers = 0;

  setInterval(() => {
    void realtimeStore.totals().then((totals) => {
      latestOnlineUsers = totals.online;
      latestBusyUsers = totals.busy;

      // Broadcast counts globally ONLY once every 5 seconds
      app.server?.publish(ONLINE_USERS_TOPIC, JSON.stringify({
        type: "presence_counts",
        online: latestOnlineUsers,
        busy: latestBusyUsers,
      }));
    });
  }, 3500).unref();

  // Broadcast a full snapshot every 10 seconds so the UI repopulates
  setInterval(() => {
    void realtimeStore.sample(PRESENCE_SAMPLE_SIZE).then((sample) => {
      app.server?.publish(ONLINE_USERS_TOPIC, JSON.stringify({
        type: "online_users_snapshot",
        users: sample.users,
        totalOnline: sample.totals.online,
        totalBusy: sample.totals.busy,
        sampleSize: sample.sampleSize,
      }));
    });
  }, 8000).unref();

  configureLoggerMetrics(() => ({
    onlineUsers: latestOnlineUsers,
    busyUsers: latestBusyUsers,
    pendingInvites: chatStore.pendingInviteCount(),
    activeChannels: chatStore.activeChannelCount(),
  }));
};

export const createWebSocketService = () => {
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
  configureServiceMetrics(app);
  await subscribeRealtimeBus((topic, data) => app.server?.publish(topic, data));

  logInfo("service.started", {
    port: app.server?.port ?? null,
    path: WS_PATH,
  });

  return app;
};

export type WebSocketService = ReturnType<typeof createWebSocketService>;
