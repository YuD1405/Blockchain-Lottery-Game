// hardhat.config.ts

import { HardhatUserConfig, task } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import { formatEther } from "ethers";

task("accounts", "Prints the list of accounts with balance", async (_, hre) => {
  const accounts = await hre.ethers.getSigners();
  for (let i = 0; i < accounts.length; i++) {
    const address = await accounts[i].getAddress();
    const balance = await hre.ethers.provider.getBalance(address);
    console.log(`Account[${i}] : ${address} - ${formatEther(balance)} ETH`);
  }
});

const config: HardhatUserConfig = {
  defaultNetwork: "hardhat",
  solidity: "0.8.28",
  networks: {
    hardhat: {
      chainId: 31337,
    },
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337,
    },
  },
};

export default config;
