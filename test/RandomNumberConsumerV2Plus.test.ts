import { expect } from "chai";
import { ethers } from "hardhat";
import { RandomNumberConsumerV2Plus, MockVRFCoordinatorV2Plus } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("RandomNumberConsumerV2Plus", function () {
  let randomNumberConsumer: RandomNumberConsumerV2Plus;
  let mockVRFCoordinator: MockVRFCoordinatorV2Plus;
  let owner: HardhatEthersSigner;
  let user: HardhatEthersSigner;
  
  const SUBSCRIPTION_ID = 1;
  const KEY_HASH = "0x474e34a077df58807dbe9c96d3c009b23b3c6d0cce433e59bbf5b34f823bc56c"; // Example key hash

  beforeEach(async function () {
    [owner, user] = await ethers.getSigners();

    // Deploy mock VRF Coordinator
    const MockVRFCoordinatorFactory = await ethers.getContractFactory("MockVRFCoordinatorV2Plus");
    mockVRFCoordinator = await MockVRFCoordinatorFactory.deploy();
    await mockVRFCoordinator.waitForDeployment();

    // Deploy RandomNumberConsumerV2Plus
    const RandomNumberConsumerFactory: any = await ethers.getContractFactory("RandomNumberConsumerV2Plus");
    randomNumberConsumer = await RandomNumberConsumerFactory.deploy(
      SUBSCRIPTION_ID,
      await mockVRFCoordinator.getAddress(),
      KEY_HASH,
      ethers.ZeroAddress // lottery address not needed in these tests
    );
    await randomNumberConsumer.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should deploy with correct parameters", async function () {
      // The subscription ID is immutable and stored internally
      // We can verify deployment was successful
      expect(await randomNumberConsumer.getAddress()).to.not.equal(ethers.ZeroAddress);
    });

    it("Should set the correct owner", async function () {
      expect(await randomNumberConsumer.owner()).to.equal(owner.address);
    });
  });

  describe("Request Random Words", function () {
    it("Should allow owner to request random words", async function () {
      const tx = await randomNumberConsumer.requestRandomWords();
      const receipt = await tx.wait();
      
      expect(receipt).to.not.be.null;
      
      // Check that request ID is set
      const requestId = await randomNumberConsumer.s_requestId();
      expect(requestId).to.be.gt(0);
    });

    it("Should revert if non-owner tries to request random words", async function () {
      await expect(
        randomNumberConsumer.connect(user).requestRandomWords()
      ).to.be.reverted;
    });

    it("Should emit event from VRF Coordinator", async function () {
      await expect(randomNumberConsumer.requestRandomWords())
        .to.emit(mockVRFCoordinator, "RandomWordsRequested");
    });
  });

  describe("Fulfill Random Words", function () {
    it("Should receive and store random words", async function () {
      // Request random words
      await randomNumberConsumer.requestRandomWords();
      const requestId = await randomNumberConsumer.s_requestId();

      // Simulate VRF Coordinator fulfilling the request
      const randomWords = [
        BigInt("12345678901234567890123456789012345678901234567890"),
        BigInt("98765432109876543210987654321098765432109876543210")
      ];

      const tx = await mockVRFCoordinator.fulfillRandomWords(requestId, randomWords);
      await tx.wait();

      // Check that random words are stored
      const storedWord1 = await randomNumberConsumer.s_randomWords(0);
      const storedWord2 = await randomNumberConsumer.s_randomWords(1);

      expect(storedWord1).to.equal(randomWords[0]);
      expect(storedWord2).to.equal(randomWords[1]);
    });

    it("Should emit ReturnedRandomness event", async function () {
      // Request random words
      await randomNumberConsumer.requestRandomWords();
      const requestId = await randomNumberConsumer.s_requestId();

      const randomWords = [
        BigInt("12345678901234567890123456789012345678901234567890"),
        BigInt("98765432109876543210987654321098765432109876543210")
      ];

      // Fulfill and check event
      await expect(mockVRFCoordinator.fulfillRandomWords(requestId, randomWords))
        .to.emit(randomNumberConsumer, "ReturnedRandomness")
        .withArgs(randomWords);
    });

    it("Should handle multiple requests correctly", async function () {
      // First request
      await randomNumberConsumer.requestRandomWords();
      const requestId1 = await randomNumberConsumer.s_requestId();

      const randomWords1 = [BigInt("111"), BigInt("222")];
      await mockVRFCoordinator.fulfillRandomWords(requestId1, randomWords1);

      expect(await randomNumberConsumer.s_randomWords(0)).to.equal(randomWords1[0]);
      expect(await randomNumberConsumer.s_randomWords(1)).to.equal(randomWords1[1]);

      // Second request
      await randomNumberConsumer.requestRandomWords();
      const requestId2 = await randomNumberConsumer.s_requestId();

      const randomWords2 = [BigInt("333"), BigInt("444")];
      await mockVRFCoordinator.fulfillRandomWords(requestId2, randomWords2);

      // Values should be updated
      expect(await randomNumberConsumer.s_randomWords(0)).to.equal(randomWords2[0]);
      expect(await randomNumberConsumer.s_randomWords(1)).to.equal(randomWords2[1]);
    });
  });

  describe("Edge Cases", function () {
    it("Should handle request without fulfillment", async function () {
      await randomNumberConsumer.requestRandomWords();
      const requestId = await randomNumberConsumer.s_requestId();
      
      expect(requestId).to.be.gt(0);
      
      // Array should be empty before fulfillment
      await expect(randomNumberConsumer.s_randomWords(0)).to.be.reverted;
    });

    it("Should fail to fulfill non-existent request", async function () {
      const fakeRequestId = 999;
      const randomWords = [BigInt("111"), BigInt("222")];

      await expect(
        mockVRFCoordinator.fulfillRandomWords(fakeRequestId, randomWords)
      ).to.be.revertedWith("Request not found");
    });
  });

  describe("Integration Test", function () {
    it("Should complete full request-fulfill cycle", async function () {
      console.log("Step 1: Request random words");
      const requestTx = await randomNumberConsumer.requestRandomWords();
      await requestTx.wait();
      
      const requestId = await randomNumberConsumer.s_requestId();
      console.log(`  Request ID: ${requestId}`);

      console.log("Step 2: Simulate VRF fulfillment");
      const randomWords = [
        BigInt("123456789012345678901234567890"),
        BigInt("987654321098765432109876543210")
      ];
      
      const fulfillTx = await mockVRFCoordinator.fulfillRandomWords(requestId, randomWords);
      await fulfillTx.wait();

      console.log("Step 3: Verify stored random words");
      const word1 = await randomNumberConsumer.s_randomWords(0);
      const word2 = await randomNumberConsumer.s_randomWords(1);
      
      console.log(`  Random Word 1: ${word1}`);
      console.log(`  Random Word 2: ${word2}`);

      expect(word1).to.equal(randomWords[0]);
      expect(word2).to.equal(randomWords[1]);
    });
  });
});
