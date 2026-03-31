// ── TIMER MODULE ──────────────────────────────────────────────────────────
// Manages the game clock. Reads/writes state.timerSec and state.timerInterval.

import { state } from './state.js';

const timerEl = document.getElementById('timer');

/** Formats a total-seconds count into "M:SS" display string. */
export function formatTime(s) {
  const m   = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

/** Starts the 1-second interval. Skips ticks while paused or game over. */
export function startTimer() {
  state.timerInterval = setInterval(() => {
    if (!state.gameOver && !state.paused) {
      state.timerSec++;
      timerEl.textContent = formatTime(state.timerSec);
    }
  }, 1000);
}

/** Clears the interval and nulls the reference. */
export function stopTimer() {
  clearInterval(state.timerInterval);
  state.timerInterval = null;
}
