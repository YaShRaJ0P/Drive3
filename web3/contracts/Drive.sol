// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.24;

/**
 * @title Drive
 * @dev A contract for managing files stored on IPFS, with friend-based access control.
 */
contract Drive {

    /// @notice structure of File
    struct File {
        string fileName;
        string ipfsHash;
        uint256 timestamp;
    }

    // Maps user address to their files (file IPFS hash to File struct)
    mapping(address => mapping(string => File)) private userFiles;

    // Maps user address to a list of their file IPFS hashes
    mapping(address => string[]) private userFileHashes;

    // Maps user address to a list of their friends' addresses
    mapping(address => address[]) private userFriends;

    // Maps user address to a list of approved ipfsHash (friend address to IPFS hash array)
    mapping(address => mapping(address => string[])) private approvedFiles;

    /// @dev Checks if the specified friend is a friend of the sender or not
    /// @param _friend Address of friend to check
    /// @param _errorMessage Custom error message to show if the condition fails
    /// @param _shouldBeFriend Boolean indicating whether the friend should be a friend or not
    modifier validateFriendship(
        address _friend,
        string memory _errorMessage,
        bool _shouldBeFriend
    ) {
        bool isFriend = false;
        for (uint i = 0; i < userFriends[msg.sender].length; i++) {
            if (userFriends[msg.sender][i] == _friend) {
                isFriend = true;
                break;
            }
        }
        require(isFriend == _shouldBeFriend, _errorMessage);
        _;
    }

    /// @dev Checks if the specified file exists for the sender
    /// @param _ipfsHash IPFS hash of the file to check
    modifier fileExists(string memory _ipfsHash) {
        require(
            bytes(userFiles[msg.sender][_ipfsHash].ipfsHash).length != 0,
            "File does not exist"
        );
        _;
    }

    /// @notice Adds a new file to the user's file list
    /// @param _fileName Name of the file
    /// @param _ipfsHash IPFS hash of the file
    function addFile(
        string memory _fileName,
        string memory _ipfsHash
    ) external {
        // Revert if the ipfsHash already exists on user's file list
        require(
            bytes(userFiles[msg.sender][_ipfsHash].ipfsHash).length == 0,
            "File already exists"
        );
        userFiles[msg.sender][_ipfsHash] = File({
            fileName: _fileName,
            ipfsHash: _ipfsHash,
            timestamp: block.timestamp
        });
        userFileHashes[msg.sender].push(_ipfsHash);
    }

    /// @notice Deletes a file from the user's file list
    /// @param _ipfsHash IPFS hash of the file to delete
    function deleteFile(
        string memory _ipfsHash
    ) external fileExists(_ipfsHash) {
        string[] storage fileHashes = userFileHashes[msg.sender];
        bool found = false;
        // When the file is found replace it with its next file till the end
        for (uint i = 0; i < fileHashes.length; i++) {
            if (
                keccak256(bytes(fileHashes[i])) == keccak256(bytes(_ipfsHash))
            ) {
                found = true;
            }
            if (found && i < fileHashes.length - 1) {
                fileHashes[i] = fileHashes[i + 1];
            }
        }
        if (found) {
            fileHashes.pop();
            delete userFiles[msg.sender][_ipfsHash];
        }

        // Remove approved file from user's friends
        for (uint i = 0; i < userFriends[msg.sender].length; i++) {
            address friendAddress = userFriends[msg.sender][i];
            string[] storage friendApprovedFiles = approvedFiles[msg.sender][
                friendAddress
            ];
            found = false;
            for (uint j = 0; j < friendApprovedFiles.length; j++) {
                if (
                    keccak256(bytes(friendApprovedFiles[j])) ==
                    keccak256(bytes(_ipfsHash))
                ) {
                    found = true;
                }
                if (found && j < friendApprovedFiles.length - 1) {
                    friendApprovedFiles[j] = friendApprovedFiles[j + 1];
                }
            }
            if (found) {
                friendApprovedFiles.pop();
            }
        }
    }

    /// @notice Retrieves all files added by the user
    /// @return An array of File structs
    function getAllFiles() external view returns (File[] memory) {
        string[] storage fileHashes = userFileHashes[msg.sender];
        File[] memory files = new File[](fileHashes.length);
        for (uint i = 0; i < fileHashes.length; i++) {
            files[i] = userFiles[msg.sender][fileHashes[i]];
        }
        return files;
    }

    /// @notice Approves a file for access by specified friends
    /// @param _ipfsHash IPFS hash of the file to approve
    /// @param _friends Array of friend addresses to approve the file for
    function approveFile(
        string memory _ipfsHash,
        address[] memory _friends
    ) external fileExists(_ipfsHash) {
        for (uint i = 0; i < _friends.length; i++) {

            //Revert if any listed friend is not user's friend
            address friend = _friends[i];
            bool isFriend = false;
            for (uint j = 0; j < userFriends[msg.sender].length; j++) {
                if (userFriends[msg.sender][j] == friend) {
                    isFriend = true;
                    break;
                }
            }
            require(isFriend, "Someone is not a friend");

            // Revert if the file has already been approved for this friend
            string[] storage approvedHashes = approvedFiles[msg.sender][friend];
            bool alreadyApproved = false;
            for (uint k = 0; k < approvedHashes.length; k++) {
                if (
                    keccak256(bytes(approvedHashes[k])) ==
                    keccak256(bytes(_ipfsHash))
                ) {
                    alreadyApproved = true;
                    break;
                }
            }
            require(!alreadyApproved, "File already approved for this friend");

            //Approve the file to the user's friends
            approvedFiles[msg.sender][friend].push(_ipfsHash);
        }
    }

    /// @notice Disapproves a file for access by specified friends
    /// @param _ipfsHash IPFS hash of the file to disapprove
    /// @param _friends Array of friend addresses to disapprove the file
    function disapproveFile(
        string memory _ipfsHash,
        address[] memory _friends
    ) external fileExists(_ipfsHash) {
        address[] storage friends = userFriends[msg.sender];

        //Revert if any listed friend is not user's friend
        for (uint i = 0; i < _friends.length; i++) {
            address friend = _friends[i];
            bool isFriend = false;

            for (uint j = 0; j < friends.length; j++) {
                if (friends[j] == friend) {
                    isFriend = true;
                    break;
                }
            }

            require(isFriend, "Someone is not a friend");

            string[] storage friendApprovedFileHashes = approvedFiles[msg.sender][friend];
            bool found = false;

            // Disapprove the file
            for (uint k = 0; k < friendApprovedFileHashes.length; k++) {
                if (
                    keccak256(bytes(friendApprovedFileHashes[k])) ==
                    keccak256(bytes(_ipfsHash))
                ) {
                    found = true;
                    if (k < friendApprovedFileHashes.length - 1) {
                        friendApprovedFileHashes[k] = friendApprovedFileHashes[
                            k + 1
                        ];
                    }
                    friendApprovedFileHashes.pop();
                    break;
                }
            }
            //Revert if the file is not approved for a friend
            require(found, "File not approved for this friend");
        }
    }

    /// @notice Retrieves files approved for the user by their friends
    /// @return Two arrays: an array of friend addresses and an array of arrays of File structs
    function getApprovedFiles()
        external
        view
        returns (address[] memory, File[][] memory)
    {
        uint totalFriends = userFriends[msg.sender].length;
        address[] memory friends = new address[](totalFriends);
        File[][] memory approvedFilesArray = new File[][](totalFriends);

        for (uint i = 0; i < totalFriends; i++) {
            address friend = userFriends[msg.sender][i];
            friends[i] = friend;
            string[] memory fileHashes = approvedFiles[friend][msg.sender];
            uint256 length = fileHashes.length;

            File[] memory files = new File[](length);
            for (uint j = 0; j < length; j++) {
                files[j] = userFiles[friend][fileHashes[j]];
            }
            approvedFilesArray[i] = files;
        }

        return (friends, approvedFilesArray);
    }

    /// @notice Retrieves the approval status of a file for the user's friends
    /// @param _ipfsHash IPFS hash of the file
    /// @return Two arrays: an array of addresses of friends who have approved the file and an array of addresses of friends who have not approved the file
    function getFriendsApprovalStatus(
        string memory _ipfsHash
    )
        external
        view
        fileExists(_ipfsHash)
        returns (address[] memory, address[] memory)
    {
        address[] memory allFriends = userFriends[msg.sender];
        address[] memory approvedFriendsTemp = new address[](allFriends.length);
        address[] memory disapprovedFriendsTemp = new address[](
            allFriends.length
        );
        uint approvedCount = 0;
        uint disapprovedCount = 0;

        for (uint i = 0; i < allFriends.length; i++) {
            address friend = allFriends[i];
            bool isApproved = false;
            string[] storage approvedFileHashes = approvedFiles[msg.sender][
                friend
            ];

            for (uint j = 0; j < approvedFileHashes.length; j++) {
                if (
                    keccak256(bytes(approvedFileHashes[j])) ==
                    keccak256(bytes(_ipfsHash))
                ) {
                    isApproved = true;
                    break;
                }
            }

            if (isApproved) {
                approvedFriendsTemp[approvedCount] = friend;
                approvedCount++;
            } else {
                disapprovedFriendsTemp[disapprovedCount] = friend;
                disapprovedCount++;
            }
        }

        address[] memory approvedFriends = new address[](approvedCount);
        address[] memory disapprovedFriends = new address[](disapprovedCount);

        for (uint j = 0; j < approvedCount; j++) {
            approvedFriends[j] = approvedFriendsTemp[j];
        }

        for (uint k = 0; k < disapprovedCount; k++) {
            disapprovedFriends[k] = disapprovedFriendsTemp[k];
        }

        return (approvedFriends, disapprovedFriends);
    }

    /// @notice Adds a new friend for the user
    /// @param _friend Address of the friend to add
    function addFriend(
        address _friend
    ) external validateFriendship(_friend, "Already a friend.", false) {
        userFriends[msg.sender].push(_friend);
    }

    /// @notice Removes a friend from the user's friend list
    /// @param _friend Address of the friend to remove
    function removeFriend(
        address _friend
    ) external validateFriendship(_friend, "You are not friends.", true) {
        bool found = false;
        for (uint i = 0; i < userFriends[msg.sender].length; i++) {
            if (found || userFriends[msg.sender][i] == _friend) {
                if (i < userFriends[msg.sender].length - 1) {
                    userFriends[msg.sender][i] = userFriends[msg.sender][i + 1];
                }
                found = true;
            }
        }
        if (found) {
            userFriends[msg.sender].pop();
        }

        delete approvedFiles[msg.sender][_friend];
        delete approvedFiles[_friend][msg.sender];
    }

    /// @notice Retrieves the user's friend list
    /// @return An array of friend addresses
    function getFriends() external view returns (address[] memory) {
        return userFriends[msg.sender];
    }
}
