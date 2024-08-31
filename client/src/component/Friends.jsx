import React from "react";
import { IoCloseSharp } from "react-icons/io5";
import toast from "react-hot-toast";
import { useState } from "react";
import { approvedFilesfromFriends, getFriends } from "../utils/functions";
import { useAppContext } from "../utils/context";

export const Friends = ({ contract }) => {
  const [friendAddress, setFriendAddress] = useState("");
  const { friends, account, updateFriends, updateApprovedFiles } =
    useAppContext();
  const addFriend = async (e) => {
    e.preventDefault();
    if (!contract) {
      toast.error("Please connect your wallet!", {
        id: "add-friend",
      });
      return;
    }
    if (!friendAddress) {
      toast.error("No friend address provided!", {
        id: "add-friend",
      });
      return;
    }
    if (friendAddress.toLowerCase() === account.toLowerCase()) {
      toast.error("You cannot add yourself as a friend!", {
        id: "add-friend",
      });
      return;
    }
    let errorMessage = "Error adding friend!";

    toast.promise(
      (async () => {
        try {
          const transaction = await contract.addFriend(friendAddress);
          await transaction.wait();
          let friends = await getFriends(contract);
          updateFriends(friends);
          setFriendAddress("");
          let approvedFiles = await approvedFilesfromFriends(contract);
          updateApprovedFiles(approvedFiles);
        } catch (err) {
          if (err.code === "ACTION_REJECTED") {
            errorMessage = "Friend adding denied!";
          }
          return Promise.reject();
        }
      })(),
      {
        loading: "Adding friend...",
        success: "Friend added successfully!",
        error: () => errorMessage,
      },
      {
        id: "add-friend",
      }
    );
  };

  const removeFriend = async (friendAddress) => {
    if (!contract) {
      toast.error("Please connect your wallet!", {
        id: "remove-friend",
      });
      return;
    }
    if (!friendAddress) {
      toast.error("No friend address provided!", {
        id: "remove-friend",
      });
      return;
    }
    let errorMessage = "Error removing friend!";

    toast.promise(
      (async () => {
        try {
          const transaction = await contract.removeFriend(friendAddress);
          await transaction.wait();
          let friends = await getFriends(contract);
          updateFriends(friends);
          let approvedFiles = await approvedFilesfromFriends(contract);
          updateApprovedFiles(approvedFiles);
        } catch (err) {
          if (err.code === "ACTION_REJECTED") {
            errorMessage = "Friend removing denied!";
          }
          return Promise.reject();
        }
      })(),
      {
        loading: "Removing friend...",
        success: "Friend removed successfully!",
        error: () => errorMessage,
      },
      {
        id: "remove-friend",
      }
    );
  };

  return (
    <section>
      <h3 className="text-xl font-bold underline mb-4">FRIENDS</h3>
      <form
        onSubmit={addFriend}
        className="flex flex-row justify-center items-center gap-6 h-10 mb-4"
      >
        <input
          type="text"
          name="address"
          id="address"
          value={friendAddress}
          onChange={(e) => {
            setFriendAddress(e.target.value);
            console.log(e);
          }}
          className="h-full text-black px-1 py-1 w-[380px] rounded-sm font-roboto tracking-wide"
        />
        <button
          type="submit"
          className="px-8 h-full rounded-sm bg-[#C4FF5A] border-white border-2 font-semibold text-black focus:ring-2 hover:shadow-[0_0_2px_#fff,inset_0_0_2px_#fff,0_0_5px_#C4FF5A,0_0_15px_#C4FF5A,0_0_20px_#C4FF5A] transition-all duration-200"
        >
          Add
        </button>
      </form>
      <div className="flex flex-row gap-2 flex-wrap max-sm:text-sm font-roboto tracking-wide">
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
  );
};
