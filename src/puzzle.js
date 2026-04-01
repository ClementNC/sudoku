// ── PUZZLE MODULE ─────────────────────────────────────────────────────────
// Responsible for generating and fetching Sudoku puzzles.
// Pure logic — no DOM access.

import { DIFF_BLANKS } from "./state.js";

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
    for (let c = bc; c < bc + 3; c++) if (board[r][c] === num) return false;
  return true;
}

/** Recursively fills a 9×9 board with a valid Sudoku solution. */
export function fillBoard(board) {
  const nums = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]);
  for (let i = 0; i < 81; i++) {
    const r = Math.floor(i / 9),
      c = i % 9;
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
    for (let c = 0; c < 9; c++) if (puzzle[r][c] === 0) blanks++;
  if (blanks <= 40) return "easy";
  if (blanks <= 50) return "medium";
  return "hard";
}

// ── UNIQUENESS ────────────────────────────────────────────────────────────

/**
 * Counts the number of solutions a puzzle has, up to `limit`.
 * Stops as soon as `limit` is reached so we never waste time counting
 * further than needed. For uniqueness checks, limit = 2 is sufficient:
 *   - returns 0 → no solution (invalid puzzle)
 *   - returns 1 → exactly one solution (unique ✓)
 *   - returns 2 → multiple solutions (not unique ✗)
 *
 * Works on a deep copy — does not mutate the passed board.
 */
export function countSolutions(board, limit = 2) {
  // Find the first empty cell
  for (let i = 0; i < 81; i++) {
    const r = Math.floor(i / 9),
      c = i % 9;
    if (board[r][c] === 0) {
      let count = 0;
      for (let n = 1; n <= 9; n++) {
        if (isValid(board, r, c, n)) {
          board[r][c] = n;
          count += countSolutions(board, limit - count);
          board[r][c] = 0;
          if (count >= limit) return count; // early exit
        }
      }
      return count; // this branch is exhausted
    }
  }
  return 1; // no empty cells — a complete solution was found
}

/** Convenience wrapper — returns true if the puzzle has exactly one solution. */
export function isUnique(puzzle) {
  return countSolutions(puzzle.map((r) => [...r])) === 1;
}

// ── UNIQUENESS RESTORATION ─────────────────────────────────────────────────

/**
 * Given a puzzle that may have multiple solutions and its known solution,
 * restores the minimum number of clues needed to make it unique again.
 *
 * Strategy: iterate over the empty cells in a random order. For each one,
 * temporarily restore the clue from the solution and check if the puzzle is
 * now unique. Stop as soon as it is. This is greedy — it won't always find
 * the absolute minimum restoration, but it's fast and keeps difficulty high
 * by only adding back as few clues as necessary.
 *
 * @param {number[][]} puzzle   - The puzzle grid (mutated in place)
 * @param {number[][]} solution - The known correct solution
 */
function restoreUniqueness(puzzle, solution) {
  // Collect all empty cells and shuffle so restoration order is random
  const emptyCells = [];
  for (let r = 0; r < 9; r++)
    for (let c = 0; c < 9; c++) if (puzzle[r][c] === 0) emptyCells.push([r, c]);

  shuffle(emptyCells);

  for (const [r, c] of emptyCells) {
    puzzle[r][c] = solution[r][c]; // restore this clue
    if (isUnique(puzzle)) return; // done — puzzle is now unique
  }
  // If we somehow exhaust all cells the puzzle equals the solution (trivially unique)
}

// ── GENERATORS ────────────────────────────────────────────────────────────

/**
 * Client-side puzzle generator with guaranteed unique solution.
 *
 * Builds a complete solved board, then removes cells one by one in random
 * order. Before committing each removal, it verifies the puzzle still has
 * exactly one solution. If removing a cell breaks uniqueness, that cell is
 * kept. This continues until the target blank count is reached (or all cells
 * have been tried).
 *
 * Because every removal is uniqueness-checked, the final puzzle is guaranteed
 * to have exactly one solution without needing a post-hoc fix.
 *
 * Note: this is slower than the old blind-removal approach, but for a 9×9
 * board it completes in well under a second in any modern browser.
 */
export function generateFallback(difficulty) {
  const board = Array.from({ length: 9 }, () => Array(9).fill(0));
  fillBoard(board);
  const solution = board.map((r) => [...r]);
  const puzzle = board.map((r) => [...r]);
  const target = DIFF_BLANKS[difficulty] || 46;
  const cells = shuffle([...Array(81).keys()]);
  let removed = 0;

  for (const idx of cells) {
    if (removed >= target) break;
    const r = Math.floor(idx / 9),
      c = idx % 9;
    const backup = puzzle[r][c];
    puzzle[r][c] = 0;

    if (isUnique(puzzle)) {
      removed++; // safe to remove — still unique
    } else {
      puzzle[r][c] = backup; // restore — removing this broke uniqueness
    }
  }

  return { puzzle, solution };
}

// ── FETCH + VALIDATE ──────────────────────────────────────────────────────

/**
 * Fetches a puzzle from the Dosuku API (free, no key required).
 *
 * After fetching, we independently verify the puzzle has a unique solution
 * using our own solver — we do not trust the API's solution field for this,
 * since the API gives no uniqueness guarantee. If the puzzle is not unique,
 * we restore the minimum number of clues needed to make it so, preserving
 * as much of the original difficulty as possible.
 *
 * Falls back to generateFallback() on network error or timeout.
 */
export async function fetchPuzzle() {
  try {
    const res = await fetch("https://sudoku-api.vercel.app/api/dosuku", {
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) throw new Error("API error");

    const data = await res.json();
    const grid = data.newboard.grids[0];
    const puzzle = grid.value.map((r) => r.map((v) => (v === null ? 0 : v)));
    const solution = grid.solution.map((r) => [...r]);

    // Verify uniqueness ourselves — don't trust the API
    if (!isUnique(puzzle)) {
      // Restore the minimum clues needed to make the puzzle unique.
      // We pass the API's solution as the source of truth for which
      // digit belongs in each cell.
      restoreUniqueness(puzzle, solution);
    }

    const apiDiff = grid.difficulty?.toLowerCase();
    const difficulty =
      apiDiff && ["easy", "medium", "hard"].includes(apiDiff)
        ? apiDiff
        : detectDiff(puzzle);

    return { puzzle, solution, difficulty };
  } catch {
    const difficulty = ["easy", "medium", "hard"][
      Math.floor(Math.random() * 3)
    ];
    const { puzzle, solution } = generateFallback(difficulty);
    return { puzzle, solution, difficulty };
  }
}
