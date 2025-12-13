import { lotteryContract, nftContract, loadABIs, initContracts } from "./contracts.js";
import { showToast } from "./toast.js";
import { provider, getAddress, initWalletEvents, connectWallet } from "./wallet.js";
import { autoFixIPFS, resolveIPFS } from "./utils.js";

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
  if (!lottery_ui.adminPanel) return false;
  try {
  
    const accounts = await window.ethereum.request({ method: "eth_accounts" });
    
    // 1. Nếu không có account, ẩn admin panel (nếu panel tồn tại)
    if (!accounts || accounts.length === 0) {
        if (lottery_ui.adminPanel) { 
            lottery_ui.adminPanel.style.display = "none";
        }
        return false;
    }

    const currentUser = accounts[0].toLowerCase();
    
    // Đảm bảo contract đã init
    if (!lotteryContract) return false; 

    const manager = (await lotteryContract.getManager()).toLowerCase();

    // 2. Nếu là manager -> Hiện panel (nếu panel tồn tại)
    if (currentUser === manager) {
        if (lottery_ui.adminPanel) {
            lottery_ui.adminPanel.style.display = "block";  
        }
        console.log("Manager detected");
        return true;
    }

    // 3. Nếu không phải manager -> Ẩn panel (nếu panel tồn tại)
    if (lottery_ui.adminPanel) {
        lottery_ui.adminPanel.style.display = "none";
    }
    return false;

  } catch (error) {
      console.error("Error checking manager:", error);
      // Fallback: Ẩn panel nếu có lỗi
      if (lottery_ui.adminPanel) {
          lottery_ui.adminPanel.style.display = "none";
      }
      return false;
  }
}

// Hàm lấy và show số dư tài khoản
// Tìm hàm updateBalance và sửa thành:
export async function updateBalance() {
  if (!lottery_ui.adminPanel) return false;
  try {
    if (!provider) await connectWallet();
    const account = await getAddress();
    const balanceWei = await provider.getBalance(account);
    const balanceEth = Number(ethers.formatEther(balanceWei)).toFixed(3);
    
    // 👇 THÊM IF VÀO ĐÂY
    if (lottery_ui.myBalance) { 
        lottery_ui.myBalance.innerText = `${balanceEth} ETH`;
    }
  } catch (error) {
    if (lottery_ui.myBalance) lottery_ui.myBalance.innerText = `_ ETH`;
  }
}

// Làm tương tự cho các hàm khác (updateTotalPool, updateTicketCount...)
// Ví dụ:
async function updateTotalPool() {
  if (!lottery_ui.adminPanel) return false;
  try {
    const totalPool = await lotteryContract.getTotalPool();
    const formatTotal = Number(ethers.formatEther(totalPool)).toFixed(3);
    // 👇 THÊM IF
    if(lottery_ui.totalPool) lottery_ui.totalPool.innerText = `${formatTotal} ETH`;
  } catch (err) { console.error(err); }
}

async function updateTotalTicket(){
  if (!lottery_ui.adminPanel) return false;
  try {
    const totalTicket = await lotteryContract.getTicketCount();
    // 👇 THÊM IF
    if(lottery_ui.ticketCount) lottery_ui.ticketCount.innerText = totalTicket;
  } catch (err) { console.error(err); }
}


async function updateFee() {
  if (!lottery_ui.adminPanel) return false;
  const price = await lotteryContract.getTicketPrice();
  const formatPrice = Number(ethers.formatEther(price)).toFixed(3);

  lottery_ui.entryFee.innerText = `${formatPrice} ETH`;
}


async function updateCurrentRound() {
  if (!lottery_ui.adminPanel) return false;
  try {
    const round = await lotteryContract.getCurrentRound();
    lottery_ui.currentRound.innerText = `Round ${round}`
  } catch (err) {
    showToast(extractErrorMessage(err), "error");
  }
}

async function updatePlayersByRound() {
  if (!lottery_ui.adminPanel) return false;
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

async function updateUserJoinStatus() {
  if (!lottery_ui.adminPanel) return false;
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
  const ul = document.getElementById("winnerHistory");
  if (!ul) return;

  try {
    ul.innerHTML = "";

    const currentRound = Number(await lotteryContract.getCurrentRound());
    const fallbackImg = "https://via.placeholder.com/50?text=Wait";
    let hasAnyWinner = false;

    // 🔥 Loop từ currentRound xuống
    for (let i = currentRound; i >= 0; i--) {
      const winner = await lotteryContract.getWinnerByRound(i);

      // 🚫 Round chưa có winner → skip
      if (winner === ethers.ZeroAddress) continue;

      hasAnyWinner = true;

      let imageSrc = fallbackImg;
      let nftName = "";

      try {
        const tokenIdBig = await lotteryContract.getWinningTokenId(i);
        const tokenId = Number(tokenIdBig);

        let tokenUri = await nftContract.tokenURI(tokenId);
        tokenUri = autoFixIPFS(tokenUri);
        console.log(tokenUri);
        const resolvedUri = resolveIPFS(tokenUri);
        const response = await fetch(resolvedUri);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const metadata = await response.json();
        nftName = metadata.name || "Unknown";
        imageSrc = metadata.image
          ? resolveIPFS(metadata.image)
          : fallbackImg;

      } catch (e) {
        console.warn(`Round ${i}: NFT metadata error`, e);
      }

      const shortAddr =
        winner.substring(0, 6) + "..." + winner.substring(winner.length - 4);

      const li = document.createElement("li");
      li.style =
        "padding: 10px; border-bottom: 1px solid var(--border-color); display: flex; align-items: center; gap: 10px;";

      li.innerHTML = `
        <img src="${imageSrc}"
             style="width:50px;height:50px;border-radius:8px;border:1px solid gold"
             onerror="this.src='https://via.placeholder.com/50?text=Err'">
        <div>
          <strong>Round ${i}</strong><br>
          <span>Winner:
            <span style="color: var(--success-color)">${shortAddr}</span>
          </span><br>
          <span style="font-size:13px;color:var(--text-secondary)">
            NFT: <strong>${nftName}</strong>
          </span>
        </div>
      `;

      ul.appendChild(li);
    }

    if (!hasAnyWinner) {
      ul.innerHTML =
        `<li style="padding:10px;text-align:center">No winners yet</li>`;
    }

  } catch (err) {
    console.error("Error loading winner history:", err);
  }
}


async function joinLottery() {
  if (!lottery_ui.adminPanel) return false;
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

    showToast("Winner picked & NFT minted!", "success");
    
    // Cập nhật lại UI
    await updateWinnerHistory();
    await updateTotalPool();
    // Ẩn nút pick winner nếu cần thiết
  } catch (e) {
    showToast(extractErrorMessage(e), "error");
    console.error(e);
  }
}

async function resetLottery() {
  if (!lottery_ui.adminPanel) return false;
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
  await checkManager();
  await updateBalance();
  await updateTotalPool();
  await updateFee();
  await updateCurrentRound();
  await updateTotalTicket();
  await updatePlayersByRound();
  await updateUserJoinStatus();
  await updateWinnerHistory();

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
  

  if (lottery_ui.joinBtn) {
    lottery_ui.joinBtn.addEventListener("click", joinLottery);
  }

  if (lottery_ui.pickWinnerBtn) {
      lottery_ui.pickWinnerBtn.addEventListener("click", pickWinner);
  }

  if (lottery_ui.resetBtn) {
      lottery_ui.resetBtn.addEventListener("click", resetLottery);
  }
});

