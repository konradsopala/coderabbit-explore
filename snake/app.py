from __future__ import annotations

import tkinter as tk
from tkinter import ttk

from .game import (
    DIRECTIONS,
    GameConfig,
    create_initial_state,
    create_rng,
    restart,
    set_direction,
    step,
    toggle_pause,
)

TICK_MS = 130
CELL_SIZE = 24

KEY_TO_DIR = {
    "Up": DIRECTIONS["UP"],
    "Down": DIRECTIONS["DOWN"],
    "Left": DIRECTIONS["LEFT"],
    "Right": DIRECTIONS["RIGHT"],
    "w": DIRECTIONS["UP"],
    "W": DIRECTIONS["UP"],
    "s": DIRECTIONS["DOWN"],
    "S": DIRECTIONS["DOWN"],
    "a": DIRECTIONS["LEFT"],
    "A": DIRECTIONS["LEFT"],
    "d": DIRECTIONS["RIGHT"],
    "D": DIRECTIONS["RIGHT"],
}


class SnakeApp:
    def __init__(self) -> None:
        self.rng = create_rng(42)
        self.state = create_initial_state(GameConfig(), self.rng)

        self.root = tk.Tk()
        self.root.title("Snake (Python)")
        self.root.resizable(False, False)

        self.score_var = tk.StringVar(value="Score: 0")
        self.status_var = tk.StringVar(value="Status: Running")

        hud = ttk.Frame(self.root, padding=12)
        hud.grid(row=0, column=0, sticky="ew")
        ttk.Label(hud, textvariable=self.score_var).grid(row=0, column=0, sticky="w")
        ttk.Label(hud, textvariable=self.status_var).grid(row=0, column=1, padx=(24, 0), sticky="e")

        width_px = self.state.config.width * CELL_SIZE
        height_px = self.state.config.height * CELL_SIZE
        self.canvas = tk.Canvas(self.root, width=width_px, height=height_px, bg="#ffffff", highlightthickness=1)
        self.canvas.grid(row=1, column=0, padx=12)

        buttons = ttk.Frame(self.root, padding=12)
        buttons.grid(row=2, column=0, sticky="ew")
        self.pause_btn = ttk.Button(buttons, text="Pause", command=self._toggle_pause)
        self.pause_btn.grid(row=0, column=0, padx=(0, 8))
        ttk.Button(buttons, text="Restart", command=self._restart).grid(row=0, column=1)

        hint = ttk.Label(self.root, text="Keyboard: arrows/WASD to move, space to pause")
        hint.grid(row=3, column=0, pady=(0, 12))

        self.root.bind("<KeyPress>", self._on_key)
        self._draw()

    def _on_key(self, event: tk.Event) -> None:
        if event.keysym == "space":
            self._toggle_pause()
            return

        direction = KEY_TO_DIR.get(event.keysym) or KEY_TO_DIR.get(event.char)
        if direction:
            self.state = set_direction(self.state, direction)

    def _toggle_pause(self) -> None:
        self.state = toggle_pause(self.state)
        self._update_hud()

    def _restart(self) -> None:
        self.state = restart(self.state, self.rng)
        self._draw()

    def _tick(self) -> None:
        self.state = step(self.state, self.rng)
        self._draw()
        self.root.after(TICK_MS, self._tick)

    def _update_hud(self) -> None:
        self.score_var.set(f"Score: {self.state.score}")
        self.status_var.set(f"Status: {self._status_label()}")
        self.pause_btn.config(text="Resume" if self.state.paused else "Pause")

    def _status_label(self) -> str:
        if self.state.status == "game_over":
            return "Game over"
        if self.state.status == "won":
            return "You win"
        if self.state.paused:
            return "Paused"
        return "Running"

    def _draw(self) -> None:
        self.canvas.delete("all")
        c = self.state.config
        snake_cells = set(self.state.snake)
        for y in range(c.height):
            for x in range(c.width):
                x0, y0 = x * CELL_SIZE, y * CELL_SIZE
                x1, y1 = x0 + CELL_SIZE, y0 + CELL_SIZE
                fill = "#ffffff"
                if self.state.food == (x, y):
                    fill = "#d32f2f"
                if (x, y) in snake_cells:
                    fill = "#2f7d32"
                if self.state.snake[0] == (x, y):
                    fill = "#1b5e20"
                self.canvas.create_rectangle(x0, y0, x1, y1, fill=fill, outline="#d1d1d1")

        self._update_hud()

    def run(self) -> None:
        self.root.after(TICK_MS, self._tick)
        self.root.mainloop()


def main() -> None:
    SnakeApp().run()


if __name__ == "__main__":
    main()
