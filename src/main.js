import { state } from "./state.js";
import {
  MOON,
  SUN,
  PAUSE,
  PLAY,
  PAUSE_LARGE,
  UNDO,
  ERASE,
  NOTES,
  HINT,
  RESTART,
} from "./icons.js";
import { startNewGame, restartGame, endGame } from "./game.js";
import {
  inputNumber,
  eraseCell,
  undoAction,
  useHint,
  setEndGame,
} from "./input.js";
import { setSelectCell, setInputNumber, refreshHL, boardEl } from "./board.js";

const noteBtn = document.getElementById("noteBtn");
const hintBtn = document.getElementById("hintBtn");
const hintCountEl = document.getElementById("hintCount");
const undoBtn = document.getElementById("undoBtn");
const eraseBtn = document.getElementById("eraseBtn");
const pauseBtn = document.getElementById("pauseBtn");
const pauseScreen = document.getElementById("pauseScreen");
const winOverlay = document.getElementById("winOverlay");
const gameOverOverlay = document.getElementById("gameOverOverlay");
document.getElementById("undoBtn").insertAdjacentHTML("afterbegin", UNDO);
document.getElementById("eraseBtn").insertAdjacentHTML("afterbegin", ERASE);
document.getElementById("noteBtn").insertAdjacentHTML("afterbegin", NOTES);
document.getElementById("hintBtn").insertAdjacentHTML("afterbegin", HINT);
document.getElementById("restartBtn").insertAdjacentHTML("afterbegin", RESTART);

function selectCell(r, c) {
  state.selected = { row: r, col: c };
  refreshHL();
}

setSelectCell(selectCell);
setInputNumber(inputNumber);
setEndGame(endGame);

let isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

function applyTheme() {
  document.documentElement.setAttribute(
    "data-theme",
    isDark ? "dark" : "light",
  );
  document.getElementById("themeToggle").innerHTML = isDark ? SUN : MOON;
}

document.getElementById("themeToggle").addEventListener("click", () => {
  isDark = !isDark;
  applyTheme();
});

function togglePause() {
  if (state.gameOver) return;
  state.paused = !state.paused;
  boardEl.classList.toggle("blurred", state.paused);
  pauseScreen.classList.toggle("show", state.paused);
  pauseBtn.classList.toggle("paused", state.paused);
  pauseBtn.innerHTML = state.paused ? PLAY : PAUSE;
  document.getElementById("pauseScreenIcon").innerHTML = state.paused
    ? PAUSE_LARGE
    : "";
}

pauseBtn.addEventListener("click", togglePause);
pauseScreen.addEventListener("click", () => {
  if (state.paused) togglePause();
});

eraseBtn.addEventListener("click", eraseCell);
undoBtn.addEventListener("click", undoAction);
hintBtn.addEventListener("click", () =>
  useHint(hintCountEl, hintBtn, selectCell),
);

noteBtn.addEventListener("click", () => {
  state.noteMode = !state.noteMode;
  noteBtn.classList.toggle("active", state.noteMode);
});

document.getElementById("newGameBtn").addEventListener("click", startNewGame);
document.getElementById("restartBtn").addEventListener("click", restartGame);

document.getElementById("winNewGame").addEventListener("click", () => {
  winOverlay.classList.remove("show");
  startNewGame();
});
document.getElementById("goRestart").addEventListener("click", () => {
  gameOverOverlay.classList.remove("show");
  restartGame();
});
document.getElementById("goNewGame").addEventListener("click", () => {
  gameOverOverlay.classList.remove("show");
  startNewGame();
});

document.addEventListener("keydown", (e) => {
  // Space toggles pause regardless of game state
  if (e.key === " " && !e.target.matches("button")) {
    e.preventDefault();
    togglePause();
    return;
  }

  if (state.gameOver || state.paused) return;

  if (e.key >= "1" && e.key <= "9") {
    inputNumber(+e.key);
    return;
  }
  if (e.key === "Backspace" || e.key === "Delete" || e.key === "0") {
    eraseCell();
    return;
  }
  if (e.key === "n" || e.key === "N") {
    noteBtn.click();
    return;
  }
  if ((e.key === "z" || e.key === "Z") && (e.ctrlKey || e.metaKey)) {
    e.preventDefault();
    undoAction();
    return;
  }

  if (!state.selected) return;
  const { row, col } = state.selected;
  const moves = {
    ArrowUp: [-1, 0],
    ArrowDown: [1, 0],
    ArrowLeft: [0, -1],
    ArrowRight: [0, 1],
  };
  if (moves[e.key]) {
    e.preventDefault();
    const [dr, dc] = moves[e.key];
    selectCell(
      Math.max(0, Math.min(8, row + dr)),
      Math.max(0, Math.min(8, col + dc)),
    );
  }
});

applyTheme();
startNewGame();
