import { ethers } from "hardhat";

// Usage:
// SEPOLIA_RPC_URL=... PRIVATE_KEY=... \
// CONSUMER_ADDRESS=0x... \
// npx hardhat run scripts/request-vrf.ts --network sepolia

const DEFAULT_CONSUMER = process.env.CONSUMER_ADDRESS || "0x86bD52A611C9ec275e0F03B05F4d913A3d1b78E1";
const TIMEOUT_MS = Number(process.env.VRF_TIMEOUT_MS || 120_000); // 2 minutes default

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
  if (!DEFAULT_CONSUMER) throw new Error("Set CONSUMER_ADDRESS env var or update script constant");

  const [signer] = await ethers.getSigners();
  console.log(`Using signer: ${await signer.getAddress()}`);

  const consumer = await ethers.getContractAt("RandomNumberConsumerV2Plus", DEFAULT_CONSUMER, signer);

  console.log(`Requesting VRF on consumer: ${DEFAULT_CONSUMER}`);
  const tx = await consumer.requestRandomWords();
  const receipt = await tx.wait();
  const requestId: bigint = await consumer.s_requestId();
  console.log(`Submitted request. Tx: ${receipt?.hash}`);
  console.log(`Request ID: ${requestId.toString()}`);

  console.log("Waiting for ReturnedRandomness...");
  const [randomWords, fulfillTxHash] = await waitForReturnedRandomness(consumer);

  console.log("Fulfilled!");
  console.log(`Fulfill Tx: ${fulfillTxHash}`);
  console.log(`Random Words: ${randomWords.map((w) => w.toString()).join(", ")}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
