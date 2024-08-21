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
import { useDispatch, useSelector } from "react-redux";
import { setAccount } from "./appStore/accountStore";
import { setFiles } from "./appStore/filesSlice";
import { setFriends } from "./appStore/friendsSlice";
import { setApprovedfiles } from "./appStore/approvedfilesSlice";

export const App = () => {
  const [contract, setContract] = useState(null);
  const dispatch = useDispatch();
  const account = useSelector((state) => state.account);

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
        dispatch(setAccount(storedAccount));

        let files = await getFiles(contract);
        dispatch(setFiles(files));
        let friends = await getFriends(contract);
        dispatch(setFriends(friends));
        let approvedFiles = await approvedFilesfromFriends(contract);
        dispatch(setApprovedfiles(approvedFiles));
      }
    } catch (error) {
      console.error("Error fetching account from MetaMask:", error);
      localStorage.removeItem("connectedAccount");
    }
  };

  const handleAccountsChanged = (accounts) => {
    if (accounts.length === 0) {
      localStorage.removeItem("connectedAccount");
      dispatch(setAccount("Not Connected"));
      dispatch(setFiles([]));
      dispatch(setFriends([]));
      dispatch(setApprovedfiles([]));
      toast.success("Wallet disconnected!", {
        id: "connect-wallet",
      });
    } else {
      const account = accounts[0];
      dispatch(setAccount(account));
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
