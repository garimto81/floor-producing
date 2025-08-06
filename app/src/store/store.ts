import { configureStore } from '@reduxjs/toolkit';
import appReducer from './slices/appSlice';
import checklistReducer from './slices/checklistSlice';
import productionReducer from './slices/productionSlice';
import teamReducer from './slices/teamSlice';
import scheduleReducer from './slices/scheduleSlice';
import emergencyReducer from './slices/emergencySlice';

export const store = configureStore({
  reducer: {
    app: appReducer,
    checklist: checklistReducer,
    production: productionReducer,
    team: teamReducer,
    schedule: scheduleReducer,
    emergency: emergencyReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;