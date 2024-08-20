import React from "react";
import { IoEllipsisVertical } from "react-icons/io5";
import { useDispatch, useSelector } from "react-redux";
import { setModal } from "../appStore/modalSlice";

export const Files = () => {
  const modal = useSelector((state) => state.modal);
  const files = useSelector((state) => state.files);
  const dispatch = useDispatch();
  const dialogBox = Object.freeze({
    CLOSE: 0,
    LIST: 1,
    APPROVE_FILE: 2,
    DISAPPROVE_FILE: 3,
  });

  return (
    <section>
      <div className="text-xl font-bold underline mb-4">FILES</div>
      <div className="flex flex-row gap-3 flex-wrap">
        {files.map((file, index) => (
          <div
            key={index}
            className="bg-white p-2 rounded-md shadow-md max-w-60 relative"
          >
            <div className="relative">
              {/* <p className="text-black">{file.fileName}</p> */}
              <img
                src={`https://gateway.pinata.cloud/ipfs/${file.ipfsHash}`}
                alt={file.fileName}
                className={`text-black break-words w-full h-40 object-contain border-black ${
                  modal.openModal && "opacity-50"
                } `}
              />
            </div>
            <p className="text-sm text-gray-500">
              Uploaded :{" "}
              {new Date(Number(file.timestamp) * 1000).toLocaleString()}
            </p>
            <button
              onClick={() =>
                dispatch(
                  setModal({
                    ipfsHash: file.ipfsHash,
                    openModal: dialogBox.LIST,
                  })
                )
              }
              className={`absolute top-[-10px] right-[-8px] rounded-full p-1 bg-sky-400 hover:bg-sky-500 text-white flex justify-center items-center transition-all duration-200 ${
                modal.openModal && "opacity-50"
              }`}
            >
              <IoEllipsisVertical />
            </button>
          </div>
        ))}
      </div>
    </section>
  );
};
