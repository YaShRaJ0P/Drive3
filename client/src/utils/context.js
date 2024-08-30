import React, { createContext, useState, useContext } from "react";

// Define the dialog box constants
const dialogBox = Object.freeze({
  CLOSE: 0,
  LIST: 1,
  APPROVE_FILE: 2,
  DISAPPROVE_FILE: 3,
});

// Initial state for the context
const defaultProvider = {
  modal: {
    openModal: dialogBox.CLOSE,
    ipfsHash: "",
  },
  friends: [],
  files: [],
  approvedFiles: [],
  account: "",
};

// Create the context
const Context = createContext(defaultProvider);

// Create a provider component
export const ContextProvider = ({ children }) => {
  // State for modal
  const [modal, setModal] = useState(defaultProvider.modal);

  // State for friends
  const [friends, setFriends] = useState(defaultProvider.friends);

  // State for files
  const [files, setFiles] = useState(defaultProvider.files);

  // State for approved files
  const [approvedFiles, setApprovedFiles] = useState(
    defaultProvider.approvedFiles
  );

  // State for account
  const [account, setAccount] = useState(defaultProvider.account);

  // Function to update modal state
  const updateModal = (newModalState) => {
    setModal((prev) => ({ ...prev, ...newModalState }));
  };

  // Function to update friends
  const updateFriends = (newFriends) => {
    setFriends(newFriends);
  };

  // Function to update files
  const updateFiles = (newFiles) => {
    setFiles(newFiles);
  };

  // Function to update approved files
  const updateApprovedFiles = (newApprovedFiles) => {
    setApprovedFiles(newApprovedFiles);
  };

  // Function to update account
  const updateAccount = (newAccount) => {
    setAccount(newAccount);
  };

  const values = {
    modal,
    updateModal,
    friends,
    updateFriends,
    files,
    updateFiles,
    approvedFiles,
    updateApprovedFiles,
    account,
    updateAccount,
  };

  return <Context.Provider value={values}>{children}</Context.Provider>;
};

// Custom hook for consuming context values
export const useAppContext = () => useContext(Context);
