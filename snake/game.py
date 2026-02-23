"""Core snake game logic — pure functions with no side effects."""

from __future__ import annotations

import math
from dataclasses import dataclass, field
from typing import Callable, Optional

# ---------------------------------------------------------------------------
# Directions
# ---------------------------------------------------------------------------

DIRECTIONS: dict[str, dict[str, int]] = {
    "UP": {"x": 0, "y": -1},
    "DOWN": {"x": 0, "y": 1},
    "LEFT": {"x": -1, "y": 0},
    "RIGHT": {"x": 1, "y": 0},
}

DEFAULT_CONFIG: dict[str, int | str] = {
    "width": 20,
    "height": 20,
    "start_length": 3,
    "start_direction": "RIGHT",
}

# ---------------------------------------------------------------------------
# RNG
# ---------------------------------------------------------------------------

RngFn = Callable[[], float]


def create_rng(seed: int = 42) -> RngFn:
    """Linear congruential RNG for deterministic food placement."""
    state = [seed & 0xFFFFFFFF]

    def next_val() -> float:
        state[0] = (1664525 * state[0] + 1013904223) & 0xFFFFFFFF
        return state[0] / 0x100000000

    return next_val


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def same_cell(a: dict, b: dict) -> bool:
    return a["x"] == b["x"] and a["y"] == b["y"]


def is_opposite_direction(a: dict, b: dict) -> bool:
    return a["x"] + b["x"] == 0 and a["y"] + b["y"] == 0


def in_bounds(cell: dict, width: int, height: int) -> bool:
    return 0 <= cell["x"] < width and 0 <= cell["y"] < height


def has_collision(snake: list[dict], cell: dict) -> bool:
    return any(same_cell(seg, cell) for seg in snake)


def _initial_snake(config: dict) -> list[dict]:
    center_y = config["height"] // 2
    center_x = config["width"] // 2
    return [{"x": center_x - i, "y": center_y} for i in range(config["start_length"])]


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def place_food(
    snake: list[dict], width: int, height: int, rng: RngFn = None
) -> Optional[dict]:
    """Find all free cells and randomly place food on one."""
    if rng is None:
        import random
        rng = random.random

    free_cells: list[dict] = []
    for y in range(height):
        for x in range(width):
            cell = {"x": x, "y": y}
            if not has_collision(snake, cell):
                free_cells.append(cell)

    if not free_cells:
        return None

    index = math.floor(rng() * len(free_cells))
    return free_cells[index]


def create_initial_state(config: dict | None = None, rng: RngFn = None) -> dict:
    """Create a fresh game state."""
    merged = {**DEFAULT_CONFIG, **(config or {})}
    snake = _initial_snake(merged)
    direction = DIRECTIONS[merged["start_direction"]]

    return {
        "config": merged,
        "snake": snake,
        "direction": direction,
        "pending_direction": direction,
        "food": place_food(snake, merged["width"], merged["height"], rng),
        "score": 0,
        "status": "running",
        "paused": False,
    }


def set_direction(state: dict, next_direction: dict | None) -> dict:
    """Set a new pending direction (rejects opposite directions)."""
    if state["status"] != "running":
        return state
    if not next_direction or is_opposite_direction(state["direction"], next_direction):
        return state
    return {**state, "pending_direction": next_direction}


def toggle_pause(state: dict) -> dict:
    """Toggle pause/resume."""
    if state["status"] != "running":
        return state
    return {**state, "paused": not state["paused"]}


def restart(state: dict, rng: RngFn = None) -> dict:
    """Restart the game with the same config."""
    return create_initial_state(state["config"], rng)


def step(state: dict, rng: RngFn = None) -> dict:
    """Advance the game by one tick."""
    if state["status"] != "running" or state["paused"]:
        return state

    direction = state["pending_direction"]
    current_head = state["snake"][0]
    next_head = {
        "x": current_head["x"] + direction["x"],
        "y": current_head["y"] + direction["y"],
    }

    # Wall collision
    if not in_bounds(next_head, state["config"]["width"], state["config"]["height"]):
        return {**state, "status": "game_over", "direction": direction}

    will_grow = state["food"] is not None and same_cell(next_head, state["food"])
    body_to_check = state["snake"] if will_grow else state["snake"][:-1]

    # Self collision
    if has_collision(body_to_check, next_head):
        return {**state, "status": "game_over", "direction": direction}

    next_snake = [next_head] + list(state["snake"])
    if not will_grow:
        next_snake.pop()

    if not will_grow:
        return {**state, "snake": next_snake, "direction": direction}

    food = place_food(next_snake, state["config"]["width"], state["config"]["height"], rng)
    return {
        **state,
        "snake": next_snake,
        "direction": direction,
        "food": food,
        "score": state["score"] + 1,
        "status": "running" if food else "won",
    }
