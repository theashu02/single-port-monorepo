import { configureStore } from '@reduxjs/toolkit';
import testReducer from './slices/testSlice';

export const makeStore = () => {
  return configureStore({
    reducer: {
      test: testReducer,
    },
  });
};

// Infer the type of makeStore
export type AppStore = ReturnType<typeof makeStore>;
// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<AppStore['getState']>;
export type AppDispatch = AppStore['dispatch'];
