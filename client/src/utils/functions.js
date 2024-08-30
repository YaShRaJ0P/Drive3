import { ethers } from "ethers";
import { contractAddress } from "../AddressABI/contractAddress";
import { contractABI } from "../AddressABI/contractABI";
import toast from "react-hot-toast";
export const initializeEthers = async (ethereum) => {
  const provider = new ethers.BrowserProvider(ethereum);
  const signer = await provider.getSigner();
  const contract = new ethers.Contract(contractAddress, contractABI, signer);
  return contract;
};

export const getFiles = async (contract) => {
  try {
    const files = await contract.getAllFiles();
    return files;
  } catch (error) {
    toast.error("Error fetching files!", {
      id: "fetch-files",
    });
  }
};

export const getFriends = async (contract) => {
  try {
    const friends = await contract.getFriends();
    return friends;
  } catch (error) {
    toast.error("Error fetching friends!", {
      id: "get-friends",
    });
    console.error("Error getting friends:", error);
  }
};

export const downloadFile = async (ipfsHash, contract, address) => {
  const url = `https://gateway.pinata.cloud/ipfs/${ipfsHash}`;

  //Make a function to find file using ipfsHash and download it by the name of that file

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error("Network response was not ok");
    }
    const blob = await response.blob();
    const link = document.createElement("a");
    const downloadUrl = URL.createObjectURL(blob);
    link.href = downloadUrl;
    console.log(downloadUrl);
    const fileName = await contract.ipfsToName(address, ipfsHash);
    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();
    URL.revokeObjectURL(downloadUrl);
    document.body.removeChild(link);
    toast.success("File downloaded successfully!", {
      id: "download-file",
    });
  } catch (error) {
    toast.error("Error downloading the file!", {
      id: "download-file",
    });
    console.error("Error downloading the file:", error);
  }
};

export const approvedFilesfromFriends = async (contract) => {
  try {
    let files = await contract.getApprovedFiles();
    if (files[1].length > 0 && files[1][0].length > 0) {
      return files;
    }
  } catch (error) {
    toast.error("Error fetching approved files from friends!", {
      id: "approved-files",
    });
    console.error(error);
  }
};
