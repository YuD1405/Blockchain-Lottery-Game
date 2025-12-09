import { showToast } from "./toast.js"

// Contract addresses from deployment
export const CONTRACTS = {
  RANDOM_GENERATOR: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
  NFT: "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",
  LOTTERY: "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0",
  MARKETPLACE: "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9",
};

// Contracts ABI
export let lotteryAbi;
export let nftAbi;
export let randomAbi;
export let marketplaceAbi;

async function loadABI(path) {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`Cannot load ABI: ${path}`);
  const json = await res.json();
  return json.abi;
}

export async function loadABIs() {
  try {
    lotteryAbi     = await loadABI("../abi/Lottery.sol/Lottery.json");
    nftAbi         = await loadABI("../abi/NFT.sol/NFT.json");
    randomAbi      = await loadABI("../abi/RandomGenerator.sol/RandomGenerator.json");
    marketplaceAbi = await loadABI("../abi/Marketplace.sol/NFTMarketplace.json");

    console.log("ABI loaded successfully!");
    // showToast("ABI loaded successfully!")
  } catch (err) {
    console.error("Failed to load ABIs:", err);
    const message = "Failed to load ABIs: " + err;
    showToast(message, "error")
  }
}

// Init contracts
export let lotteryContract;
export let nftContract;
export let randomContract;
export let marketplaceContract;

export async function initContracts() {
  if (!window.ethereum) {
    alert("MetaMask not detected!");
    showToast("MetaMask not detected!", "info");
    return;
  }

  try {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();

    // Lottery Contract
    lotteryContract = new ethers.Contract(
      CONTRACTS.LOTTERY,
      lotteryAbi,
      signer
    );

    // NFT Contract
    nftContract = new ethers.Contract(
      CONTRACTS.NFT,
      nftAbi,
      signer
    );

    // Random Generator Contract
    randomContract = new ethers.Contract(
      CONTRACTS.RANDOM_GENERATOR,
      randomAbi,
      signer
    );

    // Marketplace
    marketplaceContract = new ethers.Contract(
      CONTRACTS.MARKETPLACE,
      marketplaceAbi,
      signer
    );

    console.log("Contracts Initialized:");
    console.log({
      lotteryContract,
      nftContract,
      randomContract,
      marketplaceContract
    });

  } catch (err) {
    console.error("Failed to init contracts:", err);
  }
}