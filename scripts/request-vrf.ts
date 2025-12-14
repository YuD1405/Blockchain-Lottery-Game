import { ethers } from "hardhat";
import * as path from "path";
import * as dotenv from "dotenv";

// Usage:
// SEPOLIA_RPC_URL=... PRIVATE_KEY=... \
// LOTTERY_CONTRACT_ADDRESS=0x... \
// npx hardhat run scripts/request-vrf.ts --network sepolia

const DEFAULT_LOTTERY = process.env.LOTTERY_CONTRACT_ADDRESS || "";
const DEFAULT_CONSUMER = process.env.RANDOM_NUMBER_CONSUMER_ADDRESS || "";
const TIMEOUT_MS = Number(process.env.VRF_TIMEOUT_MS || 120_000); // 2 minutes default

// Load env from .env and .env.contracts
dotenv.config();
dotenv.config({ path: path.join(__dirname, "..", ".env.contracts") });

async function waitForReturnedRandomness(consumer: any): Promise<readonly [bigint[], string]> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      consumer.removeAllListeners("ReturnedRandomness");
      reject(new Error("Timed out waiting for ReturnedRandomness"));
    }, TIMEOUT_MS);

    consumer.once(
      consumer.filters.ReturnedRandomness(),
      (randomWords: bigint[], event: any) => {
        clearTimeout(timer);
        resolve([randomWords, event.transactionHash]);
      }
    );
  });
}

async function main() {
  if (!DEFAULT_LOTTERY) throw new Error("Set LOTTERY_CONTRACT_ADDRESS env var or update script constant");
  if (!DEFAULT_CONSUMER) throw new Error("Set RANDOM_NUMBER_CONSUMER_ADDRESS env var or update script constant");

  const [signer] = await ethers.getSigners();
  console.log(`Using signer: ${await signer.getAddress()}`);

  const lottery = await ethers.getContractAt("Lottery", DEFAULT_LOTTERY, signer);
  const consumer = await ethers.getContractAt("RandomNumberConsumerV2Plus", DEFAULT_CONSUMER, signer);

  // Show consumer wiring
  const wiredLottery: string = await consumer.lottery();
  console.log(`Consumer.lottery wired to: ${wiredLottery}`);
  if (wiredLottery.toLowerCase() !== DEFAULT_LOTTERY.toLowerCase()) {
    throw new Error(`Consumer.lottery mismatch. Wired=${wiredLottery}, Expected=${DEFAULT_LOTTERY}. Run: npx hardhat run scripts/wire-consumer.ts --network sepolia`);
  }

  // Get ticket price
  const ticketPrice = await lottery.getTicketPrice();
  console.log(`Ticket price: ${ethers.formatEther(ticketPrice)} ETH`);

  // Read current status
  let isActive: boolean = await lottery.isGameActive();
  let awaiting: boolean = await lottery.isAwaitingRandomness();
  let ticketCount: bigint = await lottery.getTicketCount();
  const maxTicket: bigint = await lottery.getMaxTicket();
  console.log(`Status: active=${isActive} awaitingVRF=${awaiting} tickets=${ticketCount}/${maxTicket}`);

  // Ensure caller is manager (pickWinner is onlyManager)
  const manager: string = await lottery.getManager();
  const caller: string = await signer.getAddress();
  const isManager = manager.toLowerCase() === caller.toLowerCase();
  console.log(`Manager: ${manager} | Caller: ${caller} | isManager=${isManager}`);

  // If game is not active and not awaiting, reset it
  if (!isActive && !awaiting) {
    console.log(`\nGame is not active. Resetting lottery...`);
    try {
      const resetTx = await lottery.resetGames();
      const resetReceipt = await resetTx.wait();
      console.log(`✓ Lottery reset! Tx: ${resetReceipt?.hash}`);

      // Update status after reset
      isActive = await lottery.isGameActive();
      awaiting = await lottery.isAwaitingRandomness();
      ticketCount = await lottery.getTicketCount();
      const currentRound = await lottery.getCurrentRound();
      console.log(`New round: ${currentRound}, active: ${isActive}\n`);
    } catch (resetErr: any) {
      console.error(`Failed to reset lottery: ${resetErr.message}`);
      throw resetErr;
    }
  }

  // Join the lottery if not full and active
  if (isActive && !awaiting && ticketCount < maxTicket) {
    console.log(`Joining lottery...`);
    const joinTx = await lottery.joinLottery({ value: ticketPrice });
    const joinReceipt = await joinTx.wait();
    console.log(`Joined lottery. Tx: ${joinReceipt?.hash}`);

    // Update ticket count
    ticketCount = await lottery.getTicketCount();
  } else {
    console.log(`Skip join: active=${isActive}, awaiting=${awaiting}, tickets=${ticketCount}/${maxTicket}`);
  }

  // If awaiting VRF, don't call pickWinner again; just wait
  if (awaiting) {
    console.log(`Already awaiting VRF; skipping pickWinner`);
  } else {
    if (!isManager) {
      throw new Error(`pickWinner requires manager. Current caller ${caller} is not manager ${manager}. Use the deployer key or switch PRIVATE_KEY.`);
    }
    // Now call pickWinner
    console.log(`Calling pickWinner on lottery: ${DEFAULT_LOTTERY}`);
    try {
      const tx = await lottery.pickWinner();
      const receipt = await tx.wait();
      console.log(`Submitted pickWinner request. Tx: ${receipt?.hash}`);
    } catch (err: any) {
      console.error(`pickWinner reverted. Likely VRF config issue.`);
      console.error(`Hints: ensure subscription is funded, keyHash/coordinator correct, and consumer ${DEFAULT_CONSUMER} is added to subscription ${process.env.VRF_SUBSCRIPTION_ID}.`);
      throw err;
    }
  }
  
  const requestId: bigint = await consumer.s_requestId();
  console.log(`Request ID: ${requestId.toString()}`);

  // Try to check if already fulfilled
  try {
    const storedWord0 = await consumer.s_randomWords(0);
    if (storedWord0 > 0n) {
      console.log("✓ Already fulfilled!");
      const storedWord1 = await consumer.s_randomWords(1);
      console.log(`Random Words: ${storedWord0.toString()}, ${storedWord1.toString()}`);
      return;
    }
  } catch (e) {
    // Array not initialized yet, wait for event
  }

  console.log("Waiting for VRF fulfillment (can take 1-3 minutes on Sepolia)...");

  try {
    const [randomWords, fulfillTxHash] = await waitForReturnedRandomness(consumer);

    console.log("\n✓ Fulfilled!");
    console.log(`Fulfill Tx: ${fulfillTxHash}`);
    console.log(`\n=== Random Numbers ===`);
    console.log(`Random Word 0: ${randomWords[0].toString()}`);
    console.log(`Random Word 1: ${randomWords[1].toString()}`);

    console.log(`\n=== Different Formats ===`);
    console.log(`Hex format:`);
    console.log(`  Word 0: 0x${randomWords[0].toString(16)}`);
    console.log(`  Word 1: 0x${randomWords[1].toString(16)}`);

    console.log(`\nAs numbers 0-99:`);
    console.log(`  Word 0 mod 100: ${randomWords[0] % 100n}`);
    console.log(`  Word 1 mod 100: ${randomWords[1] % 100n}`);

    // Check lottery winner
    const lottery = await ethers.getContractAt("Lottery", DEFAULT_LOTTERY);
    const currentRound = await lottery.getCurrentRound();

    if (currentRound > 0n) {
      const latestRound = currentRound - 1n;
      const winner = await lottery.getWinnerByRound(latestRound);
      if (winner !== ethers.ZeroAddress) {
        console.log(`\n🎉 Winner of Round ${latestRound}: ${winner}`);
      }
    }
  } catch (err: any) {
    console.error("\n⏱️  Timeout waiting for VRF callback.");
    console.log("This doesn't mean it failed - the callback might just take longer than expected.");
    console.log("\nTo check if it was fulfilled, run:");
    console.log("  task get-random-numbers");
    console.log(`\nOr check the VRF dashboard:`);
    console.log(`  https://vrf.chain.link/sepolia/${process.env.VRF_SUBSCRIPTION_ID}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
