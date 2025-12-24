import { ethers } from "hardhat";
import * as path from "path";
import * as dotenv from "dotenv";

// Load env from .env and .env.contracts
dotenv.config();
dotenv.config({ path: path.join(__dirname, "..", ".env.contracts") });

const COORDINATOR_ADDRESS = process.env.DEPLOYED_VRF_COORDINATOR || "0x9DdfaCa8183c41ad55329BdeeD9F6A8d53168B1B";
const SUBSCRIPTION_ID = process.env.DEPLOYED_VRF_SUBSCRIPTION_ID || "";
const CONSUMER_ADDRESS = process.env.RANDOM_NUMBER_CONSUMER_ADDRESS || "";

async function main() {
  if (!SUBSCRIPTION_ID) {
    throw new Error("VRF_SUBSCRIPTION_ID not set in .env or .env.contracts");
  }
  if (!CONSUMER_ADDRESS) {
    throw new Error("RANDOM_NUMBER_CONSUMER_ADDRESS not set in .env.contracts");
  }

  const [signer] = await ethers.getSigners();
  console.log(`Using signer: ${await signer.getAddress()}`);
  console.log(`Coordinator: ${COORDINATOR_ADDRESS}`);
  console.log(`Subscription ID: ${SUBSCRIPTION_ID}`);
  console.log(`Consumer to add: ${CONSUMER_ADDRESS}\n`);

  // VRF Coordinator V2.5 Plus ABI (only the functions we need)
  // V2.5 returns: (balance, nativeBalance, reqCount, subOwner, consumers)
  const coordinatorABI = [
    "function addConsumer(uint256 subId, address consumer) external",
    "function getSubscription(uint256 subId) external view returns (uint96 balance, uint96 nativeBalance, uint64 reqCount, address subOwner, address[] memory consumers)"
  ];

  const coordinator = new ethers.Contract(COORDINATOR_ADDRESS, coordinatorABI, signer);

  // Check current subscription status
  console.log("Checking current subscription...");
  try {
    const subInfo = await coordinator.getSubscription(SUBSCRIPTION_ID);
    const owner = subInfo.subOwner || subInfo[3]; // V2.5 uses 'subOwner'
    const consumers = subInfo.consumers || subInfo[4];
    const balance = subInfo.balance || subInfo[0];
    const nativeBalance = subInfo.nativeBalance || subInfo[1];

    console.log(`Current owner: ${owner}`);
    console.log(`LINK Balance: ${ethers.formatUnits(balance, 18)} LINK`);
    console.log(`Native Balance: ${ethers.formatEther(nativeBalance)} ETH`);
    console.log(`Current consumers (${consumers.length}):`);

    const isAlreadyAdded = consumers.some(
      (c: string) => c.toLowerCase() === CONSUMER_ADDRESS.toLowerCase()
    );

    consumers.forEach((c: string, i: number) => {
      const isYours = c.toLowerCase() === CONSUMER_ADDRESS.toLowerCase();
      console.log(`  [${i}] ${c}${isYours ? " ← YOUR CONSUMER" : ""}`);
    });

    if (isAlreadyAdded) {
      console.log("\n✓ Consumer is already added to the subscription!");
      return;
    }

    // Check if signer is the owner
    const signerAddress = await signer.getAddress();
    if (owner.toLowerCase() !== signerAddress.toLowerCase()) {
      console.log(`\n❌ ERROR: You are not the subscription owner!`);
      console.log(`Owner: ${owner}`);
      console.log(`Your address: ${signerAddress}`);
      console.log(`\nYou need to either:`);
      console.log(`1. Use the private key of the subscription owner (${owner})`);
      console.log(`2. Transfer subscription ownership using the VRF dashboard at https://vrf.chain.link/sepolia`);
      console.log(`3. Have the current owner add the consumer manually`);
      return;
    }

    console.log("\nAdding consumer to subscription...");
    const tx = await coordinator.addConsumer(SUBSCRIPTION_ID, CONSUMER_ADDRESS);
    console.log(`Transaction submitted: ${tx.hash}`);

    const receipt = await tx.wait();
    console.log(`✓ Consumer added successfully! (Block: ${receipt?.blockNumber})`);

    // Verify
    const updatedSubInfo = await coordinator.getSubscription(SUBSCRIPTION_ID);
    const updatedConsumers = updatedSubInfo.consumers || updatedSubInfo[4];
    console.log(`\nUpdated consumers (${updatedConsumers.length}):`);
    updatedConsumers.forEach((c: string, i: number) => {
      const isYours = c.toLowerCase() === CONSUMER_ADDRESS.toLowerCase();
      console.log(`  [${i}] ${c}${isYours ? " ← YOUR CONSUMER ✓" : ""}`);
    });
  } catch (error: any) {
    console.error("Error:", error.message);
    if (error.message.includes("InvalidSubscription")) {
      console.log("\n❌ Subscription ID is invalid or doesn't exist!");
      console.log("Create a new subscription at https://vrf.chain.link/sepolia");
    } else if (error.message.includes("MustBeSubOwner")) {
      console.log("\n❌ You must be the subscription owner to add consumers!");
    }
    throw error;
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
