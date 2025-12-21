import { marketplaceContract, nftContract, loadABIs, initContracts } from "./contracts.js";
import { showToast } from "./toast.js";
import { autoFixIPFS, resolveIPFS, trimNFTName } from "./utils.js";
import { initWalletEvents } from "./wallet.js";

const grid = document.querySelector(".grid-3");

export async function buyNFT(listingId) {
  try {
    const listing = await marketplaceContract.getListing(listingId);

    showToast("⏳ Buying NFT...", "info");

    const tx = await marketplaceContract.buyNFT(listingId, {
      value: listing.price
    });

    await tx.wait();

    showToast("🛒 NFT bought successfully!", "success");
    loadMarketplace(); // refresh UI

  } catch (e) {
    showToast(`❌ ${e.reason || e.message}`, "error");
  }
}

function renderNFTCard({ listingId, name, image, priceEth, seller }) {
  const shortSeller = seller.slice(0, 6) + "..." + seller.slice(-4);

  const card = document.createElement("div");
  const isRare = isFullNFT(nftName);
  image = resolveIPFS(image)
  let imageSrc = isRare? convertToJPG(image): image;
  const cardClass = isRare ? "nft-card rare" : "nft-card common";

  card.innerHTML = `
    <div class="${cardClass}">
      <div class="nft-image-wrapper">
        <img 
          src="${imageSrc}" 
          alt="${name}"
          onerror="this.src='https://via.placeholder.com/400x400?text=NFT+Error'"
        />
      </div>

      <div class="nft-body">
        <div class="nft-info">
          <h4 class="nft-name">${trimNFTName(name)}</h4>
          <span class="nft-price">${priceEth} ETH</span>
        </div>

        <div class="nft-meta">
          <span class="nft-seller">
            Seller: ${shortSeller}
          </span>
        </div>

        <div class="nft-actions">
          <button 
            class="btn btn-buy"
            onclick="handleBuy(${listingId})"
          >
            Buy Now
          </button>
        </div>
      </div>
    </div>
  `;

  card.querySelector("button").onclick = () => buyNFT(listingId);

  grid.appendChild(card);
}

async function loadMarketplace() {
  try {
    grid.innerHTML = "";

    // NFT base URI lấy từ NFT contract
    const baseTokenURI = await nftContract.baseTokenURI();

    // listingId bắt đầu từ 1
    const MAX_SCAN = 100; 

    for (let listingId = 1; listingId <= MAX_SCAN; listingId++) {
      const listing = await marketplaceContract.getListing(listingId);
      console.log(listing.seller);
      console.log(listing.status);
      // listing chưa tồn tại
      if (listing.seller === ethers.ZeroAddress) continue;

      // 0 = Active
      if (Number(listing.status) !== 0) continue;

      const tokenId = listing.tokenId;
      const seller = listing.seller;
      const priceEth = ethers.formatEther(listing.price);

      // ---- NFT metadata ----
      const rawURI = await nftContract.tokenURI(tokenId);
      const fixedURI = autoFixIPFS(rawURI, baseTokenURI);
      const resolvedUri = resolveIPFS(fixedURI);
      const metadata = await fetch(resolvedUri).then(r => r.json());

      renderNFTCard({
        listingId,
        tokenId,
        name: metadata.name,
        image: metadata.image,
        priceEth,
        seller
      });
    }

  } catch (e) {
    console.error(e);
    showToast("❌ Failed to load marketplace", "error");
  }
}

// Đặt handleBuy ra global scope để onclick trong HTML có thể gọi
window.handleBuy = async function(listingId) {
  try {
    // Hiển thị toast thông báo bắt đầu
    showToast(`⏳ Processing purchase for NFT #${listingId}...`, "info");

    // Gọi buyNFT thực tế
    await buyNFT(listingId);

    // Sau khi mua xong, có thể reload marketplace
    // loadMarketplace(); // đã gọi bên trong buyNFT, nên không cần nữa

  } catch (e) {
    console.error(e);
    showToast(`❌ Error buying NFT: ${e.reason || e.message}`, "error");
  }
};


document.addEventListener("DOMContentLoaded", async () => {  
  const msg = sessionStorage.getItem("toastAfterReload");
    if (msg) {
        showToast(msg, "info");
        sessionStorage.removeItem("toastAfterReload");
    }

  // Connect and change wallet event
  initWalletEvents();
  await loadABIs();      
  await initContracts();
  await loadMarketplace();
});
