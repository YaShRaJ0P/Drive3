// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.24;

contract Drive {
    struct File {
        string fileName;
        string ipfsHash;
        uint256 timestamp;
    }

    mapping(address => mapping(string => File)) private userFiles;
    mapping(address => string[]) private userFileHashes;
    mapping(address => address[]) private userFriends;
    mapping(address => mapping(address => string[])) private approvedFiles;

    event FileAdded(address indexed user, string ipfsHash);
    event FileDeleted(address indexed user, string ipfsHash);
    event FriendAdded(address indexed user, address friend);
    event FriendRemoved(address indexed user, address friend);
    event FileApproved(
        address indexed user,
        address indexed friend,
        string ipfsHash
    );
    event FileDisapproved(
        address indexed user,
        address indexed friend,
        string ipfsHash
    );

    modifier validateFriendship(
        address _user,
        address _friend,
        string memory _errorMessage,
        bool _shouldBeFriend
    ) {
        bool isFriend = false;
        for (uint i = 0; i < userFriends[_user].length; i++) {
            if (userFriends[_user][i] == _friend) {
                isFriend = true;
                break;
            }
        }
        require(isFriend == _shouldBeFriend, _errorMessage);
        _;
    }

    modifier fileExists(string memory _ipfsHash) {
        require(
            bytes(userFiles[msg.sender][_ipfsHash].ipfsHash).length != 0,
            "File does not exist"
        );
        _;
    }
// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.24;

contract Drive {
    struct File {
        string fileName;
        string ipfsHash;
        uint256 timestamp;
    }

    mapping(address => mapping(string => File)) private userFiles;
    mapping(address => string[]) private userFileHashes;
    mapping(address => address[]) private userFriends;
    mapping(address => mapping(address => string[])) private approvedFiles;

    event FileAdded(address indexed user, string ipfsHash);
    event FileDeleted(address indexed user, string ipfsHash);
    event FriendAdded(address indexed user, address friend);
    event FriendRemoved(address indexed user, address friend);
    event FileApproved(
        address indexed user,
        address[] indexed friends,
        string ipfsHash
    );
    event FileDisapproved(
        address indexed user,
        address indexed friend,
        string ipfsHash
    );

    modifier validateFriendship(
        address _user,
        address _friend,
        string memory _errorMessage,
        bool _shouldBeFriend
    ) {
        bool isFriend = false;
        for (uint i = 0; i < userFriends[_user].length; i++) {
            if (userFriends[_user][i] == _friend) {
                isFriend = true;
                break;
            }
        }
        require(isFriend == _shouldBeFriend, _errorMessage);
        _;
    }

    modifier fileExists(string memory _ipfsHash) {
        require(
            bytes(userFiles[msg.sender][_ipfsHash].ipfsHash).length != 0,
            "File does not exist"
        );
        _;
    }

    function addFile(string memory _fileName, string memory _ipfsHash) external {
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
        emit FileAdded(msg.sender, _ipfsHash);
    }

    function deleteFile(
        string memory _ipfsHash
    ) external fileExists(_ipfsHash) {
        string[] storage fileHashes = userFileHashes[msg.sender];
        bool found = false;
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

        emit FileDeleted(msg.sender, _ipfsHash);
    }

    function getAllFiles() external view returns (File[] memory) {
        string[] storage fileHashes = userFileHashes[msg.sender];
        File[] memory files = new File[](fileHashes.length);
        for (uint i = 0; i < fileHashes.length; i++) {
            files[i] = userFiles[msg.sender][fileHashes[i]];
        }
        return files;
    }

    function approveFile(
        string memory _ipfsHash,
        address[] memory _friends
    )
        external
        fileExists(_ipfsHash)
    {

        for (uint i = 0; i < _friends.length; i++) {
            address friend = _friends[i];
            bool isFriend = false;
            for (uint j = 0; j < userFriends[msg.sender].length; j++) {
                if (userFriends[msg.sender][j] == friend) {
                    isFriend = true;
                    break;
                }
            }
            require(isFriend, "Someone is not a friend");
            approvedFiles[msg.sender][friend].push(_ipfsHash);
        }
        emit FileApproved(msg.sender, _friends, _ipfsHash);
    }

    function disapproveFile(
        string memory _ipfsHash,
        address _friend
    )
        external
        fileExists(_ipfsHash)
        validateFriendship(msg.sender, _friend, "You are not friends.", true)
    {
        string[] storage friendApprovedFileHashes = approvedFiles[msg.sender][
            _friend
        ];
        bool found = false;
        for (uint i = 0; i < friendApprovedFileHashes.length; i++) {
            if (
                keccak256(bytes(friendApprovedFileHashes[i])) ==
                keccak256(bytes(_ipfsHash))
            ) {
                found = true;
            }
            if (found && i < friendApprovedFileHashes.length - 1) {
                friendApprovedFileHashes[i] = friendApprovedFileHashes[i + 1];
            }
        }
        if (found) {
            friendApprovedFileHashes.pop();
        }

        emit FileDisapproved(msg.sender, _friend, _ipfsHash);
    }

    function getApprovedFiles(
        address _from
    )
        external
        view
        validateFriendship(_from, msg.sender, "You are not friends.", true)
        returns (File[] memory)
    {
        string[] memory fileHashes = approvedFiles[_from][msg.sender];
        uint256 length = fileHashes.length;
        File[] memory approvedFilesArray = new File[](length);
        for (uint256 i = 0; i < length; i++) {
            approvedFilesArray[i] = userFiles[_from][fileHashes[i]];
        }
        return approvedFilesArray;
    }

    function addFriend(
        address _friend
    )
        external
        validateFriendship(msg.sender, _friend, "Already a friend.", false)
    {
        userFriends[msg.sender].push(_friend);
        emit FriendAdded(msg.sender, _friend);
    }

    function removeFriend(
        address _friend
    )
        external
        validateFriendship(msg.sender, _friend, "You are not friends.", true)
    {
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

        emit FriendRemoved(msg.sender, _friend);
    }

    function getFriends() external view returns (address[] memory) {
        return userFriends[msg.sender];
    }
}

    function addFile(string memory _ipfsHash) external {
        require(
            bytes(userFiles[msg.sender][_ipfsHash].ipfsHash).length == 0,
            "File already exists"
        );
        userFiles[msg.sender][_ipfsHash] = File({
            ipfsHash: _ipfsHash,
            timestamp: block.timestamp
        });
        userFileHashes[msg.sender].push(_ipfsHash);
        emit FileAdded(msg.sender, _ipfsHash);
    }

    function deleteFile(
        string memory _ipfsHash
    ) external fileExists(_ipfsHash) {
        string[] storage fileHashes = userFileHashes[msg.sender];
        bool found = false;
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

        emit FileDeleted(msg.sender, _ipfsHash);
    }

    function getAllFiles() external view returns (File[] memory) {
        string[] storage fileHashes = userFileHashes[msg.sender];
        File[] memory files = new File[](fileHashes.length);
        for (uint i = 0; i < fileHashes.length; i++) {
            files[i] = userFiles[msg.sender][fileHashes[i]];
        }
        return files;
    }

    function approveFile(
        string memory _ipfsHash,
        address _friend
    )
        external
        fileExists(_ipfsHash)
        validateFriendship(msg.sender, _friend, "You are not friends.", true)
    {
        approvedFiles[msg.sender][_friend].push(_ipfsHash);
        emit FileApproved(msg.sender, _friend, _ipfsHash);
    }

    function disapproveFile(
        string memory _ipfsHash,
        address _friend
    )
        external
        fileExists(_ipfsHash)
        validateFriendship(msg.sender, _friend, "You are not friends.", true)
    {
        string[] storage friendApprovedFileHashes = approvedFiles[msg.sender][
            _friend
        ];
        bool found = false;
        for (uint i = 0; i < friendApprovedFileHashes.length; i++) {
            if (
                keccak256(bytes(friendApprovedFileHashes[i])) ==
                keccak256(bytes(_ipfsHash))
            ) {
                found = true;
            }
            if (found && i < friendApprovedFileHashes.length - 1) {
                friendApprovedFileHashes[i] = friendApprovedFileHashes[i + 1];
            }
        }
        if (found) {
            friendApprovedFileHashes.pop();
        }

        emit FileDisapproved(msg.sender, _friend, _ipfsHash);
    }

    function getApprovedFiles(
        address _from
    )
        external
        view
        validateFriendship(_from, msg.sender, "You are not friends.", true)
        returns (File[] memory)
    {
        string[] memory fileHashes = approvedFiles[_from][msg.sender];
        uint256 length = fileHashes.length;
        File[] memory approvedFilesArray = new File[](length);
        for (uint256 i = 0; i < length; i++) {
            approvedFilesArray[i] = userFiles[_from][fileHashes[i]];
        }
        return approvedFilesArray;
    }

    function addFriend(
        address _friend
    )
        external
        validateFriendship(msg.sender, _friend, "Already a friend.", false)
    {
        userFriends[msg.sender].push(_friend);
        emit FriendAdded(msg.sender, _friend);
    }

    function removeFriend(
        address _friend
    )
        external
        validateFriendship(msg.sender, _friend, "You are not friends.", true)
    {
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

        emit FriendRemoved(msg.sender, _friend);
    }

    function getFriends() external view returns (address[] memory) {
        return userFriends[msg.sender];
    }
}
