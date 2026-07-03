"use client";

import React, { createContext, useCallback, useContext, useMemo } from "react";
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import {
  selectCurrentUserId,
  selectOnlineUsers,
  selectPresenceError,
  selectPresenceStatus,
  selectUserCount,
  type OnlineUser,
  type PresenceStatus,
} from "@/lib/redux/slices/presenceSlice";
import {
  matchmakeCancelled,
  matchmakeStarted,
} from "@/lib/redux/slices/matchmakingSlice";
import { messageReceived } from "@/lib/redux/slices/chatSlice";
import { createClientMessageId } from "@/lib/utils/presenceUtils";
import { usePresenceConnection } from "@/lib/hooks/usePresenceConnection";

export type {
  OnlineUser,
  PresenceStatus,
} from "@/lib/redux/slices/presenceSlice";

interface OnlinePresenceActions {
  requestChat: (targetId: string) => boolean;
  acceptChat: (fromId: string) => boolean;
  rejectChat: (fromId: string) => boolean;
  sendMessage: (channel: string, text: string) => boolean;
  sendTypingStatus: (channel: string, isTyping: boolean) => boolean;
  endChat: (channel: string) => boolean;
  startMatchmaking: () => boolean;
  cancelMatchmaking: () => boolean;
}

interface OnlinePresenceContextValue extends OnlinePresenceActions {
  users: OnlineUser[];
  userCount: number;
  currentUserId: string | null;
  status: PresenceStatus;
  error: string | null;
}

const OnlinePresenceActionsContext =
  createContext<OnlinePresenceActions | null>(null);

export function OnlinePresenceProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const dispatch = useAppDispatch();
  const { socketRef, identity } = usePresenceConnection();

  const send = useCallback(
    (payload: object): boolean => {
      if (socketRef.current?.readyState !== WebSocket.OPEN) return false;
      socketRef.current.send(JSON.stringify(payload));
      return true;
    },
    [socketRef],
  );

  const requestChat = useCallback(
    (targetId: string) => send({ type: "chat_request", targetId }),
    [send],
  );

  const acceptChat = useCallback(
    (fromId: string) => send({ type: "accept_chat", targetId: fromId }),
    [send],
  );

  const rejectChat = useCallback(
    (fromId: string) => send({ type: "reject_chat", fromId }),
    [send],
  );

  const sendMessage = useCallback(
    (channel: string, text: string) => {
      if (!identity) return false;

      const ts = Date.now();
      const id = createClientMessageId(identity.id, ts);
      const ok = send({ type: "chat_message", channel, text, clientId: id });
      if (!ok) return false;

      dispatch(
        messageReceived({
          id,
          channel,
          fromId: identity.id,
          text,
          ts,
        }),
      );
      return true;
    },
    [dispatch, identity, send],
  );

  const sendTypingStatus = useCallback(
    (channel: string, isTyping: boolean) =>
      send({ type: "chat_typing", channel, isTyping }),
    [send],
  );

  const endChat = useCallback(
    (channel: string) => send({ type: "end_chat", channel }),
    [send],
  );

  const startMatchmaking = useCallback(() => {
    const ok = send({ type: "matchmake_join" });
    if (ok) dispatch(matchmakeStarted());
    return ok;
  }, [send, dispatch]);

  const cancelMatchmaking = useCallback(() => {
    const ok = send({ type: "matchmake_leave" });
    if (ok) dispatch(matchmakeCancelled());
    return ok;
  }, [send, dispatch]);

  const actions = useMemo<OnlinePresenceActions>(
    () => ({
      requestChat,
      acceptChat,
      rejectChat,
      sendMessage,
      sendTypingStatus,
      endChat,
      startMatchmaking,
      cancelMatchmaking,
    }),
    [
      acceptChat,
      cancelMatchmaking,
      endChat,
      rejectChat,
      requestChat,
      sendMessage,
      sendTypingStatus,
      startMatchmaking,
    ],
  );

  return (
    <OnlinePresenceActionsContext.Provider value={actions}>
      {children}
    </OnlinePresenceActionsContext.Provider>
  );
}

export function useOnlinePresenceActions() {
  const context = useContext(OnlinePresenceActionsContext);
  if (!context) {
    throw new Error(
      "useOnlinePresenceActions must be used within OnlinePresenceProvider",
    );
  }
  return context;
}

export function useOnlinePresence(): OnlinePresenceContextValue {
  const actions = useOnlinePresenceActions();
  const users = useAppSelector(selectOnlineUsers);
  const userCount = useAppSelector(selectUserCount);
  const currentUserId = useAppSelector(selectCurrentUserId);
  const status = useAppSelector(selectPresenceStatus);
  const error = useAppSelector(selectPresenceError);

  return useMemo(
    () => ({
      users,
      userCount,
      currentUserId,
      status,
      error,
      ...actions,
    }),
    [actions, currentUserId, error, status, userCount, users],
  );
}
