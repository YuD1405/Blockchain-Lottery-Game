import { connectWallet, initWalletEvents, getAddress } from "./wallet.js";
import { nftContract, loadABIs, initContracts } from "./contracts.js";
import { resolveIPFS, autoFixIPFS, extractErrorMessage, trimNFTName, isFullNFT, convertToJPG } from "./utils.js";
import { showToast } from "./toast.js";

const REQUIRED_PIECES = 4;
let selectedNFTs = []; // { tokenId, image, name }

function parseNFTName(name) {
  const match = name.match(/World Stamp - (.+?) .*?– Piece #(\d+)/);
  if (!match) return null;

  return {
    country: match[1],
    piece: Number(match[2]),
  };
}

/* =======================
   LOAD PROFILE + NFT
======================= */
async function loadFusionPage() {
  if (!window.ethereum) return;

  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  const address = await signer.getAddress();

  document.getElementById("connectWalletBtn").innerText =
    address.slice(0, 6) + "..." + address.slice(-4);

  await loadMyNFTs(address);
}

/* =======================
   LOAD MY NFTS
======================= */
async function loadMyNFTs(userAddress) {
  const container = document.getElementById("myNftGrid");
  container.innerHTML = "<p>Loading your NFTs...</p>";

  try {
    const balance = Number(await nftContract.balanceOf(userAddress));
    const baseTokenURI = await nftContract.baseTokenURI();

    if (balance === 0) {
      container.innerHTML = "<p>You don't have any NFT pieces.</p>";
      return;
    }

    const nfts = [];

    for (let i = 0; i < balance; i++) {
      const tokenId = Number(
        await nftContract.tokenOfOwnerByIndex(userAddress, i)
      );

      let image = "https://via.placeholder.com/300x200?text=NFT";
      let name = `NFT #${tokenId}`;
      let belong = "";

      try {
        let tokenUri = await nftContract.tokenURI(tokenId);
        tokenUri = autoFixIPFS(tokenUri, baseTokenURI);
        const res = await fetch(resolveIPFS(tokenUri));
        const metadata = await res.json();

        name = metadata.name || name;
        image = metadata.image ? resolveIPFS(metadata.image) : image;
        belong = metadata.belongs_to;
      } catch (_) {}

      const parsed = parseNFTName(name);
      const isRare = isFullNFT(name);
      if (isRare) continue;

      nfts.push({
        tokenId,
        name,
        displayName: trimNFTName(name),
        image,
        country: parsed?.country || "",
        piece: parsed?.piece || 0,
        belong: belong,
      });
    }

    nfts.sort((a, b) => {
      if (a.country !== b.country) {
        return a.country.localeCompare(b.country);
      }
      return a.piece - b.piece;
    });

    let html = "";

    for (const nft of nfts) {
      html += `
        <div 
          class="card nft-card"
          data-token-id="${nft.tokenId}"
          data-name="${nft.displayName}"
          data-image="${nft.image}"
          data-belong="${nft.belong}"
        >
          <img src="${nft.image}" />
          <h4>${nft.displayName}</h4>
          <p>#${nft.tokenId}</p>
        </div>
      `;
    }

    container.innerHTML = html;
    bindNFTClickEvents();
    
  } catch (err) {
    console.error(err);
    container.innerHTML = "<p>Error loading NFTs</p>";
  }
}

/* =======================
   NFT SELECT / UNSELECT
======================= */
function bindNFTClickEvents() {
  document.querySelectorAll(".nft-card").forEach((card) => {
    card.addEventListener("click", () => toggleSelectNFT(card));
  });
}

function toggleSelectNFT(card) {
  const tokenId = Number(card.dataset.tokenId);

  const index = selectedNFTs.findIndex((n) => n.tokenId === tokenId);

  if (index >= 0) {
    // unselect
    selectedNFTs.splice(index, 1);
    card.classList.remove("selected");
  } else {
    if (selectedNFTs.length >= REQUIRED_PIECES) {
      showToast(`❌ Only ${REQUIRED_PIECES} NFTs allowed`, "error");
      return;
    }
    selectedNFTs.push({
      tokenId,
      name: card.dataset.name,
      image: card.dataset.image,
      belong: card.dataset.belong,
    });
    card.classList.add("selected");
  }

  renderFusionSlots();
}

/* =======================
   RENDER FUSION BOX
======================= */
function renderFusionSlots() {
  const slots = document.getElementById("fusionSlots");
  const mergeBtn = document.getElementById("mergeBtn");

  slots.innerHTML = "";

  for (let i = 0; i < REQUIRED_PIECES; i++) {
    const nft = selectedNFTs[i];

    if (nft) {
      slots.innerHTML += `
        <div class="fusion-slot filled">
          <img src="${nft.image}" style="width:100%;border-radius:8px"/>
        </div>
      `;
    } else {
      slots.innerHTML += `<div class="fusion-slot">Empty</div>`;
    }
  }

const isDisabled = selectedNFTs.length !== REQUIRED_PIECES;
mergeBtn.disabled = isDisabled;
mergeBtn.classList.toggle("disabled", isDisabled);
}

/* =======================
   FUSE ACTION
======================= */
async function fuseNFTs() {
  try {
    if (selectedNFTs.length !== REQUIRED_PIECES) {
      showToast("Not enough pieces", "info");
      return;
    }
    
    const baseBelong = selectedNFTs[0].belong;
    
    for (let i = 1; i < selectedNFTs.length; i++) {
      if(selectedNFTs[i].belong != baseBelong) {
        showToast("Not the same origin to fuse", "info");
        return;
      }
      continue;
    }
    const tokenIds = selectedNFTs.map((n) => n.tokenId);

    showToast("🔥 Fusing NFTs...", "info");

    const tx = await nftContract.mergeNFT(tokenIds, baseBelong);
    await tx.wait();

    showToast("✨ Fusion successful!", "success");

    selectedNFTs = [];
    await loadFusionPage();
  } catch (e) {
    showToast(extractErrorMessage(e), "error");
  }
}

/* =======================
   INIT
======================= */
document.addEventListener("DOMContentLoaded", async () => {
  initWalletEvents();
  await loadABIs();
  await initContracts();

  const connectBtn = document.getElementById("connectWalletBtn");
  if (connectBtn) connectBtn.onclick = connectWallet;

  document.getElementById("mergeBtn").onclick = fuseNFTs;

  if (window.ethereum) {
    const accounts = await window.ethereum.request({
      method: "eth_accounts",
    });
    if (accounts.length > 0) {
      await loadFusionPage();
    }
  }
});
