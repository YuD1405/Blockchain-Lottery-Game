import { expect } from "chai";
import { ethers } from "hardhat";

describe("Lottery Mechanism", () => {
  let lottery: any;
  let randomGenerator: any;
  let owner: any;
  let p1: any;
  let p2: any;
  let p3: any;

  beforeEach(async () => {
    [owner, p1, p2, p3] = await ethers.getSigners();

    // Deploy real RandomGenerator
    const RandomGen = await ethers.getContractFactory("RandomGenerator");
    randomGenerator = await RandomGen.deploy();
    await randomGenerator.waitForDeployment();

    // Deploy LotteryMechanism
    const Lottery = await ethers.getContractFactory("Lottery");
    lottery = await Lottery.deploy(await randomGenerator.getAddress(), ethers.ZeroAddress);

    await lottery.waitForDeployment();
  });

  it("players join correctly", async () => {
    const price = await lottery.getTicketPrice();

    await lottery.connect(p1).joinLottery({ value: price });
    await lottery.connect(p2).joinLottery({ value: price });

    expect(await lottery.getTicketCount()).to.equal(2);

    const players = await lottery.getPlayersByRound(0);
    expect(players[0]).to.equal(p1.address);
    expect(players[1]).to.equal(p2.address);
  });

  it("should pick a winner among players", async () => {
    const price = await lottery.getTicketPrice();

    await lottery.connect(p1).joinLottery({ value: price });
    await lottery.connect(p2).joinLottery({ value: price });
    await lottery.connect(p3).joinLottery({ value: price });

    const players = await lottery.getPlayersByRound(0);

    // --- Force time forward to pass deadline ---
    await ethers.provider.send("evm_increaseTime", [2 * 24 * 3600]);
    await ethers.provider.send("evm_mine", []);

    await lottery.pickWinner();

    const winner = await lottery.getWinnerByRound(0);

    // Winner must be in the players array
    expect(players).to.include(winner);

    // Game must be inactive after picking
    expect(await lottery.isGameActive()).to.equal(false);
  });

  it("manager resets game correctly", async () => {
    // Pass time so pickWinner becomes available
    const price = await lottery.getTicketPrice();
    await lottery.connect(p1).joinLottery({ value: price});
    await ethers.provider.send("evm_increaseTime", [2 * 24 * 3600]);
    await ethers.provider.send("evm_mine", []);
    await lottery.pickWinner();
    await lottery.resetGames();
    expect(await lottery.getTicketCount()).to.equal(0);
    expect(await lottery.isGameActive()).to.equal(true);

    // Round increments
    const playersNewRound = await lottery.getPlayersByRound(1);
    expect(playersNewRound.length).to.equal(0);
    await lottery.connect(p1).joinLottery({ value: price});
    await lottery.connect(p2).joinLottery({ value: price});
    await lottery.connect(p3).joinLottery({ value: price});
    const updatedPlayers = await lottery.getPlayersByRound(1);
    expect(updatedPlayers.length).to.equal(3);
  });
});
