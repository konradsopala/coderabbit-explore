"""Unit tests for the snake game logic."""

import unittest

from snake.game import (
    DIRECTIONS,
    create_initial_state,
    place_food,
    set_direction,
    step,
)


def constant_rng(value: float):
    """Return an RNG that always yields the same value."""
    return lambda: value


class TestSnake(unittest.TestCase):
    def test_snake_moves_one_cell_in_current_direction(self):
        state = create_initial_state({"width": 10, "height": 10, "start_length": 3}, constant_rng(0))
        next_state = step(state, constant_rng(0))

        self.assertEqual(next_state["snake"][0]["x"], state["snake"][0]["x"] + 1)
        self.assertEqual(next_state["snake"][0]["y"], state["snake"][0]["y"])
        self.assertEqual(len(next_state["snake"]), len(state["snake"]))

    def test_snake_grows_and_increments_score_when_eating_food(self):
        state = create_initial_state({"width": 8, "height": 8, "start_length": 2}, constant_rng(0))
        forced = {
            **state,
            "food": {"x": state["snake"][0]["x"] + 1, "y": state["snake"][0]["y"]},
        }

        next_state = step(forced, constant_rng(0))

        self.assertEqual(len(next_state["snake"]), len(forced["snake"]) + 1)
        self.assertEqual(next_state["score"], forced["score"] + 1)
        self.assertIsNotNone(next_state["food"])

    def test_wall_collision_ends_the_game(self):
        base = create_initial_state({"width": 4, "height": 4, "start_length": 2}, constant_rng(0))
        state = {
            **base,
            "snake": [{"x": 3, "y": 1}, {"x": 2, "y": 1}],
            "direction": DIRECTIONS["RIGHT"],
            "pending_direction": DIRECTIONS["RIGHT"],
        }

        next_state = step(state, constant_rng(0))

        self.assertEqual(next_state["status"], "game_over")

    def test_self_collision_ends_the_game(self):
        base = create_initial_state({"width": 8, "height": 8, "start_length": 4}, constant_rng(0))
        state = {
            **base,
            "snake": [
                {"x": 3, "y": 3},
                {"x": 3, "y": 2},
                {"x": 2, "y": 2},
                {"x": 2, "y": 3},
                {"x": 2, "y": 4},
                {"x": 3, "y": 4},
            ],
            "direction": DIRECTIONS["UP"],
            "pending_direction": DIRECTIONS["LEFT"],
        }

        next_state = step(state, constant_rng(0))

        self.assertEqual(next_state["status"], "game_over")

    def test_cannot_reverse_direction_directly(self):
        state = create_initial_state({}, constant_rng(0))
        next_state = set_direction(state, DIRECTIONS["LEFT"])

        self.assertEqual(next_state["pending_direction"], state["pending_direction"])

    def test_food_placement_never_returns_an_occupied_cell(self):
        snake = [
            {"x": 0, "y": 0},
            {"x": 1, "y": 0},
            {"x": 2, "y": 0},
        ]
        food = place_food(snake, 4, 4, constant_rng(0))

        self.assertIsNotNone(food)
        self.assertFalse(
            any(seg["x"] == food["x"] and seg["y"] == food["y"] for seg in snake)
        )


if __name__ == "__main__":
    unittest.main()
