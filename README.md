# Snake (Classic)

A minimal classic Snake implementation with no external dependencies.

## Run

```bash
npm run start
```

Then open <http://localhost:5173>.

## Test

```bash
npm test
```

## Manual verification checklist

- Arrow keys and WASD move snake in expected direction.
- Reverse-direction input is ignored (cannot instantly turn into itself).
- Eating food grows snake and increments score.
- Hitting wall or snake body triggers game over.
- Pause/resume works via button and space bar.
- Restart resets score, state, and starts a new loop.
