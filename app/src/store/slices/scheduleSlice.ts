import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Schedule } from '../../types';

interface ScheduleState {
  items: Schedule[];
  nextEvent: Schedule | null;
}

const initialState: ScheduleState = {
  items: [],
  nextEvent: null,
};

const scheduleSlice = createSlice({
  name: 'schedule',
  initialState,
  reducers: {
    setScheduleItems: (state, action: PayloadAction<Schedule[]>) => {
      state.items = action.payload;
      // 다음 일정 자동 계산
      const now = new Date();
      const upcoming = action.payload
        .filter(item => new Date(item.time) > now)
        .sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());
      state.nextEvent = upcoming[0] || null;
    },
    addScheduleItem: (state, action: PayloadAction<Schedule>) => {
      state.items.push(action.payload);
    },
  },
});

export const { setScheduleItems, addScheduleItem } = scheduleSlice.actions;
export default scheduleSlice.reducer;