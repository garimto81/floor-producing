import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AppState } from '../../types';

const initialState: AppState = {
  mode: 'normal',
  isOffline: false,
  lastSync: new Date(),
};

const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    setMode: (state, action: PayloadAction<AppState['mode']>) => {
      state.mode = action.payload;
    },
    setOfflineStatus: (state, action: PayloadAction<boolean>) => {
      state.isOffline = action.payload;
    },
    updateLastSync: (state) => {
      state.lastSync = new Date();
    },
  },
});

export const { setMode, setOfflineStatus, updateLastSync } = appSlice.actions;
export default appSlice.reducer;