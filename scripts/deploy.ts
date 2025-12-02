import { ethers } from "hardhat";

async function main() {
  const NFT = await ethers.getContractFactory("NFT");
  const nft_deploy = await NFT.deploy();
  await nft_deploy.waitForDeployment();

  console.log(`Contract NFT deployed at: ${await nft_deploy.getAddress()}`);

  const Marketplace = await ethers.getContractFactory("NFTMarketplace");
  const marketplace_deploy = await Marketplace.deploy();
  await marketplace_deploy.waitForDeployment();

  console.log(`Contract Marketplace deployed at: ${await marketplace_deploy.getAddress()}`);

  
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
