import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "../store";

export type MatchmakingPhase = "idle" | "searching" | "found";

interface MatchmakingState {
  phase: MatchmakingPhase;
  queuePosition: number | null;
  searchStartedAt: number | null;
}

const initialState: MatchmakingState = {
  phase: "idle",
  queuePosition: null,
  searchStartedAt: null,
};

const matchmakingSlice = createSlice({
  name: "matchmaking",
  initialState,
  reducers: {
    matchmakeStarted(state) {
      state.phase = "searching";
      state.queuePosition = null;
      state.searchStartedAt = Date.now();
    },

    matchmakeQueued(state, action: PayloadAction<{ position: number }>) {
      state.queuePosition = action.payload.position;
    },

    matchmakeFound(state) {
      state.phase = "found";
      state.queuePosition = null;
    },

    matchmakeCancelled(state) {
      state.phase = "idle";
      state.queuePosition = null;
      state.searchStartedAt = null;
    },

    matchmakeReset(state) {
      state.phase = "idle";
      state.queuePosition = null;
      state.searchStartedAt = null;
    },
  },
});

export const {
  matchmakeStarted,
  matchmakeQueued,
  matchmakeFound,
  matchmakeCancelled,
  matchmakeReset,
} = matchmakingSlice.actions;

export default matchmakingSlice.reducer;

// ── Selectors ─────────────────────────────────────────────────────────────────

export const selectMatchmakingPhase = (s: RootState) => s.matchmaking.phase;
export const selectQueuePosition = (s: RootState) => s.matchmaking.queuePosition;
export const selectSearchStartedAt = (s: RootState) => s.matchmaking.searchStartedAt;
