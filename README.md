# Snake (Python)

Classic Snake rewritten in modern Python (3.13+), with a Tkinter UI and tested core game logic.

## Requirements

- Python 3.13+

## Install (dev)

```bash
python3.13 -m venv .venv
source .venv/bin/activate
pip install -e .[dev]
```

## Run

```bash
python -m snake.app
```

## Test core logic

```bash
pytest
```

## Manual verification checklist

- Arrow keys and WASD move snake in expected direction.
- Reverse-direction input is ignored.
- Eating food grows snake and increments score.
- Hitting wall or snake body triggers game over.
- Pause/resume works via button and space bar.
- Restart resets score and game state.
