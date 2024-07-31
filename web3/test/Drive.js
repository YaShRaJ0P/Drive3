const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Drive Contract", function () {
  let Drive, drive;
  let owner, addr1, addr2, addr3;

  beforeEach(async function () {
    Drive = await ethers.getContractFactory("Drive");
    [owner, addr1, addr2, addr3] = await ethers.getSigners();
    drive = await Drive.deploy();
    await drive.waitForDeployment();
  });

  describe("File Management", function () {
    it("Should add a file", async function () {
      await drive.addFile("file1.txt", "ipfsHash1");
      const files = await drive.getAllFiles();
      expect(files.length).to.equal(1);
      expect(files[0].fileName).to.equal("file1.txt");
    });

    it("Should not allow adding the same file twice", async function () {
      await drive.addFile("file1.txt", "ipfsHash1");
      await expect(drive.addFile("file1.txt", "ipfsHash1")).to.be.revertedWith(
        "File already exists"
      );
    });

    it("Should delete a file", async function () {
      await drive.addFile("file1.txt", "ipfsHash1");
      await drive.deleteFile("ipfsHash1");
      const files = await drive.getAllFiles();
      expect(files.length).to.equal(0);
    });
  });

  describe("Friend Management", function () {
    it("Should add a friend", async function () {
      await drive.addFriend(addr1.address);
      const friends = await drive.getFriends();
      expect(friends.length).to.equal(1);
      expect(friends[0]).to.equal(addr1.address);
    });

    it("Should remove a friend", async function () {
      await drive.addFriend(addr1.address);
      await drive.removeFriend(addr1.address);
      const friends = await drive.getFriends();
      expect(friends.length).to.equal(0);
    });
  });

  describe("File Approval", function () {
    it("Should approve files for mutual friends", async function () {
      // addr1 and addr2 add files
      await drive.connect(addr1).addFile("file1.txt", "ipfsHash1");
      await drive.connect(addr2).addFile("file2.txt", "ipfsHash2");

      // Establish mutual friendship between owner and addr1
      await drive.connect(addr1).addFriend(owner.address);
      await drive.connect(owner).addFriend(addr1.address);

      // Approve the file for the owner by addr1
      await drive.connect(addr1).approveFile("ipfsHash1", [owner.address]);

      // Establish mutual friendship between owner and addr2
      await drive.connect(addr2).addFriend(owner.address);
      await drive.connect(owner).addFriend(addr2.address);

      // Approve the file for the owner by addr2
      await drive.connect(addr2).approveFile("ipfsHash2", [owner.address]);

      // Verify the owner can see the approved files from addr1 and addr2
      const [friends, approvedFiles] = await drive.getApprovedFiles();
      expect(friends.length).to.equal(2);
      expect(friends[0]).to.equal(addr1.address);
      expect(friends[1]).to.equal(addr2.address);
      expect(approvedFiles[0].length).to.equal(1);
      expect(approvedFiles[0][0].ipfsHash).to.equal("ipfsHash1");
      expect(approvedFiles[1].length).to.equal(1);
      expect(approvedFiles[1][0].ipfsHash).to.equal("ipfsHash2");
    });

    it("Should not show approved files if friendship is not mutual", async function () {
      // addr1 adds a file
      await drive.connect(addr1).addFile("file1.txt", "ipfsHash1");

      // addr1 adds owner as a friend, but owner does not add addr1 back
      await drive.connect(addr1).addFriend(owner.address);

      // addr1 approves the file for owner
      await drive.connect(addr1).approveFile("ipfsHash1", [owner.address]);

      // Verify owner cannot see the approved file since the friendship is not mutual
      const [friends, approvedFiles] = await drive.getApprovedFiles();
      expect(friends.length).to.equal(0);
      expect(approvedFiles.length).to.equal(0);
    });

    it("Should disapprove a file for a friend", async function () {
      await drive.addFile("file1.txt", "ipfsHash1");
      await drive.addFriend(addr1.address);

      await drive.approveFile("ipfsHash1", [addr1.address]);

      await drive.disapproveFile("ipfsHash1", [addr1.address]);

      const [friends, approvedFiles] = await drive.getApprovedFiles();
      expect(friends.length).to.equal(1);
      expect(approvedFiles[0].length).to.equal(0);
    });
  });
});
