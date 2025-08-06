import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ChecklistItem } from '../../types';

interface ChecklistState {
  items: ChecklistItem[];
  activeCategory: ChecklistItem['category'];
}

const initialState: ChecklistState = {
  items: [],
  activeCategory: 'morning',
};

const checklistSlice = createSlice({
  name: 'checklist',
  initialState,
  reducers: {
    setChecklistItems: (state, action: PayloadAction<ChecklistItem[]>) => {
      state.items = action.payload;
    },
    toggleChecklistItem: (state, action: PayloadAction<string>) => {
      const item = state.items.find(i => i.id === action.payload);
      if (item) {
        item.completed = !item.completed;
      }
    },
    setActiveCategory: (state, action: PayloadAction<ChecklistItem['category']>) => {
      state.activeCategory = action.payload;
    },
    resetDailyChecklist: (state) => {
      state.items = state.items.map(item => ({ ...item, completed: false }));
    },
  },
});

export const { 
  setChecklistItems, 
  toggleChecklistItem, 
  setActiveCategory,
  resetDailyChecklist 
} = checklistSlice.actions;
export default checklistSlice.reducer;