// ==================== Wallet Connection ====================
import { connectWallet, initWalletEvents } from "./wallet.js";
import { loadABIs, initContracts } from "./contracts.js"
// import { joinLottery, pickWinner, resetLottery } from "./lottery.js";
// import { mintNFT, listNFT, buyNFT } from "./marketplace.js";

document.addEventListener("DOMContentLoaded", async () => {  
  initWalletEvents();
//   await loadABIs();      
//   await initContracts();

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
  
});


