import { createSlice } from "@reduxjs/toolkit";

const friendsSlice = createSlice({
  name: "friends",
  initialState: [],
  reducers: {
    setFriends: (state, action) => {
      return action.payload;
    },
  },
});

export const { setFriends } = friendsSlice.actions;
export const friendsReducer = friendsSlice.reducer;
