/* Snake game — client-side logic (ported from Next.js React component). */

const DIRECTIONS = {
  UP: { x: 0, y: -1 },
  DOWN: { x: 0, y: 1 },
  LEFT: { x: -1, y: 0 },
  RIGHT: { x: 1, y: 0 },
};

const DEFAULT_CONFIG = { width: 20, height: 20, startLength: 3, startDirection: "RIGHT" };
const TICK_MS = 130;

/* --- RNG ----------------------------------------------------------------- */

function createRng(seed) {
  let state = seed >>> 0;
  return function next() {
    state = (1664525 * state + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

/* --- Helpers -------------------------------------------------------------- */

function sameCell(a, b) { return a.x === b.x && a.y === b.y; }
function isOppositeDirection(a, b) { return a.x + b.x === 0 && a.y + b.y === 0; }
function inBounds(cell, w, h) { return cell.x >= 0 && cell.x < w && cell.y >= 0 && cell.y < h; }
function hasCollision(snake, cell) { return snake.some(s => sameCell(s, cell)); }

function initialSnake(config) {
  const cy = Math.floor(config.height / 2);
  const cx = Math.floor(config.width / 2);
  const segs = [];
  for (let i = 0; i < config.startLength; i++) segs.push({ x: cx - i, y: cy });
  return segs;
}

function placeFood(snake, w, h, rng) {
  const free = [];
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const c = { x, y };
      if (!hasCollision(snake, c)) free.push(c);
    }
  if (free.length === 0) return null;
  return free[Math.floor(rng() * free.length)];
}

/* --- State functions ------------------------------------------------------ */

function createInitialState(config, rng) {
  const merged = Object.assign({}, DEFAULT_CONFIG, config);
  const snake = initialSnake(merged);
  const direction = DIRECTIONS[merged.startDirection];
  return {
    config: merged,
    snake,
    direction,
    pendingDirection: direction,
    food: placeFood(snake, merged.width, merged.height, rng),
    score: 0,
    status: "running",
    paused: false,
  };
}

function setDirection(state, dir) {
  if (state.status !== "running") return state;
  if (!dir || isOppositeDirection(state.direction, dir)) return state;
  return Object.assign({}, state, { pendingDirection: dir });
}

function togglePause(state) {
  if (state.status !== "running") return state;
  return Object.assign({}, state, { paused: !state.paused });
}

function restart(state, rng) { return createInitialState(state.config, rng); }

function step(state, rng) {
  if (state.status !== "running" || state.paused) return state;
  const direction = state.pendingDirection;
  const head = state.snake[0];
  const nextHead = { x: head.x + direction.x, y: head.y + direction.y };

  if (!inBounds(nextHead, state.config.width, state.config.height))
    return Object.assign({}, state, { status: "game_over", direction });

  const willGrow = state.food && sameCell(nextHead, state.food);
  const bodyCheck = willGrow ? state.snake : state.snake.slice(0, -1);
  if (hasCollision(bodyCheck, nextHead))
    return Object.assign({}, state, { status: "game_over", direction });

  const nextSnake = [nextHead, ...state.snake];
  if (!willGrow) nextSnake.pop();
  if (!willGrow)
    return Object.assign({}, state, { snake: nextSnake, direction });

  const food = placeFood(nextSnake, state.config.width, state.config.height, rng);
  return Object.assign({}, state, {
    snake: nextSnake, direction, food,
    score: state.score + 1,
    status: food ? "running" : "won",
  });
}

/* --- Status label -------------------------------------------------------- */

function getStatusLabel(s) {
  if (s.status === "game_over") return "Game over";
  if (s.status === "won") return "You win";
  if (s.paused) return "Paused";
  return "Running";
}

/* --- Rendering ----------------------------------------------------------- */

const board = document.getElementById("board");
const scoreEl = document.getElementById("score");
const statusEl = document.getElementById("status");
const btnPause = document.getElementById("btn-pause");
const btnRestart = document.getElementById("btn-restart");

const rng = createRng(42);
let state = createInitialState({}, rng);

function render() {
  board.style.gridTemplateColumns = `repeat(${state.config.width}, 20px)`;
  board.style.gridTemplateRows = `repeat(${state.config.height}, 20px)`;
  board.innerHTML = "";

  for (let y = 0; y < state.config.height; y++) {
    for (let x = 0; x < state.config.width; x++) {
      const div = document.createElement("div");
      div.className = "cell";
      if (state.snake.some(s => s.x === x && s.y === y)) div.className += " snake";
      if (state.snake[0].x === x && state.snake[0].y === y) div.className += " head";
      if (state.food && state.food.x === x && state.food.y === y) div.className += " food";
      board.appendChild(div);
    }
  }

  scoreEl.textContent = state.score;
  statusEl.textContent = getStatusLabel(state);
  btnPause.textContent = state.paused ? "Resume" : "Pause";
}

/* --- Game loop ----------------------------------------------------------- */

let intervalId = null;

function startLoop() {
  stopLoop();
  if (state.status !== "running" || state.paused) return;
  intervalId = setInterval(() => {
    state = step(state, rng);
    render();
    if (state.status !== "running") stopLoop();
  }, TICK_MS);
}

function stopLoop() {
  if (intervalId !== null) { clearInterval(intervalId); intervalId = null; }
}

/* --- Keyboard ------------------------------------------------------------ */

const KEY_TO_DIR = {
  ArrowUp: DIRECTIONS.UP, ArrowDown: DIRECTIONS.DOWN,
  ArrowLeft: DIRECTIONS.LEFT, ArrowRight: DIRECTIONS.RIGHT,
  w: DIRECTIONS.UP, W: DIRECTIONS.UP,
  s: DIRECTIONS.DOWN, S: DIRECTIONS.DOWN,
  a: DIRECTIONS.LEFT, A: DIRECTIONS.LEFT,
  d: DIRECTIONS.RIGHT, D: DIRECTIONS.RIGHT,
};

document.addEventListener("keydown", (e) => {
  if (e.key === " ") {
    e.preventDefault();
    state = togglePause(state);
    render();
    state.paused ? stopLoop() : startLoop();
    return;
  }
  const dir = KEY_TO_DIR[e.key];
  if (dir) { e.preventDefault(); state = setDirection(state, dir); }
});

/* --- Buttons ------------------------------------------------------------- */

btnPause.addEventListener("click", () => {
  state = togglePause(state);
  render();
  state.paused ? stopLoop() : startLoop();
});

btnRestart.addEventListener("click", () => {
  state = restart(state, rng);
  render();
  startLoop();
});

document.getElementById("btn-up").addEventListener("click", () => { state = setDirection(state, DIRECTIONS.UP); });
document.getElementById("btn-down").addEventListener("click", () => { state = setDirection(state, DIRECTIONS.DOWN); });
document.getElementById("btn-left").addEventListener("click", () => { state = setDirection(state, DIRECTIONS.LEFT); });
document.getElementById("btn-right").addEventListener("click", () => { state = setDirection(state, DIRECTIONS.RIGHT); });

/* --- Init ---------------------------------------------------------------- */

render();
startLoop();
