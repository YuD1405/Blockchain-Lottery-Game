import { ethers } from "hardhat";

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

  const NFT_contract = await ethers.getContractFactory("NFT");
  const nft_deploy = await NFT_contract.deploy();
  await nft_deploy.waitForDeployment();
  console.log(`Contract NFT deployed at: ${await nft_deploy.getAddress()}`);

  const Lottery_contract = await ethers.getContractFactory("Lottery");
  const lottery_deploy = await Lottery_contract.deploy(
    await consumer.getAddress(),
    await nft_deploy.getAddress()
  );
  await lottery_deploy.waitForDeployment();
  console.log(`Contract Lottery deployed at: ${await lottery_deploy.getAddress()}`);

  // Wire consumer to lottery for callbacks
  await consumer.setLottery(await lottery_deploy.getAddress());

  const Marketplace_contract = await ethers.getContractFactory("NFTMarketplace");
  const marketplace_deploy = await Marketplace_contract.deploy();
  await marketplace_deploy.waitForDeployment();
  console.log(`Contract Marketplace deployed at: ${await marketplace_deploy.getAddress()}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
