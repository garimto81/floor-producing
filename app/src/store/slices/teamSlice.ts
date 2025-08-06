import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { TeamMember } from '../../types';

interface TeamState {
  members: TeamMember[];
}

const initialState: TeamState = {
  members: [],
};

const teamSlice = createSlice({
  name: 'team',
  initialState,
  reducers: {
    setTeamMembers: (state, action: PayloadAction<TeamMember[]>) => {
      state.members = action.payload;
    },
    updateMemberStatus: (state, action: PayloadAction<{ id: string; status: TeamMember['status'] }>) => {
      const member = state.members.find(m => m.id === action.payload.id);
      if (member) {
        member.status = action.payload.status;
      }
    },
  },
});

export const { setTeamMembers, updateMemberStatus } = teamSlice.actions;
export default teamSlice.reducer;