// ── PUZZLE MODULE ─────────────────────────────────────────────────────────
// Responsible for generating and fetching Sudoku puzzles.
// Pure logic — no DOM access.

import { DIFF_BLANKS } from './state.js';

// ── HELPERS ───────────────────────────────────────────────────────────────

/** Fisher-Yates shuffle — returns the array mutated in place. */
export function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/** Returns true if placing `num` at (row, col) is a legal Sudoku move. */
export function isValid(board, row, col, num) {
  for (let i = 0; i < 9; i++) {
    if (board[row][i] === num || board[i][col] === num) return false;
  }
  const br = Math.floor(row / 3) * 3;
  const bc = Math.floor(col / 3) * 3;
  for (let r = br; r < br + 3; r++)
    for (let c = bc; c < bc + 3; c++)
      if (board[r][c] === num) return false;
  return true;
}

/** Recursively fills a 9×9 board with a valid Sudoku solution. */
export function fillBoard(board) {
  const nums = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]);
  for (let i = 0; i < 81; i++) {
    const r = Math.floor(i / 9), c = i % 9;
    if (board[r][c] === 0) {
      for (const n of nums) {
        if (isValid(board, r, c, n)) {
          board[r][c] = n;
          if (fillBoard(board)) return true;
          board[r][c] = 0;
        }
      }
      return false;
    }
  }
  return true;
}

/** Infers difficulty from the number of blank cells in a puzzle. */
export function detectDiff(puzzle) {
  let blanks = 0;
  for (let r = 0; r < 9; r++)
    for (let c = 0; c < 9; c++)
      if (puzzle[r][c] === 0) blanks++;
  if (blanks <= 40) return 'easy';
  if (blanks <= 50) return 'medium';
  return 'hard';
}

// ── GENERATORS ────────────────────────────────────────────────────────────

/**
 * Client-side fallback puzzle generator.
 * Builds a complete board then removes cells according to difficulty.
 */
export function generateFallback(difficulty) {
  const board = Array.from({ length: 9 }, () => Array(9).fill(0));
  fillBoard(board);
  const solution = board.map(r => [...r]);
  const puzzle   = board.map(r => [...r]);
  const blanks   = DIFF_BLANKS[difficulty] || 46;
  const cells    = shuffle([...Array(81).keys()]);
  let removed = 0;
  for (const idx of cells) {
    if (removed >= blanks) break;
    puzzle[Math.floor(idx / 9)][idx % 9] = 0;
    removed++;
  }
  return { puzzle, solution };
}

/**
 * Fetches a puzzle from the Dosuku API (free, no key required).
 * Falls back to generateFallback() on network error or timeout.
 */
export async function fetchPuzzle() {
  try {
    const res = await fetch('https://sudoku-api.vercel.app/api/dosuku', {
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) throw new Error('API error');
    const data       = await res.json();
    const grid       = data.newboard.grids[0];
    const puzzle     = grid.value.map(r => r.map(v => (v === null ? 0 : v)));
    const solution   = grid.solution.map(r => [...r]);
    const apiDiff    = grid.difficulty?.toLowerCase();
    const difficulty = apiDiff && ['easy', 'medium', 'hard'].includes(apiDiff)
      ? apiDiff
      : detectDiff(puzzle);
    return { puzzle, solution, difficulty };
  } catch {
    const difficulty = ['easy', 'medium', 'hard'][Math.floor(Math.random() * 3)];
    const { puzzle, solution } = generateFallback(difficulty);
    return { puzzle, solution, difficulty };
  }
}
