import { createSlice } from "@reduxjs/toolkit";

const approvedfilesSlice = createSlice({
  name: "approvedFiles",
  initialState: [],
  reducers: {
    setApprovedfiles: (state, action) => {
      return action.payload;
    },
  },
});

export const { setApprovedfiles } = approvedfilesSlice.actions;
export const approvedfilesReducer = approvedfilesSlice.reducer;
