import { state } from "./state.js";

export const boardEl = document.getElementById("board");
export const numpadEl = document.getElementById("numpad");

export let selectCell = () => {};
export function setSelectCell(fn) {
  selectCell = fn;
}

export let inputNumber = () => {};
export function setInputNumber(fn) {
  inputNumber = fn;
}

export function renderBoard() {
  boardEl.innerHTML = "";
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      const cell = document.createElement("div");
      cell.className = "cell";
      cell.dataset.r = r;
      cell.dataset.c = c;
      buildCellContent(cell, r, c);
      cell.addEventListener("click", () => {
        if (!state.paused) selectCell(r, c);
      });
      applyCellHL(cell, r, c);
      boardEl.appendChild(cell);
    }
  }
}

export function buildCellContent(cell, r, c) {
  const val = state.userBoard[r][c];
  const notes = state.notes[r][c];

  if (val !== 0) {
    cell.classList.add(state.fixed[r][c] ? "is-fixed" : "is-user");
    if (state.hintRevealed[r][c]) cell.classList.add("hint-revealed");
    const span = document.createElement("span");
    span.className = "cell-num";
    span.textContent = val;
    cell.appendChild(span);
  } else if (notes.size > 0) {
    cell.appendChild(makeNotesGrid(notes));
  }
}

export function makeNotesGrid(notes) {
  const grid = document.createElement("div");
  grid.className = "notes-grid";
  for (let n = 1; n <= 9; n++) {
    const nd = document.createElement("div");
    nd.className = "note";
    nd.textContent = notes.has(n) ? n : "";
    grid.appendChild(nd);
  }
  return grid;
}

export function applyCellHL(cell, r, c) {
  if (!state.selected) return;
  const { row, col } = state.selected;
  const selVal = state.userBoard[row][col];

  if (r === row && c === col) {
    cell.classList.add("selected");
  } else if (r === row || c === col || sameBox(r, c, row, col)) {
    cell.classList.add("highlight");
  }
  if (
    selVal !== 0 &&
    state.userBoard[r][c] === selVal &&
    !(r === row && c === col)
  ) {
    cell.classList.add("same-num");
  }
}

export function sameBox(r1, c1, r2, c2) {
  return (
    Math.floor(r1 / 3) === Math.floor(r2 / 3) &&
    Math.floor(c1 / 3) === Math.floor(c2 / 3)
  );
}

export function rerenderCell(r, c) {
  const cell = getCellEl(r, c);
  if (!cell) return;
  cell.className = "cell";
  cell.innerHTML = "";
  buildCellContent(cell, r, c);
  const val = state.userBoard[r][c];
  const isFixed = state.fixed[r][c];
  if (val !== 0 && !isFixed && val !== state.solution[r][c])
    cell.classList.add("error");
  if (val !== 0 && !isFixed && val === state.solution[r][c])
    cell.classList.add("completed");
  applyCellHL(cell, r, c);
}

export function refreshHL() {
  boardEl.querySelectorAll(".cell").forEach((cell) => {
    cell.classList.remove("selected", "highlight", "same-num");
    applyCellHL(cell, +cell.dataset.r, +cell.dataset.c);
  });
}

export function getCellEl(r, c) {
  return boardEl.querySelector(`[data-r="${r}"][data-c="${c}"]`);
}

export function renderNumpad() {
  numpadEl.innerHTML = "";
  for (let n = 1; n <= 9; n++) {
    const btn = document.createElement("button");
    btn.className = "num-btn";
    btn.dataset.n = n;
    btn.textContent = n;
    if (getRemaining(n) === 0) btn.classList.add("exhausted");
    btn.addEventListener("click", () => inputNumber(n));
    numpadEl.appendChild(btn);
  }
}

export function getRemaining(n) {
  let count = 0;
  for (let r = 0; r < 9; r++)
    for (let c = 0; c < 9; c++) if (state.userBoard[r][c] === n) count++;
  return 9 - count;
}

export function updateNumpad() {
  for (let n = 1; n <= 9; n++) {
    const btn = numpadEl.querySelector(`[data-n="${n}"]`);
    if (btn) btn.classList.toggle("exhausted", getRemaining(n) === 0);
  }
}
