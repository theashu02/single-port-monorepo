export * from "./config";
export * from "./features/chat/handlers";
export * from "./features/presence/events";
export * from "./features/presence/handlers";
export * from "./logger";
export * from "./messages/client-message";
export * from "./server";
export * from "./state/chat-store";
export * from "./state/presence-store";
export * from "./transport/socket";
export type * from "./types";

import { startWebSocketService } from "./server";

if (import.meta.main) {
  startWebSocketService();
}
