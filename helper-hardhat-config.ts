export const networkConfig: Record<number, { name: string; keyHash: string; fundAmount: string }> = {
    31337: {
        name: "localhost",
        keyHash: "0x474e34a077df58807dbe9c96d3c009b23b3c6d0cce433e59bbf5b34f823bc56c",
        fundAmount: "1000000000000000000", // 1 ETH
    },
    11155111: {
        name: "sepolia",
        keyHash: "0x474e34a077df58807dbe9c96d3c009b23b3c6d0cce433e59bbf5b34f823bc56c",
        fundAmount: "1000000000000000000",
    },
}

export const developmentChains = ["hardhat", "localhost"]
