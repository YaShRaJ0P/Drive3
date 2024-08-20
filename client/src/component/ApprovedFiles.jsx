import React from "react";
import { useSelector } from "react-redux";
import { downloadFile } from "../utils/functions";

export const ApprovedFiles = () => {
  const modal = useSelector((state) => state.modal);
  const approvedFiles = useSelector((state) => state.approvedFiles);

  return (
    approvedFiles.length > 0 && (
      <section>
        <h3 className="text-xl font-bold underline mb-4">FRIENDS' FILES</h3>
        {approvedFiles.length > 0 &&
          approvedFiles[0].map(
            (friend, index) =>
              approvedFiles[1][index].length > 0 && (
                <div key={index}>
                  <h4 className="font-semibold mb-4">
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
                          className={`w- h-40 break-words text-black object-contain ${
                            modal.openModal && "opacity-50"
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
    )
  );
};
