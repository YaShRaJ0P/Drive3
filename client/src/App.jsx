import { useEffect, useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import { Homedisconnect } from "./component/Homedisconnect";
import { Modalbox } from "./component/Modalbox";
import { Navbar } from "./component/Navbar";
import { FileUpload } from "./component/FileUpload";
import { Files } from "./component/Files";
import { Friends } from "./component/Friends";
import { ApprovedFiles } from "./component/ApprovedFiles";
import { ethers } from "ethers";
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

  const checkConnectedAccount = async () => {
    try {
      const { ethereum } = window;
      if (!ethereum) {
        toast.error("MetaMask is not installed!", {
          id: "connect-wallet",
        });
        return;
      }

      let storedAccount;

      const provider = new ethers.BrowserProvider(ethereum);
      const accounts = await provider.listAccounts();

      if (accounts.length > 0) {
        console.log("Connected to MetaMask:", accounts[0]);
        storedAccount = accounts[0].address;
      } else {
        console.log("MetaMask is installed but not connected.");
      }

      if (storedAccount) {
        const currentContract = await initializeEthers(ethereum);
        setContract(currentContract);
        updateAccount(storedAccount);
        console.log(currentContract);
        let files = await getFiles(currentContract);
        updateFiles(files);
        let friends = await getFriends(currentContract);
        updateFriends(friends);
        let approvedFiles = await approvedFilesfromFriends(currentContract);
        updateApprovedFiles(approvedFiles);
      }
    } catch (error) {
      console.error("Error fetching account from MetaMask:", error);
      toast.error("Error connecting to MetaMask. Please try again.");
    }
  };

  const handleAccountsChanged = async (accounts) => {
    try {
      const { ethereum } = window;
      if (!ethereum) {
        toast.error("MetaMask is not installed!", {
          id: "connect-wallet",
        });
        return;
      }
      console.log(accounts);
      if (accounts.length === 0) {
        updateAccount("Not Connected");
        updateFiles([]);
        updateFriends([]);
        updateApprovedFiles([]);
        toast.success("Wallet disconnected!", {
          id: "connect-wallet",
        });
      } else {
        const currentContract = await initializeEthers(ethereum);
        setContract(currentContract);
        const account = accounts[0];
        updateAccount(account);
        let friends = await getFriends(currentContract);
        updateFriends(friends);
        let files = await getFiles(currentContract);
        updateFiles(files);
        let approvedFiles = await approvedFilesfromFriends(currentContract);
        updateApprovedFiles(approvedFiles);
        toast.success("Wallet connected successfully!", {
          id: "connect-wallet",
        });
      }
    } catch (error) {
      console.error("Error handling account change:", error);
      toast.error("Error during account change. Please try again.");
    }
  };

  useEffect(() => {
    async function fetchData() {
      await checkConnectedAccount();
      const { ethereum } = window;
      if (ethereum) {
        ethereum.on("accountsChanged", handleAccountsChanged);
      }

      return () => {
        if (ethereum) {
          ethereum.removeListener("accountsChanged", handleAccountsChanged);
        }
      };
    }
    fetchData();
  }, []);

  return (
    <>
      <Toaster position="bottom-right" reverseOrder={false} />
      {account === "Not Connected" ? (
        <Homedisconnect />
      ) : (
        <div className="relative flex flex-col min-h-screen gap-4 px-2 text-white bg-black max-w-screen font-outfit">
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
