import { getBalance } from "./wallet.js";

export async function loadProfilePage() {
    if (!window.ethereum) return;

    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const address = await signer.getAddress();

    document.getElementById("user-address").innerText = address;
    document.getElementById("connectWalletBtn").innerText =
        address.slice(0, 6) + "..." + address.slice(-4);

    const balance = await getBalance(address);
    document.getElementById("user-balance").innerText = balance + " ETH";
}
