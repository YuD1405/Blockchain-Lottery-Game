import { connectWallet, initWalletEvents, getAddress } from "./wallet.js";
import { marketplaceContract, nftContract, loadABIs, initContracts, CONTRACTS } from "./contracts.js";
import { resolveIPFS, autoFixIPFS, extractErrorMessage  } from "./utils.js";
import { showToast } from "./toast.js";

async function ensureApproved(tokenId) {
  const account = await getAddress();
  const approved =
    (await nftContract.getApproved(tokenId)) === CONTRACTS.MARKETPLACE ||
    (await nftContract.isApprovedForAll(account, CONTRACTS.MARKETPLACE));

  if (!approved) {
    const tx = await nftContract.setApprovalForAll(
      CONTRACTS.MARKETPLACE,
      true
    );
    await tx.wait();
  }
}


async function loadProfilePage() {
    if (!window.ethereum) return;
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const address = await signer.getAddress();
    document.getElementById("user-address").innerText = address;
    document.getElementById("connectWalletBtn").innerText =
        address.slice(0, 6) + "..." + address.slice(-4);

    const balanceWei = await provider.getBalance(address);
    const balanceEth = Number(ethers.formatEther(balanceWei)).toFixed(4);
    document.getElementById("user-balance").innerText = balanceEth + " ETH";

    await loadMyNFTs(address);
}

async function loadMyNFTs(userAddress) {
    const container = document.querySelector(".grid-3");
    if (!container) return; 

    const container_1 = document.querySelector(".grid-2");
    if (!container_1) return; 
    
    
    container.innerHTML = "<p>Loading your NFTs...</p>";

    try {
        const balanceBig = await nftContract.balanceOf(userAddress);
        const balance = Number(balanceBig);

        const baseTokenURI = await nftContract.baseTokenURI();
        let htmlContent = "";

        // B. Duyệt ngược từ round hiện tại về 0
        for (let i = 0; i < balance; i++) {
            const tokenIdBig = await nftContract.tokenOfOwnerByIndex(userAddress, i);
            const tokenId = Number(tokenIdBig);

            let imageSrc = "https://via.placeholder.com/300x200?text=No+Image";
            let nftName = "";

            try {
                let tokenUri = await nftContract.tokenURI(tokenId);
        
                tokenUri = autoFixIPFS(tokenUri, baseTokenURI);
        
                const resolvedUri = resolveIPFS(tokenUri);
                const response = await fetch(resolvedUri);

                const contentType = response.headers.get("content-type");
                if (contentType && contentType.includes("application/json")) {
                    const metadata = await response.json();

                    nftName = metadata.name || "Unknown";
                    imageSrc = metadata.image ? resolveIPFS(metadata.image) : "";
                }
            } catch (err) {
                console.warn(`Lỗi load metadata round ${i}`);
            }
            
            const listed = await marketplaceContract.isNFTListed(tokenId);

            const isRare = 1;
            const cardClass = isRare ? "nft-card rare" : "nft-card common";
            htmlContent += `
              <div class="${cardClass}">
                <div class="nft-image-wrapper">
                  <img 
                    src="${imageSrc}" 
                    alt="NFT"
                    onerror="this.src='https://via.placeholder.com/400x400?text=NFT+Error'"
                  />
                </div>

                <div class="nft-body">
                  <div class="nft-info">
                    <h4 class="nft-name">${nftName}</h4>
                    <span class="nft-token">#${tokenId}</span>
                  </div>

                  <div class="nft-actions">
                    <input
                      type="number"
                      min="0"
                      step="0.0001"
                      placeholder="ETH"
                      id="price-${tokenId}"
                      ${listed ? "disabled" : ""}
                    />
                    <button
                      class="btn-sell"
                      onclick="handleSell(${tokenId})"
                      ${listed ? "disabled" : ""}
                    >
                      ${listed ? "Listed" : "Sell"}
                    </button>
                  </div>
                </div>
              </div>
            `;

        }

        if (balance == 0) {
            container.innerHTML = "";
            container_1.innerHTML = "<p>You don't have any NFT rewards yet.</p>";
        } else {
            container_1.innerHTML = "";
            container.innerHTML = htmlContent;
        }


    } catch (error) {
        console.error("Load NFT Error:", error);
        container.innerHTML = `<p style="color:red">Error loading NFTs: ${error.message}</p>`;
    }
}

window.handleSell = async function (tokenId) {
  try {
    const input = document.getElementById(`price-${tokenId}`);
    const priceEth = input.value;

    if (!priceEth || Number(priceEth) <= 0) {
      showToast("❌ Invalid price", "error");
      return;
    }

    showToast("⏳ Listing NFT...", "info");

    await ensureApproved(tokenId);
    const tx = await marketplaceContract.listNFT(
      tokenId,
      ethers.parseEther(priceEth)
    );

    await tx.wait();

    showToast("📦 NFT listed successfully!", "success");

    // reload profile NFTs (optional)
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const address = await signer.getAddress();
    await loadMyNFTs(address);

  } catch (e) {
    showToast(extractErrorMessage(e), "error");
  }
};

document.addEventListener("DOMContentLoaded", async () => {  
  initWalletEvents();
  await loadABIs();      
  await initContracts();

  // Connect button
  const connectBtn = document.getElementById("connectWalletBtn");
  if (connectBtn) {
      connectBtn.onclick = connectWallet;
  }

  if (window.ethereum) {
      const accounts = await window.ethereum.request({ method: "eth_accounts" });

      if (accounts.length > 0) {
          const { updateWalletUI } = await import("./wallet.js");
          updateWalletUI(accounts[0]);
      }
  }
  await loadProfilePage();
});