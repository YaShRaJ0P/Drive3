import { useEffect, useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import { Homedisconnect } from "./component/Homedisconnect";
import { Modalbox } from "./component/Modalbox";
import { Navbar } from "./component/Navbar";
import { FileUpload } from "./component/FileUpload";
import { Files } from "./component/Files";
import { Friends } from "./component/Friends";
import { ApprovedFiles } from "./component/ApprovedFiles";
import {
  approvedFilesfromFriends,
  getFiles,
  getFriends,
  initializeEthers,
} from "./utils/functions";
import { useAppContext } from "./utils/context";

export const App = () => {
  const [contract, setContract] = useState(null);
  const {
    account,
    updateAccount,
    updateFiles,
    updateFriends,
    updateApprovedFiles,
  } = useAppContext();

  const setAccountToLocalStorage = (account) => {
    if (account) {
      localStorage.setItem("connectedAccount", account);
    } else {
      localStorage.removeItem("connectedAccount");
    }
  };

  const checkConnectedAccount = async () => {
    try {
      const { ethereum } = window;
      if (!ethereum) {
        toast.error("MetaMask is not installed!", {
          id: "connect-wallet",
        });
        return;
      }

      const accounts = await ethereum.request({ method: "eth_accounts" });
      if (accounts.length > 0) {
        const currentAccount = accounts[0];
        const storedAccount = localStorage.getItem("connectedAccount");

        // If no mismatch and a valid account exists, initialize and fetch data
        if (!storedAccount || storedAccount === currentAccount) {
          const contract = await initializeEthers(ethereum);
          setContract(contract);
          updateAccount(currentAccount);
          setAccountToLocalStorage(currentAccount);

          // Fetch files, friends, and approved files
          const [files, friends, approvedFiles] = await Promise.all([
            getFiles(contract),
            getFriends(contract),
            approvedFilesfromFriends(contract),
          ]);

          updateFiles(files);
          updateFriends(friends);
          updateApprovedFiles(approvedFiles);
        } else {
          // Handle mismatch
          setAccountToLocalStorage(null);
          updateAccount("Not Connected");
          toast.error("Account mismatch detected. Please reconnect.", {
            id: "connect-wallet",
          });
        }
      } else {
        // No accounts connected
        setAccountToLocalStorage(null);
        updateAccount("Not Connected");
      }
    } catch (error) {
      console.error("Error fetching account from MetaMask:", error);
      setAccountToLocalStorage(null);
    }
  };

  const handleAccountsChanged = async (accounts) => {
    if (accounts.length === 0) {
      // If the user disconnects their account
      setAccountToLocalStorage(null);
      updateAccount("Not Connected");
      updateFiles([]);
      updateFriends([]);
      updateApprovedFiles([]);
      toast.success("Wallet disconnected!", {
        id: "connect-wallet",
      });
    } else {
      const account = accounts[0];
      updateAccount(account);
      setAccountToLocalStorage(account);
      toast.success("Wallet connected successfully!", {
        id: "connect-wallet",
      });

      if (contract) {
        // Re-fetch data for the new account
        const [files, friends, approvedFiles] = await Promise.all([
          getFiles(contract),
          getFriends(contract),
          approvedFilesfromFriends(contract),
        ]);

        updateFiles(files);
        updateFriends(friends);
        updateApprovedFiles(approvedFiles);
      }
    }
  };

  useEffect(() => {
    const { ethereum } = window;

    const fetchData = async () => {
      await checkConnectedAccount();

      if (ethereum) {
        ethereum.on("accountsChanged", handleAccountsChanged);
      }
    };

    fetchData();

    return () => {
      if (ethereum) {
        ethereum.removeListener("accountsChanged", handleAccountsChanged);
      }
    };
  }, [contract]);

  return (
    <>
      <Toaster position="bottom-right" reverseOrder={false} />
      {account === "Not Connected" ? (
        <Homedisconnect />
      ) : (
        <div className="min-h-screen max-w-screen bg-black text-white flex flex-col gap-4 relative px-2 font-outfit">
          <Modalbox contract={contract} />
          <Navbar />
          <FileUpload contract={contract} />
          <Files />
          <Friends contract={contract} />
          <ApprovedFiles />
        </div>
      )}
    </>
  );
};
