import { ethers } from "hardhat";

async function main() {
  const HelloWorld = await ethers.getContractFactory("HelloWorld");
  const hello = await HelloWorld.deploy("Hello Blockchain!");
  await hello.waitForDeployment();

  console.log(`Contract deployed at: ${await hello.getAddress()}`);
  console.log(`Current message: ${await hello.getMessage()}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
