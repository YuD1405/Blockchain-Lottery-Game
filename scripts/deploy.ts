import { ethers } from "hardhat";

async function main() {
  const Random_contract = await ethers.getContractFactory("RandomGenerator");
  const random_deploy = await Random_contract.deploy();
  await random_deploy.waitForDeployment();
  console.log(`Contract Random Generator deployed at: ${await random_deploy.getAddress()}`);

  const NFT_contract = await ethers.getContractFactory("NFT");
  const nft_deploy = await NFT_contract.deploy();
  await nft_deploy.waitForDeployment();
  console.log(`Contract NFT deployed at: ${await nft_deploy.getAddress()}`);

  const Lottery_contract = await ethers.getContractFactory("Lottery");
  const lottery_deploy = await Lottery_contract.deploy(random_deploy.getAddress(), nft_deploy.getAddress());
  await lottery_deploy.waitForDeployment();
  console.log(`Contract Lottery deployed at: ${await lottery_deploy.getAddress()}`);

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
