from __future__ import annotations

from dataclasses import dataclass, replace
from random import Random
from typing import Callable, TypeAlias

Cell: TypeAlias = tuple[int, int]
Direction: TypeAlias = tuple[int, int]
Rng: TypeAlias = Callable[[], float]

DIRECTIONS: dict[str, Direction] = {
    "UP": (0, -1),
    "DOWN": (0, 1),
    "LEFT": (-1, 0),
    "RIGHT": (1, 0),
}


@dataclass(frozen=True)
class GameConfig:
    width: int = 20
    height: int = 20
    start_length: int = 3
    start_direction: str = "RIGHT"


DEFAULT_CONFIG = GameConfig()


@dataclass(frozen=True)
class GameState:
    config: GameConfig
    snake: tuple[Cell, ...]
    direction: Direction
    pending_direction: Direction
    food: Cell | None
    score: int
    status: str
    paused: bool


def create_rng(seed: int | None = None) -> Rng:
    rng = Random(seed)
    return rng.random


def _is_opposite_direction(a: Direction, b: Direction) -> bool:
    return a[0] + b[0] == 0 and a[1] + b[1] == 0


def _in_bounds(cell: Cell, width: int, height: int) -> bool:
    return 0 <= cell[0] < width and 0 <= cell[1] < height


def _initial_snake(config: GameConfig) -> tuple[Cell, ...]:
    center_y = config.height // 2
    center_x = config.width // 2
    return tuple((center_x - i, center_y) for i in range(config.start_length))


def place_food(snake: tuple[Cell, ...], width: int, height: int, rng: Rng | None = None) -> Cell | None:
    random = rng or Random().random
    occupied = set(snake)
    free_cells = [(x, y) for y in range(height) for x in range(width) if (x, y) not in occupied]

    if not free_cells:
        return None

    index = int(random() * len(free_cells))
    return free_cells[index]


def create_initial_state(config: GameConfig | None = None, rng: Rng | None = None) -> GameState:
    cfg = config or DEFAULT_CONFIG
    direction = DIRECTIONS[cfg.start_direction]
    snake = _initial_snake(cfg)

    return GameState(
        config=cfg,
        snake=snake,
        direction=direction,
        pending_direction=direction,
        food=place_food(snake, cfg.width, cfg.height, rng),
        score=0,
        status="running",
        paused=False,
    )


def set_direction(state: GameState, next_direction: Direction | None) -> GameState:
    if state.status != "running":
        return state

    if next_direction is None or _is_opposite_direction(state.direction, next_direction):
        return state

    return replace(state, pending_direction=next_direction)


def toggle_pause(state: GameState) -> GameState:
    if state.status != "running":
        return state
    return replace(state, paused=not state.paused)


def restart(state: GameState, rng: Rng | None = None) -> GameState:
    return create_initial_state(state.config, rng)


def step(state: GameState, rng: Rng | None = None) -> GameState:
    if state.status != "running" or state.paused:
        return state

    direction = state.pending_direction
    head_x, head_y = state.snake[0]
    next_head: Cell = (head_x + direction[0], head_y + direction[1])

    if not _in_bounds(next_head, state.config.width, state.config.height):
        return replace(state, status="game_over", direction=direction)

    will_grow = state.food == next_head
    body_to_check = state.snake if will_grow else state.snake[:-1]

    if next_head in body_to_check:
        return replace(state, status="game_over", direction=direction)

    next_snake = (next_head, *state.snake)
    if not will_grow:
        return replace(state, snake=next_snake[:-1], direction=direction)

    food = place_food(next_snake, state.config.width, state.config.height, rng)
    return replace(
        state,
        snake=next_snake,
        direction=direction,
        food=food,
        score=state.score + 1,
        status="running" if food else "won",
    )
