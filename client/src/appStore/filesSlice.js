import { createSlice } from "@reduxjs/toolkit";

const filesSlice = createSlice({
  name: "files",
  initialState: [],
  reducers: {
    setFiles: (state, action) => {
      return action.payload;
    },
  },
});

export const { setFiles } = filesSlice.actions;
export const filesReducer = filesSlice.reducer;
