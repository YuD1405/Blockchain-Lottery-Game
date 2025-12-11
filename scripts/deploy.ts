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
  const nft_deploy = await NFT_contract.deploy();
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
  const marketplace_deploy = await Marketplace_contract.deploy();
  await marketplace_deploy.waitForDeployment();
  console.log(`Contract Marketplace deployed at: ${await marketplace_deploy.getAddress()}`);

  // ====================================================
  // 5. BƯỚC QUAN TRỌNG: CẤP QUYỀN CHO LOTTERY CONTRACT
  // ====================================================
  console.log("------------------------------------------------");
  console.log("Executing: Set Lottery address in NFT contract...");
  
  // Gọi hàm setLotteryContract của NFT
  const tx = await nft_deploy.setLotteryContract(lotteryAddress);
  await tx.wait(); // Chờ transaction được xác nhận
  
  console.log("✅ Permission GRANTED: Lottery contract can now mint NFTs.");
  console.log("------------------------------------------------");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });