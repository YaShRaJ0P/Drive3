import { useEffect, useState } from "react";
import { ethers } from "ethers";
import { contractAddress } from "./AddressABI/contractAddress";
import { contractABI } from "./AddressABI/contractABI";
import axios from "axios";
import FormData from "form-data";
import { IoCloseSharp, IoEllipsisVertical } from "react-icons/io5";
import { IoAddSharp } from "react-icons/io5";
import { FileUploader } from "react-drag-drop-files";
import { FaDownload, FaUserPlus, FaUserMinus } from "react-icons/fa";
import { MdDeleteForever, MdKeyboardBackspace } from "react-icons/md";

export const App = () => {
  const dialogBox = Object.freeze({
    CLOSE: 0,
    LIST: 1,
    APPROVE_FILE: 2,
    DISAPPROVE_FILE: 3,
  });
  const [account, setAccount] = useState("Not Connected");
  const [contract, setContract] = useState(null);
  const [file, setFile] = useState(null);
  const [files, setFiles] = useState([]);
  const [friends, setFriends] = useState([]);
  const [friendAddress, setFriendAddress] = useState("");
  const [approveFileModal, setApproveFileModal] = useState({
    openModal: dialogBox.CLOSE,
    ipfsHash: "",
  });
  const [selctedFriends, setSelctedFriends] = useState([]);
  const [approvedFiles, setApprovedFiles] = useState([]);
  const [friendsApprovalAddress, setFriendsApprovalAddress] = useState(null);

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
      await approvedFilesfromFriends(contract);
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
        await approvedFilesfromFriends(contract);
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
      window.location.reload(false);
    }
  };

  const uploadFile = async (e) => {
    e.preventDefault();
    if (!file || !contract) {
      return;
    }

    try {
      const ipfsHash = await uploadFileToIPFS(file);
      const transaction = await contract.addFile(file.name, ipfsHash);
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

    //Make a function to find file using ipfsHash and download it by the name of that file

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      const blob = await response.blob();
      console.log(response);
      const link = document.createElement("a");
      const downloadUrl = URL.createObjectURL(blob);
      link.href = downloadUrl;
      console.log(downloadUrl);
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
      // Remove the file from the smart contract
      const transaction = await contract.deleteFile(ipfsHash);
      await transaction.wait();
      console.log(transaction);
      // Remove the file from IPFS
      await unpinFromIPFS(ipfsHash);

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
      await approvedFilesfromFriends(contract);
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
      await approvedFilesfromFriends(contract);
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
    if (selctedFriends.includes(friend)) {
      setSelctedFriends(selctedFriends.filter((f) => f !== friend));
    } else {
      setSelctedFriends([...selctedFriends, friend]);
    }
  };

  const approveFile = async () => {
    if (!selctedFriends[0] || !contract || !approveFileModal.openModal) {
      return;
    }
    try {
      const transaction = await contract.approveFile(
        approveFileModal.ipfsHash,
        selctedFriends
      );
      await transaction.wait();
      setSelctedFriends([]);
      setApproveFileModal({ openModal: dialogBox.CLOSE, ipfsHash: "" });
    } catch (error) {
      console.log(error);
    }
  };

  const disapproveFile = async () => {
    if (!selctedFriends[0] || !contract || !approveFileModal.openModal) {
      return;
    }
    try {
      const transaction = await contract.disapproveFile(
        approveFileModal.ipfsHash,
        selctedFriends
      );
      await transaction.wait();
      setSelctedFriends([]);
      setApproveFileModal({ openModal: dialogBox.CLOSE, ipfsHash: "" });
    } catch (error) {
      console.log(error);
    }
  };

  const approvedFilesfromFriends = async (contract) => {
    try {
      let files = await contract.getApprovedFiles();
      if (files[1][0].length > 0) {
        setApprovedFiles(files);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const getFriendsApprovalStatus = async (ipfsHash) => {
    try {
      const approvalAddress = await contract.getFriendsApprovalStatus(ipfsHash);
      setFriendsApprovalAddress(approvalAddress);
      console.log(approvalAddress);
    } catch (error) {
      console.error("Error getting friends:", error);
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
  const [dragging, setDragging] = useState(false);

  const handleDraggingStateChange = (draggingState) => {
    setDragging(draggingState);
  };

  return account === "Not Connected" ? (
    <section className="bg-black">
      <div className="text-white font-semibold p-3 border-b-2 border-b-[#C4FF5A] flex items-center">
        <h1>DRIVE3</h1>
      </div>
      <div className="grid place-items-center min-h-screen max-w-screen">
        <button
          onClick={connectWallet}
          className="px-8 py-2 rounded-full bg-[#C4FF5A] border-white border-2 font-semibold text-black focus:ring-2 hover:shadow-[0_0_2px_#fff,inset_0_0_2px_#fff,0_0_5px_#C4FF5A,0_0_15px_#C4FF5A,0_0_20px_#C4FF5A] transition-all duration-200"
        >
          {account === "Not Connected" ? "Connect Metamask" : account}
        </button>
      </div>
    </section>
  ) : (
    <div className="min-h-screen max-w-screen bg-black text-white flex flex-col gap-4 relative">
      {approveFileModal.openModal === dialogBox.LIST && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <ul className="bg-white text-black w-96 rounded-md shadow-md flex flex-col justify-center">
            <li className="flex justify-between items-center border-b-2 border-b-black w-full font-bold text-lg">
              <h4 className="px-2 py-[6px]">Action</h4>
              <div className="pr-2">
                <button
                  className="flex items-center justify-center"
                  onClick={() => {
                    setApproveFileModal({
                      openModal: dialogBox.CLOSE,
                      ipfsHash: "",
                    });
                  }}
                >
                  <IoCloseSharp className="text-black hover:text-red-500 text-xl transition-all duration-200 cursor-pointer" />
                </button>
              </div>
            </li>
            <li className="border-b-2 border-b-black p-[10px] hover:bg-zinc-900 hover:text-white transition-all duration-200">
              <button
                className="w-full text-left flex flex-row gap-2 justify-start items-center font-medium"
                onClick={() => downloadFile(approveFileModal.ipfsHash)}
              >
                <FaDownload className=" text-lg" /> <span> Download</span>
              </button>
            </li>
            <li className="border-b-2 border-b-black p-[10px] hover:bg-zinc-900 hover:text-white transition-all duration-200">
              <button
                className="w-full text-left flex flex-row gap-2 justify-start items-center font-medium"
                onClick={() => {
                  setApproveFileModal({
                    ...approveFileModal,
                    openModal: dialogBox.APPROVE_FILE,
                  });
                  getFriendsApprovalStatus(approveFileModal.ipfsHash);
                }}
              >
                <FaUserPlus className=" text-lg" /> <span> Approve File</span>
              </button>
            </li>
            <li className="border-b-2 border-b-black p-[10px] hover:bg-zinc-900 hover:text-white transition-all duration-200">
              <button
                className="w-full text-left flex flex-row gap-2 justify-start items-center font-medium"
                onClick={() => {
                  setApproveFileModal({
                    ...approveFileModal,
                    openModal: dialogBox.DISAPPROVE_FILE,
                  });
                  getFriendsApprovalStatus(approveFileModal.ipfsHash);
                }}
              >
                <FaUserMinus className=" text-lg" />
                <span> Disapprove File</span>
              </button>
            </li>
            <li className="p-[10px] hover:bg-zinc-900 hover:text-white transition duration-200">
              <button
                className="w-full text-left flex flex-row gap-2 justify-start items-center font-medium"
                onClick={() => deleteFile(approveFileModal.ipfsHash)}
              >
                <MdDeleteForever className=" text-lg" />
                <span> Delete</span>
              </button>
            </li>
          </ul>
        </div>
      )}
      {approveFileModal.openModal === dialogBox.APPROVE_FILE && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-md shadow-md max-w-full text-center">
            <div className="flex flex-row justify-between items-center w-full mb-4">
              <button
                onClick={() => {
                  setApproveFileModal({
                    ...approveFileModal,
                    openModal: dialogBox.LIST,
                  });
                  setSelctedFriends([]);
                  setFriendsApprovalAddress(null);
                }}
              >
                <MdKeyboardBackspace className="text-black hover:text-teal-500 transition-all duration-200 cursor-pointer text-2xl" />
              </button>
              <h2 className="text-lg font-bold text-black">Approve File</h2>
              <button
                onClick={() => {
                  setApproveFileModal({
                    openModal: dialogBox.CLOSE,
                    ipfsHash: "",
                  });
                  setSelctedFriends([]);
                  setFriendsApprovalAddress(null);
                }}
              >
                <IoCloseSharp className="text-black hover:text-red-500 transition-all duration-200 cursor-pointer text-2xl" />
              </button>
            </div>

            <div className="flex flex-col gap-1">
              {friendsApprovalAddress &&
                friendsApprovalAddress[1].map((friend, index) =>
                  selctedFriends.includes(friend) ? (
                    <div
                      key={index}
                      className="pl-2 bg-green-500 border-green-500 border rounded-md text-white font-semibold flex justify-center items-center gap-2"
                    >
                      <span className="py-[6px]">{friend}</span>
                      <button
                        onClick={() => toggleApproval(friend)}
                        className="text-white flex justify-center items-center bg-green-600 h-full text-2xl rounded-r-md p-2 hover:bg-white hover:text-green-600"
                      >
                        <IoCloseSharp className="font-semibold" />
                      </button>
                    </div>
                  ) : (
                    <div
                      key={index}
                      className="pl-2 bg-red-500 border-red-500 border rounded-md text-white font-semibold flex justify-center items-center gap-2"
                    >
                      <span className="py-[6px]">{friend}</span>
                      <button
                        onClick={() => toggleApproval(friend)}
                        className="text-white flex justify-center items-center bg-red-600 h-full text-2xl rounded-r-md p-2 hover:bg-white hover:text-red-600"
                      >
                        <IoAddSharp className="font-semibold h-full" />
                      </button>
                    </div>
                  )
                )}
            </div>

            <button
              className="px-8 py-2 mt-1 rounded-full text-black  bg-[#c5ff5a] border-black border-2 font-semibold hover:border-[#c5ff5a] hover:text-[#c5ff5a] hover:bg-black transition-all duration-200"
              onClick={() => {
                approveFile();
              }}
            >
              Approve
            </button>
          </div>
        </div>
      )}
      {approveFileModal.openModal === dialogBox.DISAPPROVE_FILE && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-md shadow-md max-w-full text-center">
            <div className="flex flex-row justify-between items-center w-full mb-4">
              <button
                onClick={() => {
                  setApproveFileModal({
                    ...approveFileModal,
                    openModal: dialogBox.LIST,
                  });
                  setSelctedFriends([]);
                  setFriendsApprovalAddress(null);
                }}
              >
                <MdKeyboardBackspace className="text-black hover:text-teal-500 transition-all duration-200 cursor-pointer text-2xl" />
              </button>
              <h2 className="text-lg font-bold text-black">Disapprove File</h2>
              <button
                onClick={() => {
                  setApproveFileModal({
                    openModal: dialogBox.CLOSE,
                    ipfsHash: "",
                  });
                  setSelctedFriends([]);
                  setFriendsApprovalAddress(null);
                }}
              >
                <IoCloseSharp className="text-black hover:text-red-500 transition-all duration-200 cursor-pointer text-2xl" />
              </button>
            </div>

            <div className="flex flex-col gap-1">
              {friendsApprovalAddress &&
                friendsApprovalAddress[0].map((friend, index) =>
                  selctedFriends.includes(friend) ? (
                    <div
                      key={index}
                      className="pl-2 bg-green-500 border-green-500 border rounded-md text-white font-semibold flex justify-center items-center gap-2"
                    >
                      <span className="py-[6px]">{friend}</span>
                      <button
                        onClick={() => toggleApproval(friend)}
                        className="text-white flex justify-center items-center bg-green-600 h-full text-2xl rounded-r-md p-2 hover:bg-white hover:text-green-600"
                      >
                        <IoCloseSharp className="font-semibold" />
                      </button>
                    </div>
                  ) : (
                    <div
                      key={index}
                      className="pl-2 bg-red-500 border-red-500 border rounded-md text-white font-semibold flex justify-center items-center gap-2"
                    >
                      <span className="py-[6px]">{friend}</span>
                      <button
                        onClick={() => toggleApproval(friend)}
                        className="text-white flex justify-center items-center bg-red-600 h-full text-2xl rounded-r-md p-2 hover:bg-white hover:text-red-600"
                      >
                        <IoAddSharp className="font-semibold" />
                      </button>
                    </div>
                  )
                )}
            </div>

            <button
              className="px-8 py-2 mt-1 rounded-full text-black  bg-[#c5ff5a] border-black border-2 font-semibold hover:border-[#c5ff5a] hover:text-[#c5ff5a] hover:bg-black transition-all duration-200"
              onClick={() => {
                disapproveFile();
              }}
            >
              Disapprove
            </button>
          </div>
        </div>
      )}
      <section className=" text-white font-semibold p-3 border-b-2 border-b-[#C4FF5A] flex flex-row justify-between items-center">
        <h1>DRIVE3</h1>
        <h2>Connected Account : {account}</h2>
      </section>
      <section className="w-full">
        <form
          onSubmit={uploadFile}
          className="flex flex-col justify-center items-center gap-6 w-full"
        >
          <FileUploader
            handleChange={(file) => {
              setFile(file);
            }}
            name="file"
            multiple={false}
            required={true}
            hoverTitle="Drop Here"
            children={
              <>
                {dragging ? (
                  <div className="w-[60vw] bg-white text-slate-950 h-64 text-2xl font-semibold hover:cursor-pointer border-sky-500 rounded-lg border-dashed border-4 grid place-items-center  transition-all duration-200">
                    Drop here.
                  </div>
                ) : file ? (
                  <div className="w-[60vw] bg-slate-950 h-64 text-2xl font-semibold hover:cursor-pointer border-sky-500 rounded-lg border-dashed border-4 flex justify-center items-center flex-col gap-2 transition-all duration-200">
                    <div>{file.name}</div>
                    <div className="text-gray-500 bg-black relative text-sm">
                      <div className="bg-black px-1 z-10 relative">OR</div>
                      <div className="absolute px-14 bg-gray-500 h-[1px] -translate-x-1/2 left-1/2 top-1/2 -translate-y-1/2"></div>
                    </div>
                    <div className="text-sm">
                      <span className=" underline text-sky-500">Select</span>{" "}
                      another file.
                    </div>
                  </div>
                ) : (
                  <div className="w-[60vw] bg-slate-950 h-64 text-2xl font-semibold hover:cursor-pointer border-sky-500 rounded-lg border-dashed border-4 grid place-items-center transition-all duration-200">
                    Drop your file here.
                  </div>
                )}
              </>
            }
            dropMessageStyle={{
              opacity: "100%",
              backgroundColor: "white",
              color: "#020617",
              fontSize: "1.5rem",
              fontWeight: "600",
              borderColor: "#020617",
              borderRadius: "0.5rem",
              borderStyle: "dashed",
              borderWidth: "4px",
            }}
            onDraggingStateChange={handleDraggingStateChange}
            onDrop={(file) => {
              setDragging(false);

              console.log("File dropped:", file);
            }}
            onSelect={(file) => {
              setDragging(false);
              console.log("File selected:", file);
            }}
          />

          <button
            type="submit"
            className="px-8 py-2 rounded-sm bg-[#C4FF5A] border-white border-2 font-semibold text-black focus:ring-2 hover:shadow-[0_0_2px_#fff,inset_0_0_2px_#fff,0_0_5px_#C4FF5A,0_0_15px_#C4FF5A,0_0_20px_#C4FF5A] transition-all duration-200"
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
                {/* <p className="text-black">{file.fileName}</p> */}
                <img
                  src={`https://gateway.pinata.cloud/ipfs/${file.ipfsHash}`}
                  alt={file.fileName}
                  className={`w-full h-40 object-contain border-black ${
                    approveFileModal.openModal && "opacity-50"
                  } `}
                />
                <button
                  onClick={() =>
                    setApproveFileModal({
                      openModal: dialogBox.LIST,
                      ipfsHash: file.ipfsHash,
                    })
                  }
                  className={`absolute top-0 right-0 mt-2 mr-2 rounded-full p-1 bg-sky-400 hover:bg-sky-500 text-white flex justify-center items-center transition-all duration-200 ${
                    approveFileModal.openModal && "opacity-50"
                  }`}
                >
                  <IoEllipsisVertical />
                </button>
              </div>
              <p className="text-sm text-gray-500">
                Uploaded:{" "}
                {new Date(Number(file.timestamp) * 1000).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      </section>
      <section>
        <h3 className="text-xl font-bold underline mb-2">FRIENDS</h3>
        <form
          onSubmit={addFriend}
          className="flex flex-row justify-center items-center gap-6 h-10 mb-2"
        >
          <input
            type="text"
            name="address"
            id="address"
            value={friendAddress}
            onChange={(e) => setFriendAddress(e.target.value)}
            className="h-full text-black px-1 py-1 w-[380px] rounded-sm"
          />
          <button
            type="submit"
            className="px-8 h-full rounded-sm bg-[#C4FF5A] border-white border-2 font-semibold text-black focus:ring-2 hover:shadow-[0_0_2px_#fff,inset_0_0_2px_#fff,0_0_5px_#C4FF5A,0_0_15px_#C4FF5A,0_0_20px_#C4FF5A] transition-all duration-200"
          >
            Add
          </button>
        </form>
        <div className="flex flex-row gap-2">
          {friends.map((friend, index) => (
            <div
              key={index}
              className="pl-2 bg-sky-400 rounded-md text-white font-semibold flex justify-center items-center gap-2"
            >
              <span className="py-[6px]">{friend}</span>
              <button
                onClick={() => removeFriend(friend)}
                className="text-white flex justify-center items-center text-lg h-full bg-sky-500 p-2 rounded-r-md hover:text-sky-500 hover:bg-white transition duration-200"
              >
                <IoCloseSharp className="font-semibold" />
              </button>
            </div>
          ))}
        </div>
      </section>
      <section>
        <h3 className="text-xl font-bold underline mb-2">FRIENDS' FILES</h3>
        {approvedFiles.length > 0 &&
          approvedFiles[0].map(
            (friend, index) =>
              approvedFiles[1][index].length > 0 && (
                <div key={index}>
                  <h4 className="font-semibold mb-2">
                    Friend {index + 1}: {friend}
                  </h4>
                  <ul className="flex flex-row flex-wrap gap-2">
                    {approvedFiles[1][index].map((file, fileIndex) => (
                      <li
                        key={fileIndex}
                        className="bg-white p-2 rounded-md max-w-max grid place-items-center"
                      >
                        <img
                          src={`https://gateway.pinata.cloud/ipfs/${file.ipfsHash}`}
                          alt={file.fileName}
                          className={`w- h-40 object-contain ${
                            approveFileModal.openModal && "opacity-50"
                          } `}
                        />
                        <button
                          onClick={() => downloadFile(file.ipfsHash)}
                          className="mt-2 px-4 py-1 text-black rounded-sm  bg-[#c5ff5a] border-black border-2 font-semibold hover:border-[#c5ff5a] hover:text-[#c5ff5a] hover:bg-black transition-all duration-200"
                        >
                          Download
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )
          )}
      </section>
    </div>
  );
};
