import test from "node:test";
import assert from "node:assert/strict";

import {
  DIRECTIONS,
  createInitialState,
  placeFood,
  setDirection,
  step,
} from "../lib/snake.js";

function constantRng(value) {
  return () => value;
}

test("snake moves one cell in current direction", () => {
  const state = createInitialState({ width: 10, height: 10, startLength: 3 }, constantRng(0));
  const next = step(state, constantRng(0));

  assert.equal(next.snake[0].x, state.snake[0].x + 1);
  assert.equal(next.snake[0].y, state.snake[0].y);
  assert.equal(next.snake.length, state.snake.length);
});

test("snake grows and increments score when eating food", () => {
  const state = createInitialState({ width: 8, height: 8, startLength: 2 }, constantRng(0));
  const forced = {
    ...state,
    food: { x: state.snake[0].x + 1, y: state.snake[0].y },
  };

  const next = step(forced, constantRng(0));

  assert.equal(next.snake.length, forced.snake.length + 1);
  assert.equal(next.score, forced.score + 1);
  assert.notEqual(next.food, null);
});

test("wall collision ends the game", () => {
  const state = {
    ...createInitialState({ width: 4, height: 4, startLength: 2 }, constantRng(0)),
    snake: [{ x: 3, y: 1 }, { x: 2, y: 1 }],
    direction: DIRECTIONS.RIGHT,
    pendingDirection: DIRECTIONS.RIGHT,
  };

  const next = step(state, constantRng(0));

  assert.equal(next.status, "game_over");
});

test("self collision ends the game", () => {
  const state = {
    ...createInitialState({ width: 8, height: 8, startLength: 4 }, constantRng(0)),
    snake: [
      { x: 3, y: 3 },
      { x: 3, y: 2 },
      { x: 2, y: 2 },
      { x: 2, y: 3 },
      { x: 2, y: 4 },
      { x: 3, y: 4 },
    ],
    direction: DIRECTIONS.UP,
    pendingDirection: DIRECTIONS.LEFT,
  };

  const next = step(state, constantRng(0));

  assert.equal(next.status, "game_over");
});

test("cannot reverse direction directly", () => {
  const state = createInitialState({}, constantRng(0));
  const next = setDirection(state, DIRECTIONS.LEFT);

  assert.equal(next.pendingDirection, state.pendingDirection);
});

test("food placement never returns an occupied snake cell", () => {
  const snake = [
    { x: 0, y: 0 },
    { x: 1, y: 0 },
    { x: 2, y: 0 },
  ];
  const food = placeFood(snake, 4, 4, constantRng(0));

  assert.ok(food);
  assert.equal(snake.some((segment) => segment.x === food.x && segment.y === food.y), false);
});
