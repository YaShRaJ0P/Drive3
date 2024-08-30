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

  const checkConnectedAccount = async () => {
    try {
      const { ethereum } = window;
      if (!ethereum) {
        toast.error("MetaMask is not installed!", {
          id: "connect-wallet",
        });
        return;
      }

      const storedAccount = localStorage.getItem("connectedAccount");
      if (storedAccount) {
        const contract = await initializeEthers(ethereum);
        setContract(contract);
        updateAccount(storedAccount);
        let files = await getFiles(contract);
        updateFiles(files);
        let friends = await getFriends(contract);
        updateFriends(friends);
        let approvedFiles = await approvedFilesfromFriends(contract);
        updateApprovedFiles(approvedFiles);
      }
    } catch (error) {
      console.error("Error fetching account from MetaMask:", error);
      localStorage.removeItem("connectedAccount");
    }
  };

  const handleAccountsChanged = (accounts) => {
    if (accounts.length === 0) {
      localStorage.removeItem("connectedAccount");
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
      localStorage.setItem("connectedAccount", account);
      window.location.reload(false);
      toast.success("Wallet connected successfully!", {
        id: "connect-wallet",
      });
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
