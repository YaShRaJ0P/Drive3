import { createSlice } from "@reduxjs/toolkit";

const accountSlice = createSlice({
  name: "account",
  initialState: "",
  reducers: {
    setAccount: (state, action) => {
      return action.payload;
    },
  },
});

export const { setAccount } = accountSlice.actions;
export const accountReducer = accountSlice.reducer;
