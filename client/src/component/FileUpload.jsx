import React from "react";
import { FileUploader } from "react-drag-drop-files";
import axios from "axios";
import FormData from "form-data";
import toast from "react-hot-toast";
import { useState } from "react";
import { getFiles } from "../utils/functions";
import { useDispatch } from "react-redux";
import { setFiles } from "../appStore/filesSlice";

export const FileUpload = ({ contract }) => {
  const dispatch = useDispatch();
  const [file, setFile] = useState(null);
  const [dragging, setDragging] = useState(false);

  const uploadFile = async (e) => {
    e.preventDefault();

    if (!contract) {
      toast.error("Please connect your wallet!", {
        id: "upload-file",
      });
      return;
    }

    if (!file) {
      toast.error("No file selected!", {
        id: "upload-file",
      });
      return;
    }

    let errorMessage = "Error uploading file!";

    toast.promise(
      (async () => {
        try {
          const ipfsHash = await uploadFileToIPFS(file);
          const transaction = await contract.addFile(file.name, ipfsHash);
          await transaction.wait();
          let files = await getFiles(contract);
          dispatch(setFiles(files));
          setFile(null);
          return "File uploaded successfully!";
        } catch (err) {
          setFile(null);
          if (err.code === "ACTION_REJECTED") {
            errorMessage = "File upload denied!";
          }
          return Promise.reject();
        }
      })(),
      {
        loading: "Uploading file...",
        success: "File uploaded successfully!",
        error: () => errorMessage,
      },
      {
        id: "upload-file",
      }
    );
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
    }
  };
  const handleDraggingStateChange = (draggingState) => {
    setDragging(draggingState);
  };
  return (
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
          hoverTitle="Drop Here"
          children={
            <>
              {dragging ? (
                <div className="w-[60vw] bg-white text-slate-950 h-64 text-2xl font-semibold hover:cursor-pointer border-sky-500 rounded-lg border-dashed border-4 grid place-items-center  transition-all duration-200 max-sm:w-[90vw] max-sm:mx-2">
                  Drop here.
                </div>
              ) : file ? (
                <div className="w-[60vw] bg-slate-950 h-64 text-2xl font-semibold hover:cursor-pointer border-sky-500 rounded-lg border-dashed border-4 flex justify-center items-center flex-col gap-2 transition-all duration-200 max-sm:w-[90vw] max-sm:mx-2">
                  <div className="break-words">{file.name}</div>
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
                <div className="w-[60vw] bg-slate-950 h-64 text-2xl font-semibold hover:cursor-pointer border-sky-500 rounded-lg border-dashed border-4 grid place-items-center transition-all duration-200 max-sm:w-[90vw] max-sm:mx-2">
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
          }}
          onSelect={(file) => {
            setDragging(false);
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
  );
};
