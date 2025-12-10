import { lotteryContract, loadABIs, initContracts } from "./contracts.js";
import { showToast } from "./toast.js";
import { provider, getAddress, initWalletEvents, connectWallet } from "./wallet.js";


const lottery_ui = {
  connectBtn: document.getElementById("connectWalletBtn"),
  totalPool: document.getElementById("totalPool"),
  ticketCount: document.getElementById("ticketCount"),
  entryFee: document.getElementById("entryFee"),
  myBalance: document.getElementById("myBalance"),
  playerList: document.getElementById("playerList"),
  joinBtn: document.getElementById("joinBtn"),
  pickWinnerBtn: document.getElementById("pickWinnerBtn"),
  resetBtn: document.getElementById("resetBtn"),
  userJoinStatus: document.getElementById("userJoinStatus"),
  winnerHistory: document.getElementById("winnerHistory"),
  currentRound: document.getElementById("currentRound"),
  adminPanel: document.getElementById("admin-panel")
};

function extractErrorMessage(error) {
  try {
    // Case 1: Ethers v6 — error.revert?.args
    if (error?.revert?.args && error.revert.args.length > 0) {
      return error.revert.args[0]; // "Max ticket reached"
    }

    // Case 2: Ethers v5 style — error.error.body
    const body = error?.error?.body;
    if (body) {
      const bodyJson = JSON.parse(body);
      const reason = bodyJson?.error?.data?.reason;
      if (reason) return reason;
    }

    // Case 3: MetaMask error
    if (error?.data?.message) {
      return error.data.message;
    }
    if (error?.error?.message) {
      return error.error.message;
    }

    // Case 4: Fallback to generic message
    if (error?.reason) return error.reason;
    if (error?.message) return error.message;

    return "❌ Unknown error occurred";
  } catch (err) {
    return "❌ Unknown error occurred";
  }
}


export async function checkManager() {
    try {
        const accounts = await window.ethereum.request({ method: "eth_accounts" });
        if (!accounts || accounts.length === 0) {
            lottery_ui.adminPanel.style.display = "none";
            return false;
        }

        const currentUser = accounts[0].toLowerCase();
        const manager = (await lotteryContract.getManager()).toLowerCase();

        // Nếu là manager → show admin tools
        if (currentUser === manager) {
            lottery_ui.adminPanel.style.display = "block";  
            console.log("You are the manager — admin features unlocked");
            return true;
        }

        lottery_ui.adminPanel.style.display = "none";
        return false;

    } catch (error) {
        console.error("Error checking manager:", extractErrorMessage(error));
        lottery_ui.adminPanel.style.display = "none";
        return false;
    }
}

// Hàm lấy và show số dư tài khoản
export async function updateBalance() {
  try {
    if (!provider) {
      await connectWallet();
    }
    const account = await getAddress();
    const balanceWei = await provider.getBalance(account);
    const balanceEth = Number(ethers.formatEther(balanceWei)).toFixed(3);
    lottery_ui.myBalance.innerText = `${balanceEth} ETH`;
  } catch (error) {
    lottery_ui.myBalance.innerText = `_ ETH`;
    showToast(extractErrorMessage(error), "error");
  }
}

async function updateFee() {
  const price = await lotteryContract.getTicketPrice();
  const formatPrice = Number(ethers.formatEther(price)).toFixed(3);

  lottery_ui.entryFee.innerText = `${formatPrice} ETH`;
}

async function updateTotalPool() {
  try {
    const totalPool = await lotteryContract.getTotalPool();
    const formatTotal = Number(ethers.formatEther(totalPool)).toFixed(3);
    
    lottery_ui.totalPool.innerText = `${formatTotal} ETH`;
  } catch (err) {
    showToast(extractErrorMessage(err), "error");
  }
}

async function updateCurrentRound() {
  try {
    const round = await lotteryContract.getCurrentRound();
    lottery_ui.currentRound.innerText = `Round ${round}`
  } catch (err) {
    showToast(extractErrorMessage(err), "error");
  }
}

async function updatePlayersByRound() {
  try {
    const round = await lotteryContract.getCurrentRound();
    const players = await lotteryContract.getPlayersByRound(round);
    const currentAddress = (await getAddress())?.toLowerCase();

    lottery_ui.playerList.innerHTML = ""; // clear UI cũ

    if (players.length === 0) {
      lottery_ui.playerList.innerHTML = `
        <li style="padding: 10px; text-align: center; color: var(--text-muted);">
          No players yet
        </li>
      `;
      return;
    }

    // Đếm số vé per player (JS xử lý, không tốn gas)
    const ticketCountMap = {};
    players.forEach(p => {
      const addr = p.toLowerCase();
      ticketCountMap[addr] = (ticketCountMap[addr] || 0) + 1;
    });

    // Render từng player
    Object.entries(ticketCountMap).forEach(([address, count]) => {
      const short = address.substring(0, 6) + "..." + address.substring(address.length - 4);
      const isMe = currentAddress && address === currentAddress;

      const li = document.createElement("li");
      li.style = `
        display: flex;
        justify-content: space-between;
        padding: 10px;
        border-bottom: 1px solid var(--border-color);
        font-weight: ${isMe ? "700" : "400"};
        color: ${isMe ? "gold" : "inherit"};
      `;

      li.innerHTML = `
        <span>${short} ${isMe ? "(you)" : ""}</span>
        <span style="color: var(--text-muted)">${count} ticket${count > 1 ? "s" : ""}</span>
      `;

      lottery_ui.playerList.appendChild(li);
    });

  } catch (err) {
    showToast(extractErrorMessage(err), "error");
  }
}

async function updateTotalTicket(){
  try {
    const totalTicket = await lotteryContract.getTicketCount();
    lottery_ui.ticketCount.innerText = totalTicket;

  } catch (err) {
    showToast(extractErrorMessage(err), "error");
  }
}

async function updateUserJoinStatus() {
  try {
    const account = await getAddress();
    if (!account) {
      lottery_ui.userJoinStatus.innerText = "Please connect your wallet.";
      return;
    }

    const round = await lotteryContract.getCurrentRound();
    const players = await lotteryContract.getPlayersByRound(round);

    const normalized = account.toLowerCase();
    const joined = players.some(p => p.toLowerCase() === normalized);

    if (joined) {
      lottery_ui.userJoinStatus.innerText = "";
    } else {
      lottery_ui.userJoinStatus.innerText = "You have not joined this round.";
    }

  } catch (err) {
    showToast(extractErrorMessage(err), "error");
  }
}

async function updateWinnerHistory() {
  try {
    const ul = document.getElementById("winnerHistory");
    if (!ul) return;
    ul.innerHTML = "";

    const currentRound = Number(await lotteryContract.getCurrentRound());

    const currentWinner = await lotteryContract.getWinnerByRound(currentRound);

    if (currentWinner !== ethers.ZeroAddress) {
      const short =
        currentWinner.substring(0, 6) +
        "..." +
        currentWinner.substring(currentWinner.length - 4);

      const li = document.createElement("li");
      li.style =
        "padding: 10px; border-bottom: 1px solid var(--border-color);";

      li.innerHTML = `
        Round ${currentRound}: 
        <span style="color: var(--success-color)">${short}</span>
        - NFT
      `;

      ul.appendChild(li);
    }

    for (let round = currentRound - 1; round >= 0; round--) {
      const winner = await lotteryContract.getWinnerByRound(round);
      if (winner === ethers.ZeroAddress) continue;

      const short =
        winner.substring(0, 4) +
        "..." +
        winner.substring(winner.length - 2);

      const li = document.createElement("li");
      li.style =
        "padding: 10px; border-bottom: 1px solid var(--border-color);";

      li.innerHTML = `
        Round ${round}: 
        <span style="color: var(--success-color)">${short}</span>
        - NFT
      `;

      ul.appendChild(li);
    }

    // 3️⃣ Nếu vẫn chưa có winner nào
    if (ul.innerHTML === "") {
      ul.innerHTML = `
        <li style="padding: 10px; text-align:center; color: var(--text-muted);">
          No winners yet
        </li>
      `;
    }
  } catch (err) {
    showToast(extractErrorMessage(err), "error");
  }
}

async function joinLottery() {
  try {
    const price = await lotteryContract.getTicketPrice();
    const tx = await lotteryContract.joinLottery({ value: price });
    await tx.wait();

    await updateBalance();
    await updateTotalPool();
    await updateTotalTicket();
    await updatePlayersByRound();

    showToast("Joined lottery!", "success");
  } catch (e) {
    showToast(extractErrorMessage(e), "error");
  }
}

async function pickWinner() {
  try {
    const tx = await lotteryContract.pickWinner();
    await tx.wait();
    showToast("Winner picked!", "success");
  } catch (e) {
    showToast(extractErrorMessage(e), "error");
  }
}

async function resetLottery() {
  try {
    const tx = await lotteryContract.resetGames();
    await tx.wait();
    const message = "Game reset!";
    sessionStorage.setItem("toastAfterReload", message);
    location.reload();
  } catch (e) {
    showToast(extractErrorMessage(e), "error");
  }
}

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

  // Main lottery page
  await checkManager();
  await updateBalance();
  await updateFee();
  await updateTotalPool();
  await updateCurrentRound();
  await updateTotalTicket();
  await updatePlayersByRound();
  await updateUserJoinStatus();
  await updateWinnerHistory();
  
  lottery_ui.joinBtn.addEventListener("click", joinLottery);
  lottery_ui.pickWinnerBtn.addEventListener("click", pickWinner);
  lottery_ui.resetBtn.addEventListener("click", resetLottery);
});

