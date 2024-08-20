import { configureStore } from "@reduxjs/toolkit";
import { accountReducer } from "./accountStore";
import { modalReducer } from "./modalSlice";
import { friendsReducer } from "./friendsSlice";
import { filesReducer } from "./filesSlice";
import { approvedfilesReducer } from "./approvedfilesSlice";

const appStore = configureStore({
  reducer: {
    address: accountReducer,
    modal: modalReducer,
    friends: friendsReducer,
    files: filesReducer,
    approvedFiles: approvedfilesReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});
export default appStore;
