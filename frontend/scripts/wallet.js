const { BrowserProvider, Contract, parseEther } = ethers;
import { loadProfilePage } from "./profile.js"
// import { initContracts } from "./contracts.js";
import { showToast } from "./toast.js";

export let provider;
export let signer;
export let userAddress;
export let currentAddress;

export async function connectWallet() {
  if (!window.ethereum) {
    alert("Install MetaMask!");
    return;
  }

  try {
    provider = new BrowserProvider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    signer = await provider.getSigner();
    userAddress = await signer.getAddress();

    console.log("Successfully connected to Metamask");
    updateWalletUI(userAddress);
    const message = "Connected to " + userAddress.slice(0, 6) + "..." + userAddress.slice(-4);
    showToast(message, "success");
    // await initContracts(signer);
  } catch (e) {
    showToast(e.message, "error");
  }
}

export function updateWalletUI(address) {
    const btn = document.getElementById("connectWalletBtn");
    if (!btn) return;

    btn.innerText = address
        ? address.slice(0, 6) + "..." + address.slice(-4)
        : "Connect";
}

export async function getAddress() {
    if (!signer) await connectWallet();
    return signer.getAddress();
}

export async function getBalance(address = currentAddress) {
    if (!provider) provider = new BrowserProvider(window.ethereum);
    const balanceWei = await provider.getBalance(address);
    return ethers.formatEther(balanceWei);
}


export function initWalletEvents() {
    if (!window.ethereum) return;

    window.ethereum.on("accountsChanged", async (accounts) => {
        console.log("Account changed:", accounts[0]);

        if (accounts.length === 0) {
            // User disconnected
            currentAddress = null;
            updateWalletUI(null);
            showToast("User disconnected", "info");
            return;
        }

        currentAddress = accounts[0];
        signer = await provider.getSigner();
        updateWalletUI(currentAddress);
        const message = "Account changed: " + currentAddress.slice(0, 6) + "..." + currentAddress.slice(-4)
        showToast(message, "info");

        // Nếu đang ở trang Profile thì reload thông tin
        if (location.pathname.endsWith("profile.html")) {
            const { loadProfilePage } = await import("./profile.js");
            loadProfilePage();
        }
    });

    window.ethereum.on("chainChanged", () => {
        console.log("Chain changed → reload");
        location.reload();
    });
}