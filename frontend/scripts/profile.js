import { connectWallet, initWalletEvents } from "./wallet.js";
import { lotteryContract, nftContract, loadABIs, initContracts } from "./contracts.js";
import { resolveIPFS } from "./utils.js";

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
    
    container.innerHTML = "<p>Loading your NFTs...</p>";

    try {
        const balanceBig = await nftContract.balanceOf(userAddress);
        const balance = Number(balanceBig);

        let htmlContent = "";

        // B. Duyệt ngược từ round hiện tại về 0
        for (let i = 0; i < balance; i++) {
            const tokenIdBig = await nftContract.tokenOfOwnerByIndex(userAddress, i);
            const tokenId = Number(tokenIdBig);

            let imageSrc = "https://via.placeholder.com/300x200?text=No+Image";
            let nftName = "";

            try {
                let tokenURI = await nftContract.tokenURI(tokenId);
                tokenURI = resolveIPFS(tokenURI);

                console.log(tokenURI)
                const response = await fetch(tokenURI);
                const contentType = response.headers.get("content-type");
                if (contentType && contentType.includes("application/json")) {
                    const metadata = await response.json();

                    nftName = metadata.name || "Unknown";
                    imageSrc = metadata.image ? resolveIPFS(metadata.image) : "";
                }
            } catch (err) {
                console.warn(`Lỗi load metadata round ${i}`);
            }

            // 4. Tạo thẻ HTML cho NFT này
            htmlContent += `
                <div class="card nft-card">
                    <img src="${imageSrc}" alt="NFT" style="width: 100%; height: 200px; object-fit: cover; border-radius: 8px;" 
                            onerror="this.src='https://via.placeholder.com/300x200?text=Error'">
                    <div class="nft-info">
                        <h4>${nftName}</h4>
                    </div>
                    <div style="display: flex; gap: 10px; margin-top: 10px;">
                        <button class="btn btn-secondary" style="width: 100%;">Sell (Coming Soon)</button>
                    </div>
                </div>
            `;
        }

        if (balance == 0) {
            container.innerHTML = "<p>You don't have any NFT rewards yet.</p>";
        } else {
            container.innerHTML = htmlContent;
        }

    } catch (error) {
        console.error("Load NFT Error:", error);
        container.innerHTML = `<p style="color:red">Error loading NFTs: ${error.message}</p>`;
    }
}

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