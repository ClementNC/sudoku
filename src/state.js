// ── GAME STATE ────────────────────────────────────────────────────────────
// Single source of truth shared across all modules via import.
// Mutate properties directly; never reassign the object itself.

export const state = {
  puzzle:      null,
  solution:    null,
  fixed:       null,
  userBoard:   null,
  notes:       null,
  hintRevealed: null,
  selected:    null,
  noteMode:    false,
  hintsLeft:   3,
  mistakes:    0,
  maxMistakes: 3,
  timerSec:    0,
  timerInterval: null,
  difficulty:  'medium',
  paused:      false,
  gameOver:    false,
  history:     [],
};

// Snapshot of the original puzzle used by restartGame()
export const snap = { puzzle: null, solution: null, difficulty: 'medium' };

// Blank-cell counts per difficulty for the fallback generator
export const DIFF_BLANKS = { easy: 36, medium: 46, hard: 56 };
