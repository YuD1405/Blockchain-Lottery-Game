import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

// Sepolia defaults from Chainlink docs (override via env if needed)
const DEFAULT_SEPOLIA_COORDINATOR = "0x9DdfaCa8183c41ad55329BdeeD9F6A8d53168B1B";
const DEFAULT_SEPOLIA_KEY_HASH =
  "0x787d74caea10b2b357790d5b5247c2f63d1d91572a9846f780606e4d953677ae";

const VRF_COORDINATOR = process.env.VRF_COORDINATOR || DEFAULT_SEPOLIA_COORDINATOR;
const VRF_SUBSCRIPTION_ID =
  process.env.VRF_SUBSCRIPTION_ID || process.env.SUBSCRIPTION_ID || "";
const VRF_KEY_HASH = process.env.VRF_KEY_HASH || DEFAULT_SEPOLIA_KEY_HASH;

async function main() {
  if (!VRF_COORDINATOR || !VRF_SUBSCRIPTION_ID || !VRF_KEY_HASH) {
    throw new Error("Missing VRF config: set VRF_COORDINATOR, VRF_SUBSCRIPTION_ID, VRF_KEY_HASH env vars");
  }

  const Consumer = await ethers.getContractFactory("RandomNumberConsumerV2Plus");
  const consumer = await Consumer.deploy(
    VRF_SUBSCRIPTION_ID,
    VRF_COORDINATOR,
    VRF_KEY_HASH,
    ethers.ZeroAddress // set to lottery later
  );
  await consumer.waitForDeployment();
  console.log(`RandomNumberConsumerV2Plus deployed at: ${await consumer.getAddress()}`);

  // 2. Deploy NFT
  const NFT_contract = await ethers.getContractFactory("NFT");
  const nft_deploy = await NFT_contract.deploy("ipfs://bafybeieh3fcl366p55b2fjmii7xdzlv3rly5yn3ofyo57vfsobm57znetm/");
  await nft_deploy.waitForDeployment();
  const nftAddress = await nft_deploy.getAddress();
  console.log(`Contract NFT deployed at: ${nftAddress}`);

  // 3. Deploy Lottery (Truyền tham số: RandomAddress + NFTAddress)
  const Lottery_contract = await ethers.getContractFactory("Lottery");
  const lottery_deploy = await Lottery_contract.deploy(
    await consumer.getAddress(),
    await nft_deploy.getAddress()
  );
  await lottery_deploy.waitForDeployment();
  console.log(`Contract Lottery deployed at: ${await lottery_deploy.getAddress()}`);

  // Wire consumer to lottery for callbacks
  await consumer.setLottery(await lottery_deploy.getAddress());
  
  // 4. Deploy Marketplace
  const Marketplace_contract = await ethers.getContractFactory("NFTMarketplace");
  const marketplace_deploy = await Marketplace_contract.deploy(nftAddress);
  await marketplace_deploy.waitForDeployment();
  console.log(`Contract Marketplace deployed at: ${await marketplace_deploy.getAddress()}`);

  // Save deployed contract addresses to .env.contracts
  const consumerAddress = await consumer.getAddress();
  const lotteryAddress = await lottery_deploy.getAddress();
  const marketplaceAddress = await marketplace_deploy.getAddress();

  const envContracts = `# Deployed Contract Addresses
# Generated automatically by deploy.ts on ${new Date().toISOString()}
# Network: ${process.env.HARDHAT_NETWORK || 'localhost'}

RANDOM_NUMBER_CONSUMER_ADDRESS=${consumerAddress}
NFT_CONTRACT_ADDRESS=${nftAddress}
LOTTERY_CONTRACT_ADDRESS=${lotteryAddress}
MARKETPLACE_CONTRACT_ADDRESS=${marketplaceAddress}

# VRF Configuration used during deployment
DEPLOYED_VRF_COORDINATOR=${VRF_COORDINATOR}
DEPLOYED_VRF_SUBSCRIPTION_ID=${VRF_SUBSCRIPTION_ID}
DEPLOYED_VRF_KEY_HASH=${VRF_KEY_HASH}
`;

  const envContractsPath = path.join(__dirname, "..", ".env.contracts");
  fs.writeFileSync(envContractsPath, envContracts);
  console.log(`\n✅ Contract addresses saved to .env.contracts`);
  
  // Generate frontend config
  console.log(`\n🔄 Updating frontend configuration...`);
  const { execSync } = require('child_process');
  try {
    execSync('node scripts/generate-frontend-config.js', { stdio: 'inherit' });
  } catch (error) {
    console.log(`⚠️  Warning: Could not update frontend config automatically`);
  }
  
  console.log(`\n📝 To verify contracts, run:`);
  console.log(`task verify  OR  npx hardhat verify-all --network sepolia`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });