// import { lotteryContract } from "./contracts.js";
import { updateStatus } from "./toast.js";

export async function joinLottery() {
  try {
    const price = await lotteryContract.getTicketPrice();
    const tx = await lotteryContract.joinGame({ value: price });
    await tx.wait();
    updateStatus("🎉 Joined lottery!", "success");
  } catch (e) {
    updateStatus(`❌ ${e.message}`, "error");
  }
}

export async function pickWinner() {
  try {
    const tx = await lotteryContract.pickWinner();
    await tx.wait();
    updateStatus("🏆 Winner picked!", "success");
  } catch (e) {
    updateStatus(`❌ ${e.message}`, "error");
  }
}

export async function resetLottery() {
  try {
    const tx = await lotteryContract.resetGame();
    await tx.wait();
    updateStatus("🔄 Game reset", "success");
  } catch (e) {
    updateStatus(`❌ ${e.message}`, "error");
  }
}
