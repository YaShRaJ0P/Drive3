const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Drive contract", function () {
  let Drive;
  let drive;
  let owner;
  let addr1;
  let addr2;

  beforeEach(async function () {
    Drive = await ethers.getContractFactory("Drive");
    [owner, addr1, addr2, _] = await ethers.getSigners();

    drive = await Drive.deploy();
    await drive.waitForDeployment();
  });

  describe("File management", function () {
    it("should add a file", async function () {
      const ipfsHash = "QmTestHash";
      await drive.addFile(ipfsHash);
      const files = await drive.getAllFiles();
      expect(files.length).to.equal(1);
      expect(files[0].ipfsHash).to.equal(ipfsHash);
    });

    it("should not add the same file twice", async function () {
      const ipfsHash = "QmTestHash";
      await drive.addFile(ipfsHash);
      await expect(drive.addFile(ipfsHash)).to.be.revertedWith(
        "File already exists"
      );
    });

    it("should delete a file", async function () {
      const ipfsHash = "QmTestHash";
      await drive.addFile(ipfsHash);
      await drive.deleteFile(ipfsHash);
      const files = await drive.getAllFiles();
      expect(files.length).to.equal(0);
    });

    it("should not delete a non-existing file", async function () {
      const ipfsHash = "QmTestHash";
      await expect(drive.deleteFile(ipfsHash)).to.be.revertedWith(
        "File does not exist"
      );
    });
  });

  describe("Friend management", function () {
    it("should add a friend", async function () {
      await drive.addFriend(addr1.address);
      const friends = await drive.getFriends();
      expect(friends.length).to.equal(1);
      expect(friends[0]).to.equal(addr1.address);
    });

    it("should not add the same friend twice", async function () {
      await drive.addFriend(addr1.address);
      await expect(drive.addFriend(addr1.address)).to.be.revertedWith(
        "Already a friend."
      );
    });

    it("should remove a friend", async function () {
      await drive.addFriend(addr1.address);
      await drive.removeFriend(addr1.address);
      const friends = await drive.getFriends();
      expect(friends.length).to.equal(0);
    });

    it("should not remove a non-existing friend", async function () {
      await expect(drive.removeFriend(addr1.address)).to.be.revertedWith(
        "Not your friend."
      );
    });
  });

  describe("File approval", function () {
    beforeEach(async function () {
      await drive.addFriend(addr1.address);
      await drive.addFile("QmTestHash");
    });

    it("should approve a file for a friend", async function () {
      await drive.approveFile("QmTestHash", addr1.address);
      const approvedFiles = await drive
        .connect(addr1)
        .getApprovedFiles(owner.address);
      expect(approvedFiles.length).to.equal(1);
      expect(approvedFiles[0].ipfsHash).to.equal("QmTestHash");
    });

    it("should not approve a non-existing file", async function () {
      await expect(
        drive.approveFile("NonExistingHash", addr1.address)
      ).to.be.revertedWith("File does not exist");
    });

    it("should disapprove an approved file", async function () {
      await drive.approveFile("QmTestHash", addr1.address);
      await drive.disapproveFile("QmTestHash", addr1.address);
      const approvedFiles = await drive
        .connect(addr1)
        .getApprovedFiles(owner.address);
      expect(approvedFiles.length).to.equal(0);
    });

    it("should not disapprove a non-existing file", async function () {
      await expect(
        drive.disapproveFile("NonExistingHash", addr1.address)
      ).to.be.revertedWith("File does not exist");
    });
  });
});
