import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface TestState {
  message: string;
}

const initialState: TestState = {
  message: 'Hello from Redux Initial State!',
};

export const testSlice = createSlice({
  name: 'test',
  initialState,
  reducers: {
    setMessage: (state, action: PayloadAction<string>) => {
      state.message = action.payload;
    },
  },
});

export const { setMessage } = testSlice.actions;
export default testSlice.reducer;
