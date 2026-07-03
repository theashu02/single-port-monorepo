import { useState, useMemo, useCallback } from "react";
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import {
  chatRequested,
  selectChatPeer,
  selectChatPhase,
  selectIsLocalChatLocked,
} from "@/lib/redux/slices/chatSlice";
import {
  selectBusyUsersCount,
  selectLoadedUserCount,
  selectOtherUsersCount,
} from "@/lib/redux/slices/presenceSlice";
import { useOnlinePresence, type OnlineUser } from "@/app/app/online-people/OnlinePresenceProvider";

export type PresenceFilter = "all" | "others" | "you";

export function useOnlinePeopleFilters() {
  const { users, userCount, currentUserId, status, error, requestChat } =
    useOnlinePresence();
  const dispatch = useAppDispatch();
  const chatPhase = useAppSelector(selectChatPhase);
  const chatPeer = useAppSelector(selectChatPeer);
  const isLocalChatLocked = useAppSelector(selectIsLocalChatLocked);
  const otherUsersCount = useAppSelector(selectOtherUsersCount);
  const busyUsersCount = useAppSelector(selectBusyUsersCount);
  const loadedUserCount = useAppSelector(selectLoadedUserCount);
  
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<PresenceFilter>("all");

  const isConnected = status === "connected";

  const sortedUsers = useMemo(
    () =>
      [...users].sort((a, b) => {
        if (a.id === currentUserId) return -1;
        if (b.id === currentUserId) return 1;
        return a.name.localeCompare(b.name);
      }),
    [currentUserId, users],
  );

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    return sortedUsers.filter((u) => {
      const matchesFilter =
        activeFilter === "all" ||
        (activeFilter === "you" && u.id === currentUserId) ||
        (activeFilter === "others" && u.id !== currentUserId);
      if (!matchesFilter) return false;
      if (!q) return true;
      return u.name.toLowerCase().includes(q) || u.id.toLowerCase().includes(q);
    });
  }, [activeFilter, currentUserId, search, sortedUsers]);

  const handleChat = useCallback(
    (user: OnlineUser) => {
      if (
        !isConnected ||
        isLocalChatLocked ||
        user.id === currentUserId ||
        user.isBusy
      )
        return;
      if (requestChat(user.id)) {
        dispatch(chatRequested(user));
      }
    },
    [currentUserId, dispatch, isConnected, isLocalChatLocked, requestChat],
  );

  return {
    userCount,
    currentUserId,
    status,
    error,
    chatPhase,
    chatPeer,
    isLocalChatLocked,
    otherUsersCount,
    busyUsersCount,
    loadedUserCount,
    search,
    setSearch,
    activeFilter,
    setActiveFilter,
    filteredUsers,
    isConnected,
    handleChat,
  };
}
