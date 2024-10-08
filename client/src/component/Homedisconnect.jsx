import React from "react";
import toast from "react-hot-toast";
import {
  approvedFilesfromFriends,
  getFiles,
  getFriends,
  initializeEthers,
} from "../utils/functions";
import { useAppContext } from "../utils/context";
export const Homedisconnect = () => {
  const { updateAccount, updateFriends, updateFiles, updateApprovedFiles } =
    useAppContext();

  const connectWallet = async () => {
    try {
      const { ethereum } = window;
      if (!ethereum) {
        toast.error("MetaMask is not installed!", {
          id: "connect-wallet",
        });
        return;
      }

      const accounts = await ethereum.request({
        method: "eth_requestAccounts",
      });
      const account = accounts[0];

      const contract = await initializeEthers(ethereum);
      await updateAccount(account);

      let files = await getFiles(contract);
      updateFiles(files);

      let friends = await getFriends(contract);
      updateFriends(friends);

      let approvedFiles = await approvedFilesfromFriends(contract);
      updateApprovedFiles(approvedFiles);

      toast.success("Wallet connected successfully!", {
        id: "connect-wallet",
      });
    } catch (error) {
      console.error("Error connecting to MetaMask:", error);
      updateAccount("Not Connected");
      toast.error(
        error.code === 4001
          ? "Connection denied!"
          : error.code === -32002
          ? "Request already pending!"
          : "Error connecting to MetaMask!",
        { id: "connect-wallet" }
      );
    }
  };
  return (
    <section className="flex flex-col h-screen bg-black">
      <h1 className="text-white font-elianto font-semibold p-3 border-b-2 border-b-[#C4FF5A] flex items-center tracking-widest text-lg">
        DRIVE3
      </h1>
      <div className="grid flex-1 place-items-center max-w-screen">
        <button
          onClick={connectWallet}
          className="px-8 py-2 rounded-full bg-[#C4FF5A] border-white border-2 font-semibold text-black focus:ring-2 hover:shadow-[0_0_2px_#fff,inset_0_0_2px_#fff,0_0_5px_#C4FF5A,0_0_15px_#C4FF5A,0_0_20px_#C4FF5A] transition-all duration-200"
        >
          Connect Metamask
        </button>
      </div>
    </section>
  );
};
