import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Emergency } from '../../types';

interface EmergencyState {
  activeEmergency: Emergency | null;
  history: Emergency[];
}

const initialState: EmergencyState = {
  activeEmergency: null,
  history: [],
};

const emergencySlice = createSlice({
  name: 'emergency',
  initialState,
  reducers: {
    activateEmergency: (state, action: PayloadAction<Emergency>) => {
      state.activeEmergency = action.payload;
      state.history.push(action.payload);
    },
    resolveEmergency: (state) => {
      if (state.activeEmergency) {
        state.activeEmergency.status = 'resolved';
        state.activeEmergency = null;
      }
    },
    updateEmergencyAction: (state, action: PayloadAction<{ emergencyId: string; actionId: string; completed: boolean }>) => {
      if (state.activeEmergency?.id === action.payload.emergencyId) {
        const actionItem = state.activeEmergency.actions.find(a => a.id === action.payload.actionId);
        if (actionItem) {
          actionItem.completed = action.payload.completed;
        }
      }
    },
  },
});

export const { activateEmergency, resolveEmergency, updateEmergencyAction } = emergencySlice.actions;
export default emergencySlice.reducer;