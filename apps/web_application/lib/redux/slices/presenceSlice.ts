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
  totalOnline: number;
  totalBusy: number;
  sampleSize: number;
  currentUserId: string | null;
  status: PresenceStatus;
  error: string | null;
}

const initialState: PresenceState = {
  ids: [],
  entities: {},
  totalOnline: 0,
  totalBusy: 0,
  sampleSize: 0,
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

const trimVisibleUsers = (
  state: PresenceState,
  protectedUserId?: string,
) => {
  const limit = state.sampleSize;
  if (limit <= 0) return;

  while (state.ids.length > limit) {
    const removeIndex = state.ids.findIndex(
      (id) => id !== state.currentUserId && id !== protectedUserId,
    );
    if (removeIndex < 0) return;

    const [removedId] = state.ids.splice(removeIndex, 1);
    if (removedId) {
      delete state.entities[removedId];
    }
  }
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
      state.totalOnline = 0;
      state.totalBusy = 0;
      state.sampleSize = 0;
      state.currentUserId = null;
      state.status = action.payload?.status ?? "unauthenticated";
      state.error = action.payload?.error ?? null;
    },

    onlineUsersSnapshotReceived(
      state,
      action: PayloadAction<{
        users: OnlineUser[];
        totalOnline: number;
        totalBusy: number;
        sampleSize: number;
      }>,
    ) {
      state.ids = [];
      state.entities = {};
      state.totalOnline = action.payload.totalOnline;
      state.totalBusy = action.payload.totalBusy;
      state.sampleSize = action.payload.sampleSize;

      for (const user of action.payload.users) {
        upsertUser(state, user);
      }
    },

    presenceCountsReceived(
      state,
      action: PayloadAction<{ online: number; busy: number }>,
    ) {
      state.totalOnline = action.payload.online;
      state.totalBusy = action.payload.busy;
    },

    userJoinedReceived(state, action: PayloadAction<OnlineUser>) {
      upsertUser(state, action.payload);
      state.totalOnline = Math.max(state.totalOnline, state.ids.length);
      trimVisibleUsers(state, action.payload.id);
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
  presenceCountsReceived,
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
export const selectUserCount = (state: RootState) => state.presence.totalOnline;
export const selectLoadedUserCount = (state: RootState) =>
  state.presence.ids.length;
export const selectPresenceSampleSize = (state: RootState) =>
  state.presence.sampleSize;

export const selectOtherUsersCount = createSelector(
  [selectPresence],
  (presence) => {
    return Math.max(0, presence.totalOnline - (presence.currentUserId ? 1 : 0));
  },
);

export const selectBusyUsersCount = createSelector(
  [selectPresence],
  (presence) => presence.totalBusy,
);
