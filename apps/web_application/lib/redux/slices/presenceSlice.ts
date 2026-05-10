import {
  createSelector,
  createSlice,
  type PayloadAction,
} from "@reduxjs/toolkit";
import type { RootState } from "../store";

export interface OnlineUser {
  id: string;
  name: string;
  isBusy: boolean;
}

export type PresenceStatus =
  | "resolving-user"
  | "unauthenticated"
  | "connecting"
  | "connected"
  | "disconnected"
  | "error";

interface PresenceState {
  ids: string[];
  entities: Record<string, OnlineUser>;
  currentUserId: string | null;
  status: PresenceStatus;
  error: string | null;
}

const initialState: PresenceState = {
  ids: [],
  entities: {},
  currentUserId: null,
  status: "resolving-user",
  error: null,
};

const upsertUser = (state: PresenceState, user: OnlineUser) => {
  if (!state.entities[user.id]) {
    state.ids.push(user.id);
  }
  state.entities[user.id] = user;
};

const presenceSlice = createSlice({
  name: "presence",
  initialState,
  reducers: {
    presenceIdentityChanged(state, action: PayloadAction<string | null>) {
      state.currentUserId = action.payload;
    },

    presenceStatusChanged(
      state,
      action: PayloadAction<{ status: PresenceStatus; error?: string | null }>,
    ) {
      state.status = action.payload.status;
      if ("error" in action.payload) {
        state.error = action.payload.error ?? null;
      }
    },

    presenceReset(
      state,
      action: PayloadAction<
        { status?: PresenceStatus; error?: string | null } | undefined
      >,
    ) {
      state.ids = [];
      state.entities = {};
      state.currentUserId = null;
      state.status = action.payload?.status ?? "unauthenticated";
      state.error = action.payload?.error ?? null;
    },

    onlineUsersSnapshotReceived(state, action: PayloadAction<OnlineUser[]>) {
      state.ids = [];
      state.entities = {};

      for (const user of action.payload) {
        upsertUser(state, user);
      }
    },

    userJoinedReceived(state, action: PayloadAction<OnlineUser>) {
      upsertUser(state, action.payload);
    },

    userLeftReceived(state, action: PayloadAction<string>) {
      const userId = action.payload;
      if (!state.entities[userId]) return;

      delete state.entities[userId];
      state.ids = state.ids.filter((id) => id !== userId);
    },

    userBusyChanged(
      state,
      action: PayloadAction<{ userId: string; isBusy: boolean }>,
    ) {
      const user = state.entities[action.payload.userId];
      if (!user || user.isBusy === action.payload.isBusy) return;

      state.entities[action.payload.userId] = {
        ...user,
        isBusy: action.payload.isBusy,
      };
    },
  },
});

export const {
  presenceIdentityChanged,
  presenceStatusChanged,
  presenceReset,
  onlineUsersSnapshotReceived,
  userJoinedReceived,
  userLeftReceived,
  userBusyChanged,
} = presenceSlice.actions;

export default presenceSlice.reducer;

const selectPresence = (state: RootState) => state.presence;
const selectPresenceIds = (state: RootState) => state.presence.ids;
const selectPresenceEntities = (state: RootState) => state.presence.entities;

export const selectOnlineUsers = createSelector(
  [selectPresenceIds, selectPresenceEntities],
  (ids, entities) =>
    ids
      .map((id) => entities[id])
      .filter((user): user is OnlineUser => Boolean(user)),
);

export const selectPresenceStatus = (state: RootState) => state.presence.status;
export const selectPresenceError = (state: RootState) => state.presence.error;
export const selectCurrentUserId = (state: RootState) =>
  state.presence.currentUserId;
export const selectUserCount = (state: RootState) => state.presence.ids.length;

export const selectOtherUsersCount = createSelector(
  [selectPresence],
  (presence) => {
    if (!presence.currentUserId) return presence.ids.length;
    return presence.ids.reduce(
      (count, id) => count + (id === presence.currentUserId ? 0 : 1),
      0,
    );
  },
);

export const selectBusyUsersCount = createSelector(
  [selectPresence],
  (presence) =>
    presence.ids.reduce((count, id) => {
      const user = presence.entities[id];
      return count + (user?.isBusy && id !== presence.currentUserId ? 1 : 0);
    }, 0),
);
