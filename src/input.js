// ── INPUT MODULE ──────────────────────────────────────────────────────────
// Handles all ways a user can modify the board:
//   - Placing a number (normal or note mode)
//   - Erasing a cell
//   - Undoing the last action
//   - Using a hint

import { state } from './state.js';
import { rerenderCell, refreshHL, updateNumpad, getCellEl, makeNotesGrid } from './board.js';

// endGame is injected by main.js to avoid a circular dependency with game.js
export let endGame = () => {};
export function setEndGame(fn) { endGame = fn; }

// ── HELPERS ───────────────────────────────────────────────────────────────

/**
 * After placing a correct number, removes that number from the pencil-mark
 * notes of every cell in the same row, column, and 3×3 box, then re-renders
 * those cells so stale notes disappear immediately.
 */
export function clearAffectedNotes(row, col, n) {
  for (let i = 0; i < 9; i++) {
    state.notes[row][i].delete(n);
    state.notes[i][col].delete(n);
  }
  const br = Math.floor(row / 3) * 3;
  const bc = Math.floor(col / 3) * 3;
  for (let r = br; r < br + 3; r++)
    for (let c = bc; c < bc + 3; c++)
      state.notes[r][c].delete(n);

  // Re-render affected cells (skip the origin cell — handled by the caller)
  for (let i = 0; i < 9; i++) {
    if (i !== col) rerenderCell(row, i);
    if (i !== row) rerenderCell(i, col);
  }
  for (let r = br; r < br + 3; r++)
    for (let c = bc; c < bc + 3; c++)
      if (!(r === row && c === col)) rerenderCell(r, c);
}

// ── ACTIONS ───────────────────────────────────────────────────────────────

/**
 * Places digit `n` in the selected cell.
 * In note mode: toggles the pencil mark instead.
 * Increments mistake counter for wrong answers; checks for win on correct ones.
 */
export function inputNumber(n) {
  if (state.gameOver || state.paused || !state.selected) return;
  const { row, col } = state.selected;
  if (state.fixed[row][col]) return;

  if (state.noteMode) {
    const prevNotes = new Set(state.notes[row][col]);
    if (state.notes[row][col].has(n))       state.notes[row][col].delete(n);
    else if (state.userBoard[row][col] === 0) state.notes[row][col].add(n);
    state.history.push({ row, col, prevVal: state.userBoard[row][col], prevNotes, type: 'note' });
    rerenderCell(row, col);
    return;
  }

  const prevVal   = state.userBoard[row][col];
  const prevNotes = new Set(state.notes[row][col]);
  state.history.push({ row, col, prevVal, prevNotes, type: 'value' });

  state.userBoard[row][col] = n;
  state.notes[row][col].clear();

  if (n !== state.solution[row][col]) {
    state.mistakes++;
    updateMistakeDots();
    getCellEl(row, col)?.classList.add('error');
    setTimeout(() => {
      if (state.mistakes >= state.maxMistakes) endGame(false);
    }, 600);
  } else {
    clearAffectedNotes(row, col, n);
    if (isPuzzleComplete()) setTimeout(() => endGame(true), 300);
  }

  rerenderCell(row, col);
  updateNumpad();
  refreshHL();
}

/** Clears the value and notes from the selected cell (if user-entered). */
export function eraseCell() {
  if (state.gameOver || state.paused || !state.selected) return;
  const { row, col } = state.selected;
  if (state.fixed[row][col]) return;
  const prevVal   = state.userBoard[row][col];
  const prevNotes = new Set(state.notes[row][col]);
  if (prevVal === 0 && prevNotes.size === 0) return;
  state.history.push({ row, col, prevVal, prevNotes, type: 'erase' });
  state.userBoard[row][col] = 0;
  state.notes[row][col].clear();
  rerenderCell(row, col);
  updateNumpad();
  refreshHL();
}

/** Steps back one action in the undo history. */
export function undoAction() {
  if (!state.history.length || state.paused) return;
  const { row, col, prevVal, prevNotes } = state.history.pop();
  state.userBoard[row][col] = prevVal;
  state.notes[row][col]     = new Set(prevNotes);
  rerenderCell(row, col);
  updateNumpad();
  refreshHL();
}

/**
 * Reveals one random unsolved cell.
 * Limited to 3 uses per board; the revealed cell is highlighted in gold.
 */
export function useHint(hintCountEl, hintBtn, selectCell) {
  if (state.hintsLeft <= 0 || state.gameOver || state.paused) return;

  const candidates = [];
  for (let r = 0; r < 9; r++)
    for (let c = 0; c < 9; c++)
      if (!state.fixed[r][c] && !state.hintRevealed[r][c] && state.userBoard[r][c] !== state.solution[r][c])
        candidates.push([r, c]);
  if (!candidates.length) return;

  const [r, c]    = candidates[Math.floor(Math.random() * candidates.length)];
  const prevVal   = state.userBoard[r][c];
  const prevNotes = new Set(state.notes[r][c]);
  state.history.push({ row: r, col: c, prevVal, prevNotes, type: 'hint' });

  state.userBoard[r][c]    = state.solution[r][c];
  state.notes[r][c].clear();
  state.hintRevealed[r][c] = true;
  clearAffectedNotes(r, c, state.solution[r][c]);

  state.hintsLeft--;
  hintCountEl.textContent = `${state.hintsLeft} left`;
  if (state.hintsLeft === 0) hintBtn.classList.add('disabled');

  rerenderCell(r, c);
  updateNumpad();
  selectCell(r, c);
  if (isPuzzleComplete()) setTimeout(() => endGame(true), 300);
}

// ── STATUS HELPERS (used internally + exported for game.js) ───────────────

/** Returns true when every cell matches the solution. */
export function isPuzzleComplete() {
  for (let r = 0; r < 9; r++)
    for (let c = 0; c < 9; c++)
      if (state.userBoard[r][c] !== state.solution[r][c]) return false;
  return true;
}

/** Syncs the three mistake-indicator dots to the current mistake count. */
export function updateMistakeDots() {
  for (let i = 0; i < 3; i++)
    document.getElementById(`md${i}`).classList.toggle('filled', i < state.mistakes);
}
