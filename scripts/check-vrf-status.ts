import { ethers } from "hardhat";

const COORDINATOR_ADDRESS = "0x9DdfaCa8183c41ad55329BdeeD9F6A8d53168B1B"; // Sepolia
const CONSUMER_ADDRESS = process.env.CONSUMER_ADDRESS || "0x86bD52A611C9ec275e0F03B05F4d913A3d1b78E1";
const SUBSCRIPTION_ID = process.env.VRF_SUBSCRIPTION_ID || "15414481716405032354955166003239769119703192698243633941773637214067605167561";

async function main() {
  const [signer] = await ethers.getSigners();
  console.log(`Checking VRF status for subscription: ${SUBSCRIPTION_ID}`);
  console.log(`Consumer to verify: ${CONSUMER_ADDRESS}`);
  console.log(`Signer: ${await signer.getAddress()}\n`);

  try {
    const provider = ethers.provider;
    
    // Encode the function call manually
    const iface = new ethers.Interface([
      "function getSubscription(uint256) view returns (address, address[], uint96, uint96, address)"
    ]);
    
    const callData = iface.encodeFunctionData("getSubscription", [SUBSCRIPTION_ID]);
    const result = await provider.call({
      to: COORDINATOR_ADDRESS,
      data: callData,
    });
    
    // Parse manually: result should be (address, offset_to_array, uint96, uint96, address)
    // offset=160 (0xa0), array_length at offset+32, then consumer addresses
    const resultHex = result;
    
    // Extract first 32 bytes = owner address (padded)
    const ownerHex = "0x" + resultHex.slice(26, 66); // Skip 0x and first 12 bytes (padding)
    
    // Extract uint96 balance at offset 96
    const balanceHex = resultHex.slice(66 + 64, 66 + 128); // 4th field (offset 96)
    const balance = BigInt("0x" + balanceHex);
    
    // Extract reqCount at offset 128
    const reqCountHex = resultHex.slice(66 + 128, 66 + 192);
    const reqCount = BigInt("0x" + reqCountHex);
    
    // Array offset is at offset 32 (offset 0xa0 = 160 decimal)
    // Find array data: array_length is at position result[160:192]
    // Consumers list starts at 160 + 32
    const arrayLengthHex = resultHex.slice(66 + 192, 66 + 256); // offset 160 (a0 in hex)
    const arrayLength = parseInt(arrayLengthHex, 16);
    
    const consumers: string[] = [];
    for (let i = 0; i < arrayLength; i++) {
      const offset = 66 + 256 + i * 64;
      const consumerHex = "0x" + resultHex.slice(offset + 24, offset + 64);
      consumers.push(consumerHex);
    }
    
    console.log("=== Subscription Status ===");
    console.log(`Owner: ${ownerHex}`);
    console.log(`LINK Balance: ${ethers.formatUnits(balance, 18)} LINK`);
    console.log(`Request Count: ${reqCount}`);
    console.log(`Number of Consumers: ${arrayLength}`);
    
    console.log("\n=== Consumers ===");
    consumers.forEach((c: string, i: number) => {
      const isYours = c.toLowerCase() === CONSUMER_ADDRESS.toLowerCase();
      console.log(`[${i}] ${c}${isYours ? " ← YOUR CONSUMER ✓" : ""}`);
    });
    
    const isConsumerAdded = consumers.some((c: string) => c.toLowerCase() === CONSUMER_ADDRESS.toLowerCase());
    if (!isConsumerAdded) {
      console.log("\n❌ ERROR: Your consumer is NOT added to this subscription!");
      console.log(`Add ${CONSUMER_ADDRESS} as a consumer in the VRF dashboard at https://vrf.chain.link/sepolia`);
    } else {
      console.log(`\n✓ Your consumer IS added to the subscription!`);
    }
    
    if (balance < ethers.parseUnits("0.5", 18)) {
      console.log(`\n⚠️  WARNING: Low LINK balance (${ethers.formatUnits(balance, 18)} LINK). Fund your subscription.`);
    } else {
      console.log(`\n✓ Subscription has sufficient LINK (${ethers.formatUnits(balance, 18)} LINK).`);
    }
  } catch (e) {
    console.error("Error checking subscription:", e);
  }
}

main().catch(console.error);

