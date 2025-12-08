// ==================== Wallet Connection ====================
import { connectWallet, initWalletEvents } from "./wallet.js";
import { loadProfilePage } from "./profile.js";
// import { joinLottery, pickWinner, resetLottery } from "./lottery.js";
// import { mintNFT, listNFT, buyNFT } from "./marketplace.js";

document.addEventListener("DOMContentLoaded", async () => {  
  initWalletEvents();

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

  // Auto-load Profile page
  if (location.pathname.endsWith("profile.html")) {
      loadProfilePage();
  }

  // document.getElementById("joinLottery").onclick = joinLottery;
  // document.getElementById("pickWinner").onclick = pickWinner;
  // document.getElementById("resetLottery").onclick = resetLottery;

  // document.getElementById("mintNFT").onclick = () => {
  //   const uri = prompt("NFT URI:");
  //   if (uri) mintNFT(uri);
  // };

  // document.getElementById("listNFT").onclick = () => {
  //   const tokenId = prompt("Token ID:");
  //   const price = prompt("Price in ETH:");
  //   if (tokenId && price) listNFT(tokenId, price);
  // };

  // document.getElementById("buyNFT").onclick = () => {
  //   const id = prompt("Listing ID:");
  //   if (id) buyNFT(id);
  // };

  
});


