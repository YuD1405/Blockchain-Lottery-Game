import { ethers } from "hardhat";

// Usage:
// SEPOLIA_RPC_URL=... PRIVATE_KEY=... \
// LOTTERY_ADDRESS=0x... \
// npx hardhat run scripts/pick-winner.ts --network sepolia

const DEFAULT_LOTTERY = process.env.LOTTERY_ADDRESS || "0xe38B6F317476E6015c838D13595df02D83A310F7";
const TIMEOUT_MS = Number(process.env.LOTTERY_TIMEOUT_MS || 180_000); // 3 minutes default

async function waitForWinnerPicked(lottery: any): Promise<readonly [string, bigint, bigint, string]> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      lottery.removeAllListeners("WinnerPicked");
      reject(new Error("Timed out waiting for WinnerPicked"));
    }, TIMEOUT_MS);

    lottery.once(
      lottery.filters.WinnerPicked(),
      (winner: string, prize: bigint, winnerNFTId: bigint, event: any) => {
        clearTimeout(timer);
        resolve([winner, prize, winnerNFTId, event.transactionHash]);
      }
    );
  });
}

async function main() {
  if (!DEFAULT_LOTTERY) throw new Error("Set LOTTERY_ADDRESS env var or update script constant");

  const [signer] = await ethers.getSigners();
  console.log(`Using signer: ${await signer.getAddress()}`);

  const lottery = await ethers.getContractAt("Lottery", DEFAULT_LOTTERY, signer);

  // Optional: show status before calling
  const isActive: boolean = await lottery.isGameActive();
  const ticketCount: bigint = await lottery.getTicketCount();
  const maxTicket: bigint = await lottery.getMaxTicket();
  const deadline: bigint = await lottery.getDeadlines();
  console.log(`Status: active=${isActive} tickets=${ticketCount}/${maxTicket} deadline=${deadline}`);

  console.log(`Calling pickWinner() on: ${DEFAULT_LOTTERY}`);
  const tx = await lottery.pickWinner();
  const receipt = await tx.wait();
  console.log(`pickWinner tx: ${receipt?.hash}`);

  // If VRF path is used, the contract emits WinnerPicked in the VRF callback
  console.log("Waiting for WinnerPicked...");
  const [winner, prize, nftId, eventHash] = await waitForWinnerPicked(lottery);
  console.log("Winner picked!");
  console.log(`Winner: ${winner}`);
  console.log(`Prize: ${prize.toString()} wei`);
  console.log(`Winner NFT ID: ${nftId.toString()}`);
  console.log(`Callback tx: ${eventHash}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
