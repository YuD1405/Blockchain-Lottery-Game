import { expect } from "chai";
import { ethers } from "hardhat";
import {
  Lottery,
  RandomNumberConsumerV2Plus,
  MockVRFCoordinatorV2Plus,
  NFT,
} from "../typechain-types";

describe("Lottery with VRF consumer", () => {
  let lottery: Lottery;
  let randomConsumer: RandomNumberConsumerV2Plus;
  let mockVRF: MockVRFCoordinatorV2Plus;
  let nft: NFT;
  let owner: any;
  let p1: any;
  let p2: any;
  let p3: any;

  const SUBSCRIPTION_ID = 1;
  const KEY_HASH = "0x474e34a077df58807dbe9c96d3c009b23b3c6d0cce433e59bbf5b34f823bc56c"; // example key hash

  beforeEach(async () => {
    [owner, p1, p2, p3] = await ethers.getSigners();

    // Deploy mock coordinator
    const MockVRF = await ethers.getContractFactory("MockVRFCoordinatorV2Plus");
    mockVRF = (await MockVRF.deploy()) as MockVRFCoordinatorV2Plus;
    await mockVRF.waitForDeployment();

    // Deploy consumer with placeholder lottery (set later)
    const ConsumerFactory: any = await ethers.getContractFactory("RandomNumberConsumerV2Plus");
    randomConsumer = (await ConsumerFactory.deploy(
      SUBSCRIPTION_ID,
      await mockVRF.getAddress(),
      KEY_HASH,
      ethers.ZeroAddress
    )) as RandomNumberConsumerV2Plus;
    await randomConsumer.waitForDeployment();

    // Deploy NFT contract
    const NFTFactory = await ethers.getContractFactory("NFT");
    nft = (await NFTFactory.deploy()) as NFT;
    await nft.waitForDeployment();

    // Deploy lottery pointing to consumer
    const LotteryFactory = await ethers.getContractFactory("Lottery");
    lottery = (await LotteryFactory.deploy(
      await randomConsumer.getAddress(),
      await nft.getAddress()
    )) as Lottery;
    await lottery.waitForDeployment();

    // Wire consumer to lottery so callbacks and requests are authorized
    await (randomConsumer as any).setLottery(await lottery.getAddress());
  });

  it("players join and VRF callback selects a winner", async () => {
    const price = await lottery.getTicketPrice();

    await lottery.connect(p1).joinLottery({ value: price });
    await lottery.connect(p2).joinLottery({ value: price });
    await lottery.connect(p3).joinLottery({ value: price });

    const players = await lottery.getPlayersByRound(0);

    // Advance time to make pickWinner available
    await ethers.provider.send("evm_increaseTime", [2 * 24 * 3600]);
    await ethers.provider.send("evm_mine", []);

    // Request randomness via lottery -> consumer
    await lottery.pickWinner();

    // Fulfill via mock coordinator
    const requestId = await randomConsumer.s_requestId();
    const randomWords = [BigInt(7), BigInt(11)];
    await mockVRF.fulfillRandomWords(requestId, randomWords);

    const winner = await lottery.getWinnerByRound(0);
    expect(players).to.include(winner);
    expect(await lottery.isGameActive()).to.equal(false);
  });

  it("manager can reset after VRF completion", async () => {
    const price = await lottery.getTicketPrice();
    await lottery.connect(p1).joinLottery({ value: price });

    await ethers.provider.send("evm_increaseTime", [2 * 24 * 3600]);
    await ethers.provider.send("evm_mine", []);

    await lottery.pickWinner();
    const requestId = await randomConsumer.s_requestId();
    await mockVRF.fulfillRandomWords(requestId, [BigInt(5), BigInt(9)]);

    await lottery.resetGames();
    expect(await lottery.getTicketCount()).to.equal(0);
    expect(await lottery.isGameActive()).to.equal(true);

    // New round accepts joins
    await lottery.connect(p1).joinLottery({ value: price });
    await lottery.connect(p2).joinLottery({ value: price });
    const updatedPlayers = await lottery.getPlayersByRound(1);
    expect(updatedPlayers.length).to.equal(2);
  });
});
