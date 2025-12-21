import { ethers } from "hardhat";

async function main() {
  const [owner] = await ethers.getSigners();

  const LOTTERY_ADDRESS = "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0";

  const lottery = await ethers.getContractAt(
    "Lottery",
    LOTTERY_ADDRESS,
    owner
  );

  const ENTRY_FEE = await lottery.getTicketPrice();

  console.log("Manager:", owner.address);

  for (let round = 1; round <= 25; round++) {
    console.log(`\n🎲 ROUND ${round}`);

    const joinTx = await lottery.joinLottery({ value: ENTRY_FEE });
    await joinTx.wait();

    const pickTx = await lottery.pickWinner();
    await pickTx.wait();

    const resetTx = await lottery.resetGames();
    await resetTx.wait();

    console.log(`✅ Round ${round} finished`);
  }
}

main().catch(console.error);
