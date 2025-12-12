import { showToast } from "./toast.js"

// Contract addresses from Sepolia deployment
export const CONTRACTS = {
  RANDOM_GENERATOR: "0x86bD52A611C9ec275e0F03B05F4d913A3d1b78E1",
  NFT: "0x5A75Fb7F347C9e6ccf3AbD03827dab6273910d0B",
  LOTTERY: "0xe38B6F317476E6015c838D13595df02D83A310F7",
  MARKETPLACE: "0xAd17369891B09c83954c044F8D7BaC7f58f0E5eF",
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