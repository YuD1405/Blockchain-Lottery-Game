import { marketplaceContract } from "./contracts.js";
import { updateStatus } from "./toast.js";
const { BrowserProvider, Contract, parseEther } = ethers;

export async function mintNFT(uri) {
  try {
    const tx = await marketplaceContract.mintNFT(uri);
    await tx.wait();
    updateStatus("🎨 NFT minted!", "success");
  } catch (e) {
    updateStatus(`❌ ${e.message}`, "error");
  }
}

export async function listNFT(tokenId, priceEth) {
  try {
    const tx = await marketplaceContract.listNFT(tokenId, parseEther(priceEth));
    await tx.wait();
    updateStatus("📦 NFT listed!", "success");
  } catch (e) {
    updateStatus(`❌ ${e.message}`, "error");
  }
}

export async function buyNFT(listingId) {
  try {
    const listing = await marketplaceContract.getListing(listingId);
    const tx = await marketplaceContract.buyNFT(listingId, { value: listing.price });
    await tx.wait();
    updateStatus("🛒 NFT bought!", "success");
  } catch (e) {
    updateStatus(`❌ ${e.message}`, "error");
  }
}
