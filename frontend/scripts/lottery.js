import { lotteryContract } from "./contracts.js";
import { showToast } from "./toast.js";

const lottery_ui = {
  connectBtn: document.getElementById("connectWalletBtn"),
  totalPool: document.getElementById("totalPool"),
  playerCount: document.getElementById("playerCount"),
  entryFee: document.getElementById("entryFee"),
  playerList: document.getElementById("playerList"),
  joinBtn: document.getElementById("joinBtn"),
  pickWinnerBtn: document.getElementById("pickWinnerBtn"),
  resetBtn: document.getElementById("resetBtn"),
  userJoinStatus: document.getElementById("userJoinStatus"),
  winnerHistory: document.getElementById("winnerHistory"),
  currentRound: document.getElementById("currentRound"),
};

async function joinLottery() {
  console.log("Join ne");
  // try {
  //   const price = await lotteryContract.getTicketPrice();
  //   const tx = await lotteryContract.joinGame({ value: price });
  //   await tx.wait();
  //   showToast("Joined lottery!", "success");
  // } catch (e) {
  //   showToast(`${e.message}`, "error");
  // }
}

async function pickWinner() {
  console.log("Pick ne");
  // try {
  //   const tx = await lotteryContract.pickWinner();
  //   await tx.wait();
  //   showToast("Winner picked!", "success");
  // } catch (e) {
  //   showToast(`${e.message}`, "error");
  // }
}

async function resetLottery() {
  console.log("Reset ne");
  // try {
  //   const tx = await lotteryContract.resetGame();
  //   await tx.wait();
  //   showToast("Game reset", "success");
  // } catch (e) {
  //   showToast(`${e.message}`, "error");
  // }
}

document.addEventListener("DOMContentLoaded", async () => {  
  lottery_ui.joinBtn.addEventListener("click", joinLottery);
  lottery_ui.pickWinnerBtn.addEventListener("click", pickWinner);
  lottery_ui.resetBtn.addEventListener("click", resetLottery);
});

