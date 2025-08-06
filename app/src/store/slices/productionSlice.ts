import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ProductionStatus } from '../../types';

const initialState: ProductionStatus = {
  featureTables: {
    total: 3,
    active: 3,
    issues: 0,
  },
  dataTransfer: {
    speed: 0,
    total: 0,
    status: 'stable',
  },
  team: {
    total: 12,
    active: 12,
    onBreak: 0,
    offline: 0,
  },
};

const productionSlice = createSlice({
  name: 'production',
  initialState,
  reducers: {
    updateProductionStatus: (state, action: PayloadAction<Partial<ProductionStatus>>) => {
      return { ...state, ...action.payload };
    },
    updateFeatureTables: (state, action: PayloadAction<Partial<ProductionStatus['featureTables']>>) => {
      state.featureTables = { ...state.featureTables, ...action.payload };
    },
    updateDataTransfer: (state, action: PayloadAction<Partial<ProductionStatus['dataTransfer']>>) => {
      state.dataTransfer = { ...state.dataTransfer, ...action.payload };
    },
    updateTeamStatus: (state, action: PayloadAction<Partial<ProductionStatus['team']>>) => {
      state.team = { ...state.team, ...action.payload };
    },
  },
});

export const { 
  updateProductionStatus, 
  updateFeatureTables,
  updateDataTransfer,
  updateTeamStatus 
} = productionSlice.actions;
export default productionSlice.reducer;