import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { usePathname } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import {
  chatClosed,
  selectChannelMessages,
  selectChatChannel,
  selectChatPeer,
  selectChatPhase,
  selectIsPeerTyping,
} from "@/lib/redux/slices/chatSlice";
import { selectCurrentUserId } from "@/lib/redux/slices/presenceSlice";
import { useOnlinePresenceActions } from "@/app/app/online-people/OnlinePresenceProvider";

const TYPING_IDLE_MS = 1000;

export function useChatWindowLogic() {
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const phase = useAppSelector(selectChatPhase);
  const peer = useAppSelector(selectChatPeer);
  const channel = useAppSelector(selectChatChannel);
  const messages = useAppSelector(selectChannelMessages(channel));
  const selectPeerTyping = useMemo(
    () => selectIsPeerTyping(channel, peer?.id),
    [channel, peer?.id],
  );
  const isPeerTyping = useAppSelector(selectPeerTyping);
  const currentUserId = useAppSelector(selectCurrentUserId);
  const { sendMessage, sendTypingStatus, endChat } = useOnlinePresenceActions();

  const [draft, setDraft] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
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
      typingIdleTimerRef.current = window.setTimeout(
        stopTyping,
        TYPING_IDLE_MS,
      );
    },
    [clearTypingTimer, sendTypingStatus, stopTyping],
  );

  useEffect(() => {
    activeChannelRef.current = phase === "open" ? channel : null;
    if (phase === "open") closeSentRef.current = false;
    if (phase !== "open") stopTyping();
  }, [channel, phase, stopTyping]);

  useEffect(() => {
    return () => {
      stopTyping();
    };
  }, [channel, stopTyping]);

  useEffect(() => {
    const endActiveChat = () => {
      stopTyping();
      const activeChannel = activeChannelRef.current;
      if (!activeChannel || closeSentRef.current) return;
      closeSentRef.current = true;
      endChat(activeChannel);
    };

    window.addEventListener("pagehide", endActiveChat);
    return () => {
      endActiveChat();
      window.removeEventListener("pagehide", endActiveChat);
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
    if (sent) setDraft("");
  }, [channel, draft, sendMessage, stopTyping]);

  const handleDraftChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const value = e.target.value;
      setDraft(value);

      if (!channel || phase !== "open") return;
      if (value.trim()) {
        startTyping(channel);
      } else {
        stopTyping();
      }
    },
    [channel, phase, startTyping, stopTyping],
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
    pathname,
    phase,
    peer,
    channel,
    messages,
    isPeerTyping,
    currentUserId,
    draft,
    bottomRef,
    handleDraftChange,
    handleKeyDown,
    handleSend,
    handleClose,
  };
}
