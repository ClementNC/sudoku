import { state } from "./state.js";

const timerEl = document.getElementById("timer");

export function formatTime(s) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

export function startTimer() {
  state.timerInterval = setInterval(() => {
    if (!state.gameOver && !state.paused) {
      state.timerSec++;
      timerEl.textContent = formatTime(state.timerSec);
    }
  }, 1000);
}

export function stopTimer() {
  clearInterval(state.timerInterval);
  state.timerInterval = null;
}
