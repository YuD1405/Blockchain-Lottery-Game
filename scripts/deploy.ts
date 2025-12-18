import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  // 1. Deploy Random Generator
  const Random_contract = await ethers.getContractFactory("RandomGenerator");
  const random_deploy = await Random_contract.deploy();
  await random_deploy.waitForDeployment();
  const randomAddress = await random_deploy.getAddress();
  console.log(`Contract Random Generator deployed at: ${randomAddress}`);

  // 2. Deploy NFT
  const NFT_contract = await ethers.getContractFactory("NFT");
  const nft_deploy = await NFT_contract.deploy("ipfs://bafybeieh3fcl366p55b2fjmii7xdzlv3rly5yn3ofyo57vfsobm57znetm/");
  await nft_deploy.waitForDeployment();
  const nftAddress = await nft_deploy.getAddress();
  console.log(`Contract NFT deployed at: ${nftAddress}`);

  // 3. Deploy Lottery (Truyền tham số: RandomAddress + NFTAddress)
  const Lottery_contract = await ethers.getContractFactory("Lottery");
  const lottery_deploy = await Lottery_contract.deploy(randomAddress, nftAddress);
  await lottery_deploy.waitForDeployment();
  const lotteryAddress = await lottery_deploy.getAddress();
  console.log(`Contract Lottery deployed at: ${lotteryAddress}`);

  // 4. Deploy Marketplace
  const Marketplace_contract = await ethers.getContractFactory("NFTMarketplace");
  const marketplace_deploy = await Marketplace_contract.deploy(nftAddress);
  await marketplace_deploy.waitForDeployment();
  console.log(`Contract Marketplace deployed at: ${await marketplace_deploy.getAddress()}`);

}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });