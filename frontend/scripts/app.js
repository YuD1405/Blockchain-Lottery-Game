const { BrowserProvider, Contract, parseEther } = ethers;
import {
  CONTRACTS,
  RANDOM_GENERATOR_ABI,
  NFT_ABI,
  LOTTERY_ABI,
  MARKETPLACE_ABI,
} from "./contracts.js";

let provider;
let signer;
let userAddress;

// Contract instances
let randomGeneratorContract;
let nftContract;
let lotteryContract;
let marketplaceContract;

// ==================== Wallet Connection ====================
async function connectWallet() {
  console.log("Attempting to connect wallet...");
  if (typeof window.ethereum === "undefined") {
    alert("❌ MetaMask not found! Please install MetaMask.");
    console.error("MetaMask not found.");
    return;
  }

  try {
    provider = new BrowserProvider(window.ethereum);
    console.log("Provider initialized.");
    await provider.send("eth_requestAccounts", []);
    console.log("Accounts requested.");
    signer = await provider.getSigner();
    console.log("Signer obtained.");
    userAddress = await signer.getAddress();
    console.log(`Connected wallet address: ${userAddress}`);

    // Initialize contract instances
    randomGeneratorContract = new Contract(
      CONTRACTS.RANDOM_GENERATOR,
      RANDOM_GENERATOR_ABI,
      signer
    );
    console.log("Random Generator Contract initialized.");

    nftContract = new Contract(CONTRACTS.NFT, NFT_ABI, signer);
    console.log("NFT Contract initialized.");

    lotteryContract = new Contract(CONTRACTS.LOTTERY, LOTTERY_ABI, signer);
    console.log("Lottery Contract initialized.");

    marketplaceContract = new Contract(
      CONTRACTS.MARKETPLACE,
      MARKETPLACE_ABI,
      signer
    );
    console.log("Marketplace Contract initialized.");

    const balance = await provider.getBalance(userAddress);
    console.log(`Wallet balance: ${parseEther(balance.toString())} ETH`);

    // Update status display
    const statusDiv = document.getElementById("status");
    statusDiv.style.display = "block";
    statusDiv.innerHTML = `✅ Connected: ${userAddress}<br>Balance: ${parseEther(
      balance.toString()
    )} ETH`;
  } catch (error) {
    console.error("Error connecting wallet:", error);
    alert("❌ Failed to connect wallet. Please try again.");
  }
}

// ==================== Lottery Functions ====================
async function joinLottery() {
  if (!lotteryContract) {
    updateStatus("❌ Connect wallet first", "error");
    return;
  }

  try {
    const ticketPrice = await lotteryContract.getTicketPrice();
    console.log("Ticket price:", ticketPrice.toString());

    updateStatus("⏳ Joining lottery...", "info");
    const tx = await lotteryContract.joinGame({ value: ticketPrice });
    await tx.wait();

    updateStatus("✅ Successfully joined lottery!", "success");
    await updateLotteryInfo();
  } catch (error) {
    updateStatus(`❌ Error: ${error.message}`, "error");
    console.error("Join lottery error:", error);
  }
}

async function pickWinner() {
  if (!lotteryContract) {
    updateStatus("❌ Connect wallet first", "error");
    return;
  }

  try {
    updateStatus("⏳ Picking winner...", "info");
    const tx = await lotteryContract.pickWinner();
    await tx.wait();

    updateStatus("✅ Winner picked! Check events.", "success");
    await updateLotteryInfo();
  } catch (error) {
    updateStatus(`❌ Error: ${error.message}`, "error");
    console.error("Pick winner error:", error);
  }
}

async function resetLottery() {
  if (!lotteryContract) {
    updateStatus("❌ Connect wallet first", "error");
    return;
  }

  try {
    updateStatus("⏳ Resetting lottery...", "info");
    const tx = await lotteryContract.resetGame();
    await tx.wait();

    updateStatus("✅ Lottery reset!", "success");
    await updateLotteryInfo();
  } catch (error) {
    updateStatus(`❌ Error: ${error.message}`, "error");
    console.error("Reset error:", error);
  }
}

async function updateLotteryInfo() {
  if (!lotteryContract) return;

  try {
    const ticketPrice = await lotteryContract.getTicketPrice();
    const ticketCount = await lotteryContract.getTicketCount();
    const maxTicket = await lotteryContract.getMaxTicket();
    const manager = await lotteryContract.getManager();

    const infoText = `
📊 Lottery Info:
- Ticket Price: ${window.ethers.formatEther(ticketPrice)} ETH
- Players: ${ticketCount}/${maxTicket}
- Manager: ${manager.slice(0, 6)}...${manager.slice(-4)}
    `;

    document.getElementById("lotteryInfo").innerText = infoText;
  } catch (error) {
    console.error("Error updating lottery info:", error);
  }
}

// ==================== Marketplace Functions ====================
async function mintMarketplaceNFT() {
  if (!marketplaceContract) {
    updateStatus("❌ Connect wallet first", "error");
    return;
  }

  const uri = prompt("Enter NFT URI (e.g., ipfs://QmXxxx):");
  if (!uri) return;

  try {
    updateStatus("⏳ Minting NFT...", "info");
    const tx = await marketplaceContract.mintNFT(userAddress, uri);
    await tx.wait();

    updateStatus("✅ NFT minted successfully!", "success");
  } catch (error) {
    updateStatus(`❌ Error: ${error.message}`, "error");
    console.error("Mint error:", error);
  }
}

async function listNFT() {
  if (!marketplaceContract) {
    updateStatus("❌ Connect wallet first", "error");
    return;
  }

  const tokenId = prompt("Enter Token ID:");
  if (!tokenId) return;

  const priceEth = prompt("Enter price in ETH:");
  if (!priceEth) return;

  try {
    const price = parseEther(priceEth);
    updateStatus("⏳ Listing NFT...", "info");
    const tx = await marketplaceContract.listNFT(tokenId, price);
    await tx.wait();

    updateStatus("✅ NFT listed successfully!", "success");
  } catch (error) {
    updateStatus(`❌ Error: ${error.message}`, "error");
    console.error("List error:", error);
  }
}

async function buyNFT() {
  if (!marketplaceContract) {
    updateStatus("❌ Connect wallet first", "error");
    return;
  }

  const listingId = prompt("Enter Listing ID:");
  if (!listingId) return;

  try {
    const listing = await marketplaceContract.getListing(listingId);
    updateStatus("⏳ Buying NFT...", "info");
    const tx = await marketplaceContract.buyNFT(listingId, {
      value: listing.price,
    });
    await tx.wait();

    updateStatus("✅ NFT purchased successfully!", "success");
  } catch (error) {
    updateStatus(`❌ Error: ${error.message}`, "error");
    console.error("Buy error:", error);
  }
}

async function viewListing() {
  if (!marketplaceContract) {
    updateStatus("❌ Connect wallet first", "error");
    return;
  }

  const listingId = prompt("Enter Listing ID:");
  if (!listingId) return;

  try {
    const listing = await marketplaceContract.getListing(listingId);
    const listingText = `
📋 Listing ${listing.listingId}:
- Token ID: ${listing.tokenId}
- Seller: ${listing.seller.slice(0, 6)}...${listing.seller.slice(-4)}
- Price: ${window.ethers.formatEther(listing.price)} ETH
- Status: ${["Active", "Sold", "Cancelled"][listing.status]}
- Created: ${new Date(Number(listing.createdAt) * 1000).toLocaleString()}
    `;
    updateStatus(listingText, "info");
  } catch (error) {
    updateStatus(`❌ Error: ${error.message}`, "error");
    console.error("View listing error:", error);
  }
}

// ==================== UI Helpers ====================
function updateStatus(message, type = "info") {
  const statusEl = document.getElementById("status");
  statusEl.innerText = message;
  statusEl.className = `status-${type}`;
  console.log(`[${type.toUpperCase()}]`, message);
}

// ==================== Event Listeners ====================
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("connectWalletBtn").addEventListener("click", connectWallet);

  // Lottery events
  document.getElementById("joinLottery").addEventListener("click", joinLottery);
  document.getElementById("pickWinner").addEventListener("click", pickWinner);
  document
    .getElementById("resetLottery")
    .addEventListener("click", resetLottery);

  // Marketplace events
  document
    .getElementById("mintNFT")
    .addEventListener("click", mintMarketplaceNFT);
  document.getElementById("listNFT").addEventListener("click", listNFT);
  document.getElementById("buyNFT").addEventListener("click", buyNFT);
  document.getElementById("viewListing").addEventListener("click", viewListing);

  // Initially hide sections
  document.getElementById("lotterySection").style.display = "none";
  document.getElementById("marketplaceSection").style.display = "none";

  updateStatus("👋 Click 'Connect Wallet' to get started", "info");
});

// Make functions available globally for HTML buttons
window.connectWallet = connectWallet;
window.joinLottery = joinLottery;
window.pickWinner = pickWinner;
window.resetLottery = resetLottery;
window.mintMarketplaceNFT = mintMarketplaceNFT;
window.listNFT = listNFT;
window.buyNFT = buyNFT;
window.viewListing = viewListing;
