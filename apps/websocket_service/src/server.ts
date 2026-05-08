import { Elysia } from "elysia";
import { SERVICE_PORT, WS_PATH } from "./config";
import { handleSocketMessage } from "./features/chat/handlers";
import {
  handleSocketClose,
  handleSocketOpen,
} from "./features/presence/handlers";
import { configureLoggerMetrics, logInfo } from "./logger";
import { chatStore } from "./state/chat-store";
import { presenceStore } from "./state/presence-store";
import { toRealtimeSocket } from "./transport/socket";

export const configureServiceMetrics = () => {
  configureLoggerMetrics(() => ({
    onlineUsers: presenceStore.size(),
    busyUsers: chatStore.busyUserCount(),
    pendingInvites: chatStore.pendingInviteCount(),
    activeChannels: chatStore.activeChannelCount(),
  }));
};

export const createWebSocketService = () => {
  configureServiceMetrics();

  return new Elysia().ws(WS_PATH, {
    open(ws) {
      handleSocketOpen(toRealtimeSocket(ws));
    },

    message(ws, rawMessage) {
      handleSocketMessage(toRealtimeSocket(ws), rawMessage);
    },

    close(ws) {
      handleSocketClose(toRealtimeSocket(ws));
    },
  });
};

export const startWebSocketService = (port = SERVICE_PORT) => {
  const app = createWebSocketService().listen(port);

  logInfo("service.started", {
    port: app.server?.port ?? null,
    path: WS_PATH,
  });

  return app;
};

export type WebSocketService = ReturnType<typeof createWebSocketService>;
