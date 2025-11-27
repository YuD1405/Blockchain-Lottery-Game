const { BrowserProvider, Contract } = window.ethers;
// Update contract info
const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
const ABI = [
    {
        "inputs": [
            {
                "internalType": "string",
                "name": "_message",
                "type": "string"
            }
        ],
        "stateMutability": "nonpayable",
        "type": "constructor"
    },
    {
        "inputs": [],
        "name": "getMessage",
        "outputs": [
            {
                "internalType": "string",
                "name": "",
                "type": "string"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "string",
                "name": "_newMessage",
                "type": "string"
            }
        ],
        "name": "setMessage",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    }
];
let provider;
let signer;
let contract;
console.log(contract);

async function connectWallet() {
    if (typeof window.ethereum === "undefined") {
        alert("MetaMask not found!");
        return;
    }
    provider = new BrowserProvider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    signer = await provider.getSigner();
    contract = new Contract(CONTRACT_ADDRESS, ABI, signer);
    const address = await signer.getAddress();
    document.getElementById("status").innerText = `✅ Connected: ${address}`;
}
async function getMessage() {
    const msg = await contract.getMessage();
    document.getElementById("status").innerText = `📜 Message: ${msg}`;
}
async function setMessage() {
    const newMsg = prompt("Enter new message:");
    if (!newMsg)
        return;
    const tx = await contract.setMessage(newMsg);
    await tx.wait();
    document.getElementById("status").innerText = `✅ Message updated!`;
}
document.getElementById("connect").addEventListener("click", connectWallet);
document.getElementById("getMessage").addEventListener("click", getMessage);
document.getElementById("setMessage").addEventListener("click", setMessage);
