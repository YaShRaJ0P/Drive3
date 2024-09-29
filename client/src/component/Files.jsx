import { memo } from "react";
import { IoEllipsisVertical } from "react-icons/io5";
import { useAppContext } from "../utils/context";

export const Files = memo(() => {
  const { files, updateModal } = useAppContext();

  const dialogBox = Object.freeze({
    CLOSE: 0,
    LIST: 1,
    APPROVE_FILE: 2,
    DISAPPROVE_FILE: 3,
  });

  return (
    <section>
      <div className="mb-4 text-xl font-bold underline">FILES</div>
      <div className="flex flex-row flex-wrap gap-3">
        {files &&
          files.map((file, index) => (
            <div
              key={index}
              className="relative p-2 bg-white rounded-md shadow-md max-w-60"
            >
              <div className="relative">
                {/* <p className="text-black">{file.fileName}</p> */}
                <img
                  src={`https://gateway.pinata.cloud/ipfs/${file.ipfsHash}`}
                  alt={file.fileName}
                  className="object-contain w-full h-40 text-gray-500 break-words border-black"
                />
              </div>
              <p className="text-sm text-gray-500">
                Uploaded :{" "}
                {new Date(Number(file.timestamp) * 1000).toLocaleString()}
              </p>
              <button
                onClick={() =>
                  updateModal({
                    ipfsHash: file.ipfsHash,
                    openModal: dialogBox.LIST,
                  })
                }
                className="absolute top-[-10px] right-[-8px] rounded-full p-1 bg-sky-400 hover:bg-sky-500 text-white flex justify-center items-center transition-all duration-200"
              >
                <IoEllipsisVertical />
              </button>
            </div>
          ))}
      </div>
    </section>
  );
});
