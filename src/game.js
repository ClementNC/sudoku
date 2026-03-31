// ── GAME MODULE ───────────────────────────────────────────────────────────
// Manages the overall game lifecycle:
//   - Starting a new game (fetches a fresh puzzle)
//   - Restarting the current board
//   - Initialising state for any game
//   - Ending the game (win or loss) and showing the correct modal

import { state, snap }         from './state.js';
import { fetchPuzzle }         from './puzzle.js';
import { startTimer, stopTimer, formatTime } from './timer.js';
import { renderBoard, renderNumpad, boardEl } from './board.js';
import { updateMistakeDots }   from './input.js';
import { SVG_PAUSE }           from './icons.js';

// ── DOM REFS ──────────────────────────────────────────────────────────────
const timerEl         = document.getElementById('timer');
const hintCountEl     = document.getElementById('hintCount');
const hintBtn         = document.getElementById('hintBtn');
const noteBtn         = document.getElementById('noteBtn');
const pauseBtn        = document.getElementById('pauseBtn');
const pauseScreen     = document.getElementById('pauseScreen');
const winOverlay      = document.getElementById('winOverlay');
const winSubtitle     = document.getElementById('winSubtitle');
const gameOverOverlay = document.getElementById('gameOverOverlay');
const gameOverSub     = document.getElementById('gameOverSub');
const diffPill        = document.getElementById('diffPill');

// ── DIFFICULTY PILL ───────────────────────────────────────────────────────

/** Updates the pill label and colour class to match the current difficulty. */
export function setDiffPill(diff) {
  diffPill.className   = `diff-pill ${diff}`;
  diffPill.textContent = diff.charAt(0).toUpperCase() + diff.slice(1);
}

// ── GAME LIFECYCLE ────────────────────────────────────────────────────────

/**
 * Fetches a new puzzle from the API (or falls back to the generator),
 * saves a snapshot for potential restart, then initialises the board.
 */
export async function startNewGame() {
  stopTimer();
  resetUI();
  showLoading();

  const { puzzle, solution, difficulty } = await fetchPuzzle();

  // Save snapshot so restartGame() can reload the same board
  snap.puzzle     = puzzle.map(r => [...r]);
  snap.solution   = solution.map(r => [...r]);
  snap.difficulty = difficulty;

  initGame(puzzle, solution, difficulty);
}

/**
 * Resets all user progress and replays the saved puzzle snapshot.
 * Timer and hints are reset; the original givens are restored.
 */
export function restartGame() {
  stopTimer();
  resetUI();
  initGame(
    snap.puzzle.map(r => [...r]),
    snap.solution.map(r => [...r]),
    snap.difficulty
  );
}

/** Shows the loading spinner while a puzzle is being fetched. */
export function showLoading() {
  boardEl.innerHTML = '<div class="loading-board"><div class="spinner"></div></div>';
  boardEl.classList.remove('blurred');
  pauseScreen.classList.remove('show');
}

/**
 * Resets all transient UI and state fields back to their initial values.
 * Called before every new game and restart.
 */
export function resetUI() {
  state.gameOver  = false;
  state.paused    = false;
  state.selected  = null;
  state.noteMode  = false;
  state.hintsLeft = 3;
  state.mistakes  = 0;
  state.timerSec  = 0;
  state.history   = [];

  timerEl.textContent     = '0:00';
  hintCountEl.textContent = '3 left';
  updateMistakeDots();
  hintBtn.classList.remove('disabled');
  noteBtn.classList.remove('active');
  pauseBtn.classList.remove('paused');
  pauseBtn.innerHTML = SVG_PAUSE;
  winOverlay.classList.remove('show');
  gameOverOverlay.classList.remove('show');
  boardEl.classList.remove('blurred');
  pauseScreen.classList.remove('show');
}

/**
 * Populates state from a puzzle/solution pair, renders the board and numpad,
 * updates the difficulty pill, and starts the timer.
 */
export function initGame(puzzle, solution, difficulty) {
  state.puzzle       = puzzle;
  state.solution     = solution;
  state.fixed        = puzzle.map(r => r.map(v => v !== 0));
  state.userBoard    = puzzle.map(r => [...r]);
  state.notes        = Array.from({ length: 9 }, () =>
    Array.from({ length: 9 }, () => new Set())
  );
  state.hintRevealed = Array.from({ length: 9 }, () => Array(9).fill(false));
  state.difficulty   = difficulty;

  setDiffPill(difficulty);
  renderBoard();
  renderNumpad();
  startTimer();
}

// ── END GAME ──────────────────────────────────────────────────────────────

/**
 * Stops the game, removes pause state, and shows the appropriate modal.
 * @param {boolean} won - true = puzzle solved, false = too many mistakes
 */
export function endGame(won) {
  state.gameOver = true;
  stopTimer();
  boardEl.classList.remove('blurred');
  pauseScreen.classList.remove('show');

  if (won) {
    boardEl.classList.add('completed');
    setTimeout(() => boardEl.classList.remove('completed'), 700);
    winSubtitle.textContent = `You completed the ${state.difficulty} puzzle in ${formatTime(state.timerSec)} with ${state.mistakes} mistake${state.mistakes !== 1 ? 's' : ''}.`;
    winOverlay.classList.add('show');
  } else {
    gameOverSub.textContent = `You made ${state.maxMistakes} mistakes on the ${state.difficulty} puzzle. Want to try again?`;
    gameOverOverlay.classList.add('show');
  }
}
