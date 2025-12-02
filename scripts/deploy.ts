import { ethers } from "hardhat";

async function main() {
  const Marketplace = await ethers.getContractFactory("NFTMarketplace");
  const marketplace_deploy = await Marketplace.deploy();
  await marketplace_deploy.waitForDeployment();

  console.log(`Contract deployed at: ${await marketplace_deploy.getAddress()}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
