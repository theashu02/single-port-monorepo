"use client";

import React, { useRef, useEffect, useState, useLayoutEffect, useCallback, useMemo } from "react";
import { useAppSelector, useAppDispatch } from "@/lib/redux/hooks";
import {
  selectChannelMessages,
  selectIsPeerTyping,
  chatClosed,
} from "@/lib/redux/slices/chatSlice";
import { useOnlinePresenceActions } from "@/app/app/components/online-people/OnlinePresenceProvider";

const TYPING_IDLE_MS = 1000;

interface ChatUser {
  id: string;
  name: string;
  avatarUrl?: string;
}

export function useDiscoverChat(peer: ChatUser, channel: string) {
  const dispatch = useAppDispatch();
  const messages = useAppSelector(selectChannelMessages(channel));
  const selectPeerTyping = useMemo(() => selectIsPeerTyping(channel, peer.id), [channel, peer.id]);
  const isPeerTyping = useAppSelector(selectPeerTyping);
  const { sendMessage, sendTypingStatus, endChat } = useOnlinePresenceActions();

  const [draft, setDraft] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const activeChannelRef = useRef<string | null>(null);
  const closeSentRef = useRef(false);
  const typingChannelRef = useRef<string | null>(null);
  const typingIdleTimerRef = useRef<number | null>(null);

  const clearTypingTimer = useCallback(() => {
    if (!typingIdleTimerRef.current) return;
    window.clearTimeout(typingIdleTimerRef.current);
    typingIdleTimerRef.current = null;
  }, []);

  const stopTyping = useCallback(() => {
    clearTypingTimer();
    const typingChannel = typingChannelRef.current;
    if (!typingChannel) return;

    sendTypingStatus(typingChannel, false);
    typingChannelRef.current = null;
  }, [clearTypingTimer, sendTypingStatus]);

  const startTyping = useCallback(
    (targetChannel: string) => {
      if (typingChannelRef.current !== targetChannel) {
        stopTyping();
        if (sendTypingStatus(targetChannel, true)) {
          typingChannelRef.current = targetChannel;
        }
      }

      clearTypingTimer();
      typingIdleTimerRef.current = window.setTimeout(stopTyping, TYPING_IDLE_MS);
    },
    [clearTypingTimer, sendTypingStatus, stopTyping],
  );

  useEffect(() => {
    activeChannelRef.current = channel;
    closeSentRef.current = false;

    return () => {
      stopTyping();
    };
  }, [channel, stopTyping]);

  useEffect(() => {
    const endActiveChatOnUnload = () => {
      stopTyping();
      const activeChannel = activeChannelRef.current;
      if (!activeChannel || closeSentRef.current) return;
      closeSentRef.current = true;
      endChat(activeChannel);
    };

    window.addEventListener("pagehide", endActiveChatOnUnload);
    return () => {
      window.removeEventListener("pagehide", endActiveChatOnUnload);
    };
  }, [endChat, stopTyping]);

  useLayoutEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = useCallback(() => {
    const text = draft.trim();
    if (!text || !channel) return;
    stopTyping();
    const sent = sendMessage(channel, text);
    if (sent) {
      setDraft("");
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    }
  }, [channel, draft, sendMessage, stopTyping]);

  const handleDraftChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const value = e.target.value;
      setDraft(value);

      // Auto-grow textarea up to a reasonable max-height
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
        textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
      }

      if (!channel) return;
      if (value.trim()) {
        startTyping(channel);
      } else {
        stopTyping();
      }
    },
    [channel, startTyping, stopTyping],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend],
  );

  const handleClose = useCallback(() => {
    stopTyping();
    if (channel) {
      closeSentRef.current = true;
      endChat(channel);
    }
    dispatch(chatClosed());
  }, [channel, dispatch, endChat, stopTyping]);

  return {
    messages,
    isPeerTyping,
    draft,
    bottomRef,
    textareaRef,
    handleSend,
    handleDraftChange,
    handleKeyDown,
    handleClose,
  };
}
