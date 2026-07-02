import { userTopic } from "../../config";
import { logInfo, logWarn } from "../../logger";
import { roomId } from "../../state/chat-store";
import { presenceStore } from "../../state/presence-store";
import { publishRealtime, realtimeStore } from "../../state/redis-realtime";
import type { RealtimeSocket } from "../../transport/socket";
import type {
  ChatReadyEvent,
  MatchmakeCancelledEvent,
  MatchmakeFoundEvent,
  MatchmakeQueuedEvent,
} from "../../types";
import { publishBusyStatus } from "../presence/events";

const POLLER_INTERVAL_MS = 500;
const CLEANUP_INTERVAL_MS = 30000; // Clean up stale queue entries every 30 seconds

export const handleMatchmakeJoin = async (socket: RealtimeSocket) => {
  const identity = presenceStore.getConnectionIdentity(socket.raw);
  if (!identity) return;
  const userId = identity.id;

  if (await realtimeStore.getBusyChannel(userId)) {
    const event: MatchmakeCancelledEvent = {
      type: "matchmake_cancelled",
      reason: "already_busy",
    };
    socket.send(JSON.stringify(event));
    return;
  }

  if (await realtimeStore.matchmakeIsWaiting(userId)) return;

  await realtimeStore.matchmakeJoin(userId);
  const position = await realtimeStore.matchmakeWaitingCount();

  const event: MatchmakeQueuedEvent = {
    type: "matchmake_queued",
    position,
  };
  socket.send(JSON.stringify(event));
  logInfo("matchmaking.joined", { userId, position });
};

export const handleMatchmakeLeave = async (socket: RealtimeSocket) => {
  const identity = presenceStore.getConnectionIdentity(socket.raw);
  if (!identity) return;
  const userId = identity.id;

  await realtimeStore.matchmakeLeave(userId);

  const event: MatchmakeCancelledEvent = {
    type: "matchmake_cancelled",
    reason: "user_left",
  };
  socket.send(JSON.stringify(event));
  logInfo("matchmaking.left", { userId });
};

export const handleMatchmakeDisconnect = async (userId: string) => {
  if (await realtimeStore.matchmakeIsWaiting(userId)) {
    await realtimeStore.matchmakeLeave(userId);
    logInfo("matchmaking.disconnect_cleanup", { userId });
  }
};

/** Subscribe the user's socket to the matched room channel. */
export const handleMatchmakeReady = async (
  socket: RealtimeSocket,
  channel: string,
) => {
  const identity = presenceStore.getConnectionIdentity(socket.raw);
  if (!identity) return;

  const busyChannel = await realtimeStore.getBusyChannel(identity.id);
  if (busyChannel !== channel) return;

  socket.subscribe(channel);
  const readyEvent: ChatReadyEvent = { type: "chat_ready", channel };
  socket.send(JSON.stringify(readyEvent));
  logInfo("matchmaking.ready", { userId: identity.id, channel });
};

/**
 * Starts the matchmaking poller. Only the instance holding the distributed lock
 * actively pops pairs — others skip silently. The lock auto-expires in 5s.
 */
export const startMatchmakingPoller = (
  localPublish: (topic: string, data: string) => unknown,
) => {
  const poll = async () => {
    if (!(await realtimeStore.matchmakeAcquireLock())) return;

    const pair = await realtimeStore.matchmakePopPair();
    if (!pair) return;

    const [userA, userB] = pair;

    // Remove both from waiting set
    await Promise.all([
      realtimeStore.matchmakeLeave(userA),
      realtimeStore.matchmakeLeave(userB),
    ]);

    // Create channel using the same room logic as chat_request
    const channel = roomId(userA, userB);
    const busyUsers = await realtimeStore.markChannelBusy(channel, userA, userB);

    if (!busyUsers) {
      // Race condition — one became busy between pop and lock
      logWarn("matchmaking.pair_failed", { userA, userB, reason: "busy_race" });
      return;
    }

    // Auto-open the channel (skip the pending/accept flow)
    await realtimeStore.openChannel(channel);

    const [userAData, userBData] = await Promise.all([
      realtimeStore.getUser(userA),
      realtimeStore.getUser(userB),
    ]);

    if (!userAData || !userBData) {
      await realtimeStore.releaseChannel(channel);
      logWarn("matchmaking.pair_failed", { userA, userB, reason: "missing_user" });
      return;
    }

    // Send matchmake_found to both users
    const eventForA: MatchmakeFoundEvent = {
      type: "matchmake_found",
      peer: userBData,
      channel,
    };
    const eventForB: MatchmakeFoundEvent = {
      type: "matchmake_found",
      peer: userAData,
      channel,
    };

    // Publish via user topics (cross-instance safe)
    const dataForA = JSON.stringify(eventForA);
    const dataForB = JSON.stringify(eventForB);
    localPublish(userTopic(userA), dataForA);
    localPublish(userTopic(userB), dataForB);
    await Promise.all([
      publishRealtime(userTopic(userA), dataForA),
      publishRealtime(userTopic(userB), dataForB),
    ]);

    // Publish busy status to all clients
    await publishBusyStatus(localPublish, busyUsers);

    logInfo("matchmaking.paired", { userA, userB, channel });
  };

  const cleanup = async () => {
    if (!(await realtimeStore.matchmakeAcquireLock())) return;
    
    const staleCount = await realtimeStore.matchmakeCleanupQueue();
    if (staleCount > 0) {
      logInfo("matchmaking.queue_cleanup", { staleEntriesRemoved: staleCount });
    }
  };

  const pollTimer = setInterval(() => {
    void poll().catch((err) => {
      logWarn("matchmaking.poll_error", {
        error: err instanceof Error ? err.message : "unknown",
      });
    });
  }, POLLER_INTERVAL_MS);

  const cleanupTimer = setInterval(() => {
    void cleanup().catch((err) => {
      logWarn("matchmaking.cleanup_error", {
        error: err instanceof Error ? err.message : "unknown",
      });
    });
  }, CLEANUP_INTERVAL_MS);

  pollTimer.unref();
  cleanupTimer.unref();
  logInfo("matchmaking.poller_started", { 
    pollIntervalMs: POLLER_INTERVAL_MS,
    cleanupIntervalMs: CLEANUP_INTERVAL_MS,
  });
  return { pollTimer, cleanupTimer };
};
