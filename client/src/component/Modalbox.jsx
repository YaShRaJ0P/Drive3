import React from "react";
import { IoCloseSharp, IoAddSharp } from "react-icons/io5";
import { FaDownload, FaUserPlus, FaUserMinus } from "react-icons/fa";
import { MdDeleteForever, MdKeyboardBackspace } from "react-icons/md";
import axios from "axios";
import toast from "react-hot-toast";
import { useState } from "react";
import { downloadFile, getFiles } from "../utils/functions";
import { useAppContext } from "../utils/context";

const dialogBox = Object.freeze({
  CLOSE: 0,
  LIST: 1,
  APPROVE_FILE: 2,
  DISAPPROVE_FILE: 3,
});

export const Modalbox = ({ contract }) => {
  const { modal, friends, account, updateFiles, updateModal } = useAppContext();

  const [selctedFriends, setSelctedFriends] = useState([]);
  const [friendsApprovalAddress, setFriendsApprovalAddress] = useState(null);

  const deleteFile = async (ipfsHash) => {
    const JWT = process.env.REACT_APP_PINATA_JWT;

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

    let errorMessage = "Error deleting file!";

    toast.promise(
      (async () => {
        try {
          const transaction = await contract.deleteFile(ipfsHash);
          await transaction.wait();
          await unpinFromIPFS(ipfsHash);
          let files = await getFiles(contract);
          updateFiles(files);
          return "File deleted successfully!";
        } catch (err) {
          if (err.code === "ACTION_REJECTED") {
            errorMessage = "File deletion denied!";
          }
          return Promise.reject();
        }
      })(),
      {
        loading: "Deleting file...",
        success: "File deleted successfully!",
        error: () => errorMessage,
      },
      {
        id: "delete-file",
      }
    );
  };

  const approveFile = async () => {
    if (!contract) {
      toast.error("Please connect your wallet!", {
        id: "approve-file",
      });
      return;
    }
    if (!modal.openModal) {
      toast.error("Something went wrong!", {
        id: "approve-file",
      });
      return;
    }
    if (!selctedFriends[0]) {
      toast.error("No friend selected!", {
        id: "approve-file",
      });
      return;
    }
    let errorMessage = "Error approving file!";

    toast.promise(
      (async () => {
        try {
          const transaction = await contract.approveFile(
            modal.ipfsHash,
            selctedFriends
          );
          await transaction.wait();
          setSelctedFriends([]);
          updateModal({
            openModal: dialogBox.CLOSE,
            ipfsHash: "",
          });
        } catch (err) {
          if (err.code === "ACTION_REJECTED") {
            errorMessage = "Approving file denied!";
          }
          return Promise.reject();
        }
      })(),
      {
        loading: "Approving file...",
        success: "File approved successfully!",
        error: () => errorMessage,
      },
      {
        id: "approve-file",
      }
    );
  };

  const disapproveFile = async () => {
    if (!contract) {
      toast.error("Please connect your wallet!", {
        id: "disapprove-file",
      });
      return;
    }
    if (!modal.openModal) {
      toast.error("Something went wrong!", {
        id: "disapprove-file",
      });
      return;
    }
    if (!selctedFriends[0]) {
      toast.error("No friend selected!", {
        id: "disapprove-file",
      });
      return;
    }
    let errorMessage = "Error disapproving file!";

    toast.promise(
      (async () => {
        try {
          const transaction = await contract.disApproveFile(
            modal.ipfsHash,
            friendsApprovalAddress
          );
          await transaction.wait();
          setFriendsApprovalAddress(null);
          updateModal({
            openModal: dialogBox.CLOSE,
            ipfsHash: "",
          });
        } catch (err) {
          if (err.code === "ACTION_REJECTED") {
            errorMessage = "Disapproving file denied!";
          }
          return Promise.reject();
        }
      })(),
      {
        loading: "Disapproving file...",
        success: "File disapproved successfully!",
        error: () => errorMessage,
      },
      {
        id: "disapprove-file",
      }
    );
  };

  const toggleApproval = (friend) => {
    if (selctedFriends.includes(friend)) {
      setSelctedFriends(selctedFriends.filter((f) => f !== friend));
    } else {
      setSelctedFriends([...selctedFriends, friend]);
    }
  };

  const getFriendsApprovalStatus = async (ipfsHash, isApproved) => {
    try {
      const approvalAddress = await contract.getFriendsApprovalStatus(ipfsHash);
      setFriendsApprovalAddress(approvalAddress);
      if (isApproved && approvalAddress[1].length === 0) {
        toast("File approved to all friends!", {
          id: "friends-approval-status",
        });
        return false;
      } else if (!isApproved && approvalAddress[0].length === 0) {
        toast("File disapproved to all friends!", {
          id: "friends-approval-status",
        });
        return false;
      }
      return true;
    } catch (error) {
      toast.error("Error fetching friends!", {
        id: "friends-approval-status",
      });
      console.error("Error getting friends:", error);
    }
  };

  return (
    <>
      {modal.openModal === dialogBox.LIST && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <ul className="bg-white text-black w-96 rounded-md shadow-md flex flex-col justify-center">
            <li className="flex justify-between items-center border-b-2 border-b-black w-full font-bold text-lg">
              <h4 className="px-2 py-[6px]">Action</h4>
              <div className="pr-2">
                <button
                  className="flex items-center justify-center"
                  onClick={() => {
                    updateModal({
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
                onClick={() => downloadFile(modal.ipfsHash, contract, account)}
              >
                <FaDownload className=" text-lg" /> <span> Download</span>
              </button>
            </li>
            {friends.length > 0 && (
              <>
                <li className="border-b-2 border-b-black p-[10px] hover:bg-zinc-900 hover:text-white transition-all duration-200">
                  <button
                    className="w-full text-left flex flex-row gap-2 justify-start items-center font-medium"
                    onClick={async () => {
                      let isOpenModal = await getFriendsApprovalStatus(
                        modal.ipfsHash,
                        true
                      );
                      isOpenModal &&
                        updateModal({
                          ...modal,
                          openModal: dialogBox.APPROVE_FILE,
                        });
                    }}
                  >
                    <FaUserPlus className=" text-lg" />{" "}
                    <span> Approve File</span>
                  </button>
                </li>
                <li className="border-b-2 border-b-black p-[10px] hover:bg-zinc-900 hover:text-white transition-all duration-200">
                  <button
                    className="w-full text-left flex flex-row gap-2 justify-start items-center font-medium"
                    onClick={async () => {
                      let isOpenModal = await getFriendsApprovalStatus(
                        modal.ipfsHash,
                        false
                      );
                      isOpenModal &&
                        updateModal({
                          ...modal,
                          openModal: dialogBox.DISAPPROVE_FILE,
                        });
                    }}
                  >
                    <FaUserMinus className=" text-lg" />
                    <span> Disapprove File</span>
                  </button>
                </li>
              </>
            )}
            <li className="p-[10px] hover:bg-zinc-900 hover:text-white transition duration-200">
              <button
                className="w-full text-left flex flex-row gap-2 justify-start items-center font-medium"
                onClick={() => deleteFile(modal.ipfsHash)}
              >
                <MdDeleteForever className=" text-lg" />
                <span> Delete</span>
              </button>
            </li>
          </ul>
        </div>
      )}
      {modal.openModal === dialogBox.APPROVE_FILE && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-md shadow-md max-w-full text-center">
            <div className="flex flex-row justify-between items-center w-full mb-4">
              <button
                onClick={() => {
                  updateModal({
                    ...modal,
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
                  updateModal({
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
      {modal.openModal === dialogBox.DISAPPROVE_FILE && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-md shadow-md max-w-full text-center">
            <div className="flex flex-row justify-between items-center w-full mb-4">
              <button
                onClick={() => {
                  updateModal({
                    ...modal,
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
                  updateModal({
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
    </>
  );
};
