import React, { memo } from "react";
import { downloadFile } from "../utils/functions";
import { useAppContext } from "../utils/context";

export const ApprovedFiles = memo(() => {
  const { approvedFiles } = useAppContext();
  return (
    approvedFiles &&
    approvedFiles.length > 0 && (
      <section>
        <h3 className="mb-4 text-xl font-bold underline">FRIENDS' FILES</h3>
        {approvedFiles.length > 0 &&
          approvedFiles[0].map(
            (friend, index) =>
              approvedFiles[1][index].length > 0 && (
                <div key={index}>
                  <h4 className="mb-4 font-semibold">
                    Friend {index + 1}:{" "}
                    <span className="tracking-wide font-roboto">{friend}</span>
                  </h4>
                  <ul className="flex flex-row flex-wrap gap-2">
                    {approvedFiles[1][index].map((file, fileIndex) => (
                      <li
                        key={fileIndex}
                        className="grid p-2 bg-white rounded-md max-w-max place-items-center"
                      >
                        <img
                          src={`https://gateway.pinata.cloud/ipfs/${file.ipfsHash}`}
                          alt={file.fileName}
                          className="object-contain h-40 text-gray-500 break-words w-"
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
});
