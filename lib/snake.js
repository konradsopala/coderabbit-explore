export const DIRECTIONS = {
  UP: { x: 0, y: -1 },
  DOWN: { x: 0, y: 1 },
  LEFT: { x: -1, y: 0 },
  RIGHT: { x: 1, y: 0 },
};

export const DEFAULT_CONFIG = {
  width: 20,
  height: 20,
  startLength: 3,
  startDirection: "RIGHT",
};

export function createRng(seed = Date.now()) {
  let state = seed >>> 0;
  return function next() {
    state = (1664525 * state + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

function sameCell(a, b) {
  return a.x === b.x && a.y === b.y;
}

function isOppositeDirection(a, b) {
  return a.x + b.x === 0 && a.y + b.y === 0;
}

function inBounds(cell, width, height) {
  return cell.x >= 0 && cell.x < width && cell.y >= 0 && cell.y < height;
}

function hasCollision(snake, cell) {
  return snake.some((segment) => sameCell(segment, cell));
}

function initialSnake(config) {
  const centerY = Math.floor(config.height / 2);
  const centerX = Math.floor(config.width / 2);
  const segments = [];

  for (let i = 0; i < config.startLength; i += 1) {
    segments.push({ x: centerX - i, y: centerY });
  }

  return segments;
}

export function placeFood(snake, width, height, rng = Math.random) {
  const freeCells = [];

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const cell = { x, y };
      if (!hasCollision(snake, cell)) {
        freeCells.push(cell);
      }
    }
  }

  if (freeCells.length === 0) {
    return null;
  }

  const index = Math.floor(rng() * freeCells.length);
  return freeCells[index];
}

export function createInitialState(config = {}, rng = Math.random) {
  const merged = { ...DEFAULT_CONFIG, ...config };
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

export function setDirection(state, nextDirection) {
  if (state.status !== "running") {
    return state;
  }

  if (!nextDirection || isOppositeDirection(state.direction, nextDirection)) {
    return state;
  }

  return {
    ...state,
    pendingDirection: nextDirection,
  };
}

export function togglePause(state) {
  if (state.status !== "running") {
    return state;
  }

  return {
    ...state,
    paused: !state.paused,
  };
}

export function restart(state, rng = Math.random) {
  return createInitialState(state.config, rng);
}

export function step(state, rng = Math.random) {
  if (state.status !== "running" || state.paused) {
    return state;
  }

  const direction = state.pendingDirection;
  const currentHead = state.snake[0];
  const nextHead = {
    x: currentHead.x + direction.x,
    y: currentHead.y + direction.y,
  };

  if (!inBounds(nextHead, state.config.width, state.config.height)) {
    return {
      ...state,
      status: "game_over",
      direction,
    };
  }

  const willGrow = state.food && sameCell(nextHead, state.food);
  const bodyToCheck = willGrow ? state.snake : state.snake.slice(0, -1);

  if (hasCollision(bodyToCheck, nextHead)) {
    return {
      ...state,
      status: "game_over",
      direction,
    };
  }

  const nextSnake = [nextHead, ...state.snake];
  if (!willGrow) {
    nextSnake.pop();
  }

  if (!willGrow) {
    return {
      ...state,
      snake: nextSnake,
      direction,
    };
  }

  const food = placeFood(nextSnake, state.config.width, state.config.height, rng);
  return {
    ...state,
    snake: nextSnake,
    direction,
    food,
    score: state.score + 1,
    status: food ? "running" : "won",
  };
}
