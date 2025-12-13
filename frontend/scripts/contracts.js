import { showToast } from "./toast.js"
import { CONTRACT_ADDRESSES } from "./contract-addresses.js"

// Contract addresses loaded from .env.contracts
// To update addresses after deployment: npm run update-addresses or task update-addresses
export const CONTRACTS = CONTRACT_ADDRESSES;

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