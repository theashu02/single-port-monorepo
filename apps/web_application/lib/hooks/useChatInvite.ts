import { useCallback } from "react";
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import {
  chatClosed,
  chatRequested,
  selectChatPeer,
  selectChatPhase,
} from "@/lib/redux/slices/chatSlice";
import { useOnlinePresenceActions } from "@/app/app/online-people/OnlinePresenceProvider";

export function useChatInvite() {
  const dispatch = useAppDispatch();
  const phase = useAppSelector(selectChatPhase);
  const peer = useAppSelector(selectChatPeer);
  const { acceptChat, rejectChat } = useOnlinePresenceActions();

  const handleAccept = useCallback(() => {
    if (!peer) return;
    const sent = acceptChat(peer.id);
    if (!sent) return;
    dispatch(chatRequested(peer));
  }, [acceptChat, dispatch, peer]);

  const handleReject = useCallback(() => {
    if (!peer) return;
    rejectChat(peer.id);
    dispatch(chatClosed());
  }, [dispatch, peer, rejectChat]);

  return {
    phase,
    peer,
    handleAccept,
    handleReject,
  };
}
