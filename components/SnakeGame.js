"use client";

import { useEffect, useMemo, useState } from "react";
import {
  DIRECTIONS,
  createInitialState,
  createRng,
  restart,
  setDirection,
  step,
  togglePause,
} from "../lib/snake";

const TICK_MS = 130;

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

export default function SnakeGame() {
  const rng = useMemo(() => createRng(42), []);
  const [state, setState] = useState(() => createInitialState({}, rng));

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === " ") {
        event.preventDefault();
        setState((prev) => togglePause(prev));
        return;
      }

      const dir = KEY_TO_DIR[event.key];
      if (!dir) {
        return;
      }

      event.preventDefault();
      setState((prev) => setDirection(prev, dir));
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (state.status !== "running") {
      return undefined;
    }

    const id = window.setInterval(() => {
      setState((prev) => step(prev, rng));
    }, TICK_MS);

    return () => window.clearInterval(id);
  }, [state.status, state.paused, rng]);

  const cells = [];
  for (let y = 0; y < state.config.height; y += 1) {
    for (let x = 0; x < state.config.width; x += 1) {
      const isSnake = state.snake.some((segment) => segment.x === x && segment.y === y);
      const isHead = state.snake[0].x === x && state.snake[0].y === y;
      const isFood = state.food && state.food.x === x && state.food.y === y;

      let className = "cell";
      if (isSnake) className += " snake";
      if (isHead) className += " head";
      if (isFood) className += " food";

      cells.push(<div key={`${x}-${y}`} className={className} />);
    }
  }

  return (
    <main className="app">
      <header className="hud">
        <p>
          Score: <span>{state.score}</span>
        </p>
        <p>
          Status: <span>{getStatusLabel(state)}</span>
        </p>
      </header>

      <section
        className="board"
        style={{
          gridTemplateColumns: `repeat(${state.config.width}, 20px)`,
          gridTemplateRows: `repeat(${state.config.height}, 20px)`,
        }}
        aria-label="Snake game board"
      >
        {cells}
      </section>

      <section className="actions">
        <button type="button" onClick={() => setState((prev) => togglePause(prev))}>
          {state.paused ? "Resume" : "Pause"}
        </button>
        <button type="button" onClick={() => setState((prev) => restart(prev, rng))}>
          Restart
        </button>
      </section>

      <section className="controls" aria-label="Direction controls">
        <button type="button" onClick={() => setState((prev) => setDirection(prev, DIRECTIONS.UP))}>
          Up
        </button>
        <div>
          <button type="button" onClick={() => setState((prev) => setDirection(prev, DIRECTIONS.LEFT))}>
            Left
          </button>
          <button type="button" onClick={() => setState((prev) => setDirection(prev, DIRECTIONS.DOWN))}>
            Down
          </button>
          <button type="button" onClick={() => setState((prev) => setDirection(prev, DIRECTIONS.RIGHT))}>
            Right
          </button>
        </div>
      </section>

      <p className="hint">Keyboard: arrows/WASD, space to pause.</p>
    </main>
  );
}

function getStatusLabel(state) {
  if (state.status === "game_over") return "Game over";
  if (state.status === "won") return "You win";
  if (state.paused) return "Paused";
  return "Running";
}
