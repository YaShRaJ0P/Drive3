import { createSlice } from "@reduxjs/toolkit";

const dialogBox = Object.freeze({
  CLOSE: 0,
  LIST: 1,
  APPROVE_FILE: 2,
  DISAPPROVE_FILE: 3,
});

const modalSlice = createSlice({
  name: "modal",
  initialState: {
    openModal: dialogBox.CLOSE,
    ipfsHash: "",
  },
  reducers: {
    setModal: (state, action) => {
      return action.payload;
    },
  },
});

export const { setModal } = modalSlice.actions;
export const modalReducer = modalSlice.reducer;
