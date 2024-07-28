import { useEffect, useState } from "react";
import { ethers } from "ethers";
import { contractAddress } from "./AddressABI/contractAddress";
import { contractABI } from "./AddressABI/contractABI";
import axios from "axios";
import FormData from "form-data";
import { IoCloseSharp } from "react-icons/io5";
import { IoAddSharp } from "react-icons/io5";

export const App = () => {
  const [account, setAccount] = useState("Not Connected");
  const [contract, setContract] = useState(null);
  const [file, setFile] = useState(null);
  const [files, setFiles] = useState([]);
  const [friends, setFriends] = useState([]);
  const [friendAddress, setFriendAddress] = useState("");
  const [approveFileModal, setApproveFileModal] = useState(false);
  const [approvedFriends, setApprovedFriends] = useState([]);

  const initializeEthers = async (ethereum) => {
    const provider = new ethers.BrowserProvider(ethereum);
    const signer = await provider.getSigner();
    const contract = new ethers.Contract(contractAddress, contractABI, signer);
    return contract;
  };

  const connectWallet = async () => {
    try {
      const { ethereum } = window;
      if (!ethereum) {
        console.error("MetaMask is not installed!");
        return;
      }

      const accounts = await ethereum.request({
        method: "eth_requestAccounts",
      });
      const account = accounts[0];

      const contract = await initializeEthers(ethereum);
      setContract(contract);
      setAccount(account);

      localStorage.setItem("connectedAccount", account);
      await getFiles(contract);
      await getFriends(contract);
    } catch (error) {
      console.error("Error connecting to MetaMask:", error);
    }
  };

  const checkConnectedAccount = async () => {
    try {
      const { ethereum } = window;
      if (!ethereum) {
        console.error("MetaMask is not installed!");
        return;
      }

      const storedAccount = localStorage.getItem("connectedAccount");
      if (storedAccount) {
        const contract = await initializeEthers(ethereum);
        setContract(contract);
        setAccount(storedAccount);
        await getFiles(contract);
        await getFriends(contract);
      }
    } catch (error) {
      console.error("Error fetching account from MetaMask:", error);
    }
  };

  const handleAccountsChanged = (accounts) => {
    if (accounts.length === 0) {
      localStorage.removeItem("connectedAccount");
      setAccount("Not Connected");
      setFiles([]);
    } else {
      const account = accounts[0];
      setAccount(account);
      localStorage.setItem("connectedAccount", account);
    }
  };

  const uploadFile = async (e) => {
    e.preventDefault();
    if (!file || !contract) {
      return;
    }

    try {
      const ipfsHash = await uploadFileToIPFS(file);
      const transaction = await contract.addFile(ipfsHash);
      await transaction.wait();
      await getFiles(contract);
      setFile(null);
    } catch (error) {
      console.error("Error uploading file:", error);
    }
  };

  const uploadFileToIPFS = async (file) => {
    const JWT = process.env.REACT_APP_PINATA_JWT;

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await axios.post(
        "https://api.pinata.cloud/pinning/pinFileToIPFS",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${JWT}`,
          },
        }
      );
      return response.data.IpfsHash;
    } catch (error) {
      console.error("Error uploading to IPFS:", error);
      throw error;
    }
  };

  const getFiles = async (contract) => {
    try {
      const files = await contract.getAllFiles();
      setFiles(files);
    } catch (error) {
      console.error("Error fetching files:", error);
    }
  };

  const downloadFile = async (ipfsHash) => {
    const url = `https://gateway.pinata.cloud/ipfs/${ipfsHash}`;

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      const blob = await response.blob();

      const link = document.createElement("a");
      const downloadUrl = URL.createObjectURL(blob);
      link.href = downloadUrl;
      link.setAttribute("download", ipfsHash);
      document.body.appendChild(link);
      link.click();
      URL.revokeObjectURL(downloadUrl);
      document.body.removeChild(link);
    } catch (error) {
      console.error("Error downloading the file:", error);
    }
  };

  const deleteFile = async (ipfsHash) => {
    const JWT = process.env.REACT_APP_PINATA_JWT;

    // Function to remove the file from IPFS using Pinata's unpin API
    const unpinFromIPFS = async (ipfsHash) => {
      try {
        await axios.delete(
          `https://api.pinata.cloud/pinning/unpin/${ipfsHash}`,
          {
            headers: {
              Authorization: `Bearer ${JWT}`,
            },
          }
        );
      } catch (error) {
        console.error(`Error unpinning file from IPFS: ${error}`);
        throw error;
      }
    };

    try {
      // Remove the file from IPFS
      await unpinFromIPFS(ipfsHash);

      // Remove the file from the smart contract
      const transaction = await contract.deleteFile(ipfsHash);
      await transaction.wait();

      // Refresh the list of files
      await getFiles(contract);
    } catch (error) {
      console.error("Error removing the file:", error);
    }
  };

  const addFriend = async (e) => {
    e.preventDefault();
    if (!friendAddress || !contract) {
      return;
    }

    try {
      const transaction = await contract.addFriend(friendAddress);
      await transaction.wait();
      await getFriends(contract);
      setFriendAddress("");
    } catch (error) {
      console.error("Error uploading file:", error);
    }
  };

  const removeFriend = async (friendAddress) => {
    if (!friendAddress) {
      return;
    }
    try {
      const transaction = await contract.removeFriend(friendAddress);
      await transaction.wait();
      await getFriends(contract);
    } catch (error) {
      console.error("Error deleting friend:", error);
    }
  };

  const getFriends = async (contract) => {
    try {
      const friends = await contract.getFriends();
      setFriends(friends);
    } catch (error) {
      console.error("Error getting friends:", error);
    }
  };

  const toggleApproval = (friend) => {
    if (approvedFriends.includes(friend)) {
      setApprovedFriends(approvedFriends.filter((f) => f !== friend));
    } else {
      setApprovedFriends([...approvedFriends, friend]);
    }
  };

  useEffect(() => {
    checkConnectedAccount();
    const { ethereum } = window;
    if (ethereum) {
      ethereum.on("accountsChanged", handleAccountsChanged);
    }
    return () => {
      if (ethereum) {
        ethereum.removeListener("accountsChanged", handleAccountsChanged);
      }
    };
  }, []);

  return account === "Not Connected" ? (
    <div className="bg-[#FFF9D0] grid place-items-center min-h-screen max-w-screen">
      <button
        onClick={connectWallet}
        className="px-8 py-2 rounded-full bg-gradient-to-b from-[#5AB2FF] to-[#A0DEFF] text-white focus:ring-2 focus:ring-[#CAF4FF] hover:shadow-xl hover:shadow-[#CAF4FF] transition duration-200"
      >
        {account === "Not Connected" ? "Connect Metamask" : account}
      </button>
    </div>
  ) : (
    <div className="min-h-screen max-w-screen bg-[#FFF9D0] flex flex-col gap-4 relative">
      {approveFileModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-md shadow-md max-w-full text-center">
            <div className="flex flex-row justify-between items-center w-full mb-4">
              <h2 className="text-lg font-bold">Approve File</h2>
              <button
                onClick={() => {
                  setApproveFileModal(false);
                  setApprovedFriends([]);
                }}
              >
                <IoCloseSharp className="text-gray-400 hover:text-gray-600 transition-opacity duration-300 cursor-pointer" />
              </button>
            </div>

            <div className="flex flex-col gap-1">
              {friends.map((friend, index) =>
                approvedFriends.includes(friend) ? (
                  <div
                    key={index}
                    className="px-2 py-1 bg-green-500 rounded-md text-white font-semibold flex justify-center items-center gap-2"
                  >
                    {friend}
                    <div className="border border-green-700 w-[2px] h-full bg-green-700"></div>
                    <button
                      onClick={() => toggleApproval(friend)}
                      className="text-white flex justify-center items-center"
                    >
                      <IoCloseSharp className="font-semibold" />
                    </button>
                  </div>
                ) : (
                  <div
                    key={index}
                    className="px-2 py-1 bg-red-500 rounded-md text-white font-semibold flex justify-center items-center gap-2"
                  >
                    {friend}
                    <div className="border border-red-700 w-[2px] h-full bg-red-700"></div>
                    <button
                      onClick={() => toggleApproval(friend)}
                      className="text-white flex justify-center items-center"
                    >
                      <IoAddSharp className="font-semibold" />
                    </button>
                  </div>
                )
              )}
            </div>

            <button
              className="px-8 py-2 mt-1 rounded-full bg-gradient-to-b from-[#5AB2FF] to-[#A0DEFF] text-white focus:ring-2 focus:ring-[#CAF4FF] hover:shadow-xl hover:shadow-[#CAF4FF] transition duration-200"
              onClick={() => {
                setApproveFileModal(false);
              }}
            >
              Approve
            </button>
          </div>
        </div>
      )}

      <section className="bg-[#5AB2FF] text-white font-semibold px-3 py-2 flex flex-row justify-between items-center">
        <h1>DRIVE3</h1>
        <h2>Connected Account: {account}</h2>
      </section>
      <section>
        <form
          onSubmit={uploadFile}
          className="flex flex-row justify-center items-center gap-6"
        >
          <input
            type="file"
            name="file"
            id="file"
            onChange={(e) => setFile(e.target.files[0])}
          />
          <button
            type="submit"
            className="px-8 py-2 rounded-sm bg-gradient-to-b from-[#5AB2FF] to-[#A0DEFF] text-white focus:ring-2 focus:ring-[#CAF4FF] hover:shadow-xl hover:shadow-[#CAF4FF] transition duration-200"
          >
            Upload File
          </button>
        </form>
      </section>
      <section>
        <div className="text-xl font-bold underline mb-2">FILES</div>
        <div className="flex flex-row gap-2">
          {files.map((file, index) => (
            <div key={index} className="bg-white p-2 rounded-md shadow-md">
              <div className="relative">
                <img
                  src={`https://gateway.pinata.cloud/ipfs/${file.ipfsHash}`}
                  alt=""
                  className={`w-40 h-40 object-cover ${
                    approveFileModal && "opacity-50"
                  } `}
                />
                <button
                  onClick={() => deleteFile(file.ipfsHash)}
                  className={`absolute top-0 right-0 mt-2 mr-2 rounded-full p-1 bg-gray-400 text-white flex justify-center items-center ${
                    approveFileModal && "opacity-50"
                  }`}
                >
                  <IoCloseSharp />
                </button>
              </div>
              <p className="text-sm text-gray-500">
                Uploaded:{" "}
                {new Date(Number(file.timestamp) * 1000).toLocaleString()}
              </p>
              <div className="flex flex-row justify-between items-center w-full">
                <button
                  onClick={() => downloadFile(file.ipfsHash)}
                  className="mt-2 px-4 py-1 rounded-sm bg-gradient-to-b from-[#5AB2FF] to-[#A0DEFF] text-white focus:ring-2 focus:ring-[#CAF4FF] hover:shadow-xl hover:shadow-[#CAF4FF] transition duration-200"
                >
                  Download
                </button>
                <button
                  onClick={() => setApproveFileModal(true)}
                  className="mt-2 px-4 py-1 rounded-sm bg-gradient-to-b from-[#5AB2FF] to-[#A0DEFF] text-white focus:ring-2 focus:ring-[#CAF4FF] hover:shadow-xl hover:shadow-[#CAF4FF] transition duration-200"
                >
                  Approve
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
      <section>
        <h3 className="text-xl font-bold underline mb-2">FRIENDS</h3>
        <form
          onSubmit={addFriend}
          className="flex flex-row justify-center items-center gap-6"
        >
          <input
            type="text"
            name="address"
            id="address"
            value={friendAddress}
            onChange={(e) => setFriendAddress(e.target.value)}
          />
          <button
            type="submit"
            className="px-8 py-2 rounded-sm bg-gradient-to-b from-[#5AB2FF] to-[#A0DEFF] text-white focus:ring-2 focus:ring-[#CAF4FF] hover:shadow-xl hover:shadow-[#CAF4FF] transition duration-200"
          >
            Add
          </button>
        </form>
        <div className="flex flex-row gap-2">
          {friends.map((friend, index) => (
            <div
              key={index}
              className="px-2 py-1 bg-red-500 rounded-md text-white font-semibold flex justify-center items-center gap-2"
            >
              {friend}
              <span className="border border-red-700 w-[2px] h-full bg-red-700"></span>
              <button
                onClick={() => removeFriend(friend)}
                className="text-white flex justify-center items-center"
              >
                <IoCloseSharp className="font-semibold" />
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
