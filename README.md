# Snake (Next.js)

Classic Snake rewritten as a minimal Next.js app.

## Install

```bash
npm install
```

## Run (dev)

```bash
npm run dev
```

Navigate to <http://localhost:3000>.

## Test core logic

```bash
npm test
```

## Manual verification checklist

- Arrow keys and WASD move snake in expected direction.
- On-screen buttons move snake correctly on mobile/touch.
- Reverse-direction input is ignored.
- Eating food grows snake and increments score.
- Hitting wall or snake body triggers game over.
- Pause/resume works via button and space bar.
- Restart resets score and game state.
