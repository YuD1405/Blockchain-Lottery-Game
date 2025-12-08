import { expect } from "chai";
import { ethers } from "hardhat";
import { NFT } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("LotteryNFT", function () {
  let lotteryNFT: NFT;
  let owner: HardhatEthersSigner;
  let winner1: HardhatEthersSigner;
  let winner2: HardhatEthersSigner;

  beforeEach(async function () {
    // Lấy test accounts
    [owner, winner1, winner2] = await ethers.getSigners();

    // Deploy contract
    const LotteryNFT = await ethers.getContractFactory("NFT");
    lotteryNFT = await LotteryNFT.deploy();
    await lotteryNFT.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the correct name and symbol", async function () {
      expect(await lotteryNFT.name()).to.equal("LotteryWinner");
      expect(await lotteryNFT.symbol()).to.equal("LWIN");
    });

    it("Should set the deployer as owner", async function () {
      expect(await lotteryNFT.owner()).to.equal(owner.address);
    });

    it("Should have 0 total supply initially", async function () {
      expect(await lotteryNFT.totalSupply()).to.equal(0);
    });
  });

  describe("Minting NFT", function () {
    it("Should mint NFT to winner", async function () {
      const tx = await lotteryNFT.mint(winner1.address);
      await tx.wait();

      // Check owner của tokenId 0
      expect(await lotteryNFT.ownerOf(0)).to.equal(winner1.address);
      expect(await lotteryNFT.totalSupply()).to.equal(1);
    });

    it("Should mint multiple NFTs with correct tokenIds", async function () {
      await lotteryNFT.mint(winner1.address);
      await lotteryNFT.mint(winner2.address);
      await lotteryNFT.mint(winner1.address);

      expect(await lotteryNFT.ownerOf(0)).to.equal(winner1.address);
      expect(await lotteryNFT.ownerOf(1)).to.equal(winner2.address);
      expect(await lotteryNFT.ownerOf(2)).to.equal(winner1.address);
      expect(await lotteryNFT.totalSupply()).to.equal(3);
    });

    it("Should emit NFTMinted event", async function () {
      await expect(lotteryNFT.mint(winner1.address))
        .to.emit(lotteryNFT, "NFTMinted")
        .withArgs(winner1.address, 0, 0);
    });

    it("Should only allow owner to mint", async function () {
      await expect(
        lotteryNFT.connect(winner1).mint(winner2.address)
      ).to.be.revertedWithCustomError(lotteryNFT, "OwnableUnauthorizedAccount");
    });

    it("Should return correct tokenId when minting", async function () {
      const tokenId1 = await lotteryNFT.mint.staticCall(winner1.address);
      await lotteryNFT.mint(winner1.address);
      
      const tokenId2 = await lotteryNFT.mint.staticCall(winner2.address);
      await lotteryNFT.mint(winner2.address);

      expect(tokenId1).to.equal(0);
      expect(tokenId2).to.equal(1);
    });
  });

  describe("Minting with Round", function () {
    it("Should mint NFT with round number", async function () {
      await lotteryNFT.mintWithRound(winner1.address, 5);
      
      const [owner, round, timestamp] = await lotteryNFT.getTokenInfo(0);
      
      expect(owner).to.equal(winner1.address);
      expect(round).to.equal(5);
      expect(timestamp).to.be.greaterThan(0);
    });

    it("Should track different rounds correctly", async function () {
      await lotteryNFT.mintWithRound(winner1.address, 1);
      await lotteryNFT.mintWithRound(winner2.address, 2);
      await lotteryNFT.mintWithRound(winner1.address, 3);

      const [, round0] = await lotteryNFT.getTokenInfo(0);
      const [, round1] = await lotteryNFT.getTokenInfo(1);
      const [, round2] = await lotteryNFT.getTokenInfo(2);

      expect(round0).to.equal(1);
      expect(round1).to.equal(2);
      expect(round2).to.equal(3);
    });
  });

  describe("Token URI", function () {
    it("Should set and get token URI", async function () {
      await lotteryNFT.mint(winner1.address);
      
      const tokenURI = "ipfs://QmTest123";
      await lotteryNFT.setTokenURI(0, tokenURI);
      
      expect(await lotteryNFT.tokenURI(0)).to.equal(tokenURI);
    });

    it("Should only allow owner to set token URI", async function () {
      await lotteryNFT.mint(winner1.address);
      
      await expect(
        lotteryNFT.connect(winner1).setTokenURI(0, "ipfs://test")
      ).to.be.revertedWithCustomError(lotteryNFT, "OwnableUnauthorizedAccount");
    });
  });

  describe("Token Info", function () {
    it("Should return correct token info", async function () {
      await lotteryNFT.mintWithRound(winner1.address, 10);
      
      const [owner, round, timestamp] = await lotteryNFT.getTokenInfo(0);
      
      expect(owner).to.equal(winner1.address);
      expect(round).to.equal(10);
      expect(timestamp).to.be.greaterThan(0);
    });

    it("Should revert when querying non-existent token", async function () {
      await expect(
        lotteryNFT.getTokenInfo(999)
      ).to.be.revertedWithCustomError(lotteryNFT, "ERC721NonexistentToken");
    });
  });

  describe("NFT Transfer", function () {
    it("Should allow winner to transfer NFT", async function () {
      await lotteryNFT.mint(winner1.address);
      
      // Winner1 transfer NFT cho winner2
      await lotteryNFT.connect(winner1).transferFrom(
        winner1.address,
        winner2.address,
        0
      );
      
      expect(await lotteryNFT.ownerOf(0)).to.equal(winner2.address);
    });
  });
});
