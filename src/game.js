import {
  DIRECTIONS,
  createInitialState,
  createRng,
  restart,
  setDirection,
  step,
  togglePause,
} from "./snake.js";

const TICK_MS = 130;
const CELL_SIZE = 20;

const board = document.querySelector("[data-board]");
const scoreEl = document.querySelector("[data-score]");
const statusEl = document.querySelector("[data-status]");
const restartBtn = document.querySelector("[data-restart]");
const pauseBtn = document.querySelector("[data-pause]");

const rng = createRng(42);
let state = createInitialState({}, rng);
let intervalId = null;

const KEY_TO_DIR = {
  ArrowUp: DIRECTIONS.UP,
  ArrowDown: DIRECTIONS.DOWN,
  ArrowLeft: DIRECTIONS.LEFT,
  ArrowRight: DIRECTIONS.RIGHT,
  w: DIRECTIONS.UP,
  W: DIRECTIONS.UP,
  s: DIRECTIONS.DOWN,
  S: DIRECTIONS.DOWN,
  a: DIRECTIONS.LEFT,
  A: DIRECTIONS.LEFT,
  d: DIRECTIONS.RIGHT,
  D: DIRECTIONS.RIGHT,
};

function isSnakeCell(x, y) {
  return state.snake.some((segment) => segment.x === x && segment.y === y);
}

function isHeadCell(x, y) {
  const head = state.snake[0];
  return head.x === x && head.y === y;
}

function isFoodCell(x, y) {
  return state.food && state.food.x === x && state.food.y === y;
}

function renderBoard() {
  board.innerHTML = "";
  board.style.gridTemplateColumns = `repeat(${state.config.width}, ${CELL_SIZE}px)`;
  board.style.gridTemplateRows = `repeat(${state.config.height}, ${CELL_SIZE}px)`;

  for (let y = 0; y < state.config.height; y += 1) {
    for (let x = 0; x < state.config.width; x += 1) {
      const cell = document.createElement("div");
      cell.className = "cell";

      if (isSnakeCell(x, y)) {
        cell.classList.add("snake");
      }
      if (isHeadCell(x, y)) {
        cell.classList.add("head");
      }
      if (isFoodCell(x, y)) {
        cell.classList.add("food");
      }

      board.appendChild(cell);
    }
  }
}

function renderHud() {
  scoreEl.textContent = String(state.score);

  if (state.status === "game_over") {
    statusEl.textContent = "Game over";
  } else if (state.status === "won") {
    statusEl.textContent = "You win";
  } else if (state.paused) {
    statusEl.textContent = "Paused";
  } else {
    statusEl.textContent = "Running";
  }

  pauseBtn.textContent = state.paused ? "Resume" : "Pause";
}

function render() {
  renderHud();
  renderBoard();
}

function tick() {
  state = step(state, rng);
  render();

  if (state.status !== "running") {
    window.clearInterval(intervalId);
    intervalId = null;
  }
}

function startLoop() {
  if (intervalId !== null) {
    return;
  }

  intervalId = window.setInterval(tick, TICK_MS);
}

function applyDirection(direction) {
  state = setDirection(state, direction);
}

document.addEventListener("keydown", (event) => {
  if (event.key === " ") {
    state = togglePause(state);
    renderHud();
    return;
  }

  const dir = KEY_TO_DIR[event.key];
  if (dir) {
    event.preventDefault();
    applyDirection(dir);
  }
});

for (const button of document.querySelectorAll("[data-dir]")) {
  button.addEventListener("click", () => {
    applyDirection(DIRECTIONS[button.dataset.dir]);
  });
}

pauseBtn.addEventListener("click", () => {
  state = togglePause(state);
  renderHud();
});

restartBtn.addEventListener("click", () => {
  state = restart(state, rng);
  render();
  startLoop();
});

render();
startLoop();
