# Snake Game Design

## Overview

Add a Snake game package to the minigames-react monorepo using Phaser as the game framework. The package follows the same structure and conventions as existing packages (minesweeper, dino).

## Component API

```typescript
interface SnakeProps {
  /** Grid columns (default: 20) */
  cols?: number;
  /** Grid rows (default: 20) */
  rows?: number;
  /** Snake move interval in ms - lower is faster (default: 150) */
  speed?: number;
  /** Callback when game ends */
  onFinish?: (result: { score: number; time: number }) => void;
}
```

Usage:
```tsx
<Snake cols={20} rows={20} speed={150} onFinish={(r) => console.log(r)} />
```

## Architecture

### File Structure

```
packages/snake/
├── package.json          # @minigames-react/snake
├── rollup.config.js      # Same as existing packages
├── tsconfig.json
├── src/
│   ├── index.ts          # export { Snake } + export type { SnakeProps }
│   ├── types.ts          # SnakeProps, Direction, etc.
│   ├── Snake.tsx          # React wrapper (mounts Phaser instance)
│   ├── Snake.css          # Container styling
│   └── scenes/
│       └── GameScene.ts   # Phaser Scene with game logic
```

### React ↔ Phaser Integration

- `Snake.tsx` creates a `Phaser.Game` instance inside a `useEffect`, mounting it to a `div` container
- On unmount, calls `game.destroy()` to clean up
- Props changes trigger game recreation
- Communication: Phaser emits `gameOver` event → React listens and calls `onFinish`

## Game Logic (GameScene.ts)

### Grid System
- Logical grid of `cols x rows` cells
- Each cell is `cellSize` pixels (default 25px)
- Canvas size = `cols * cellSize` x `rows * cellSize`

### Snake
- Represented as `{x, y}[]` array (head = index 0)
- Moves every `speed` ms using Phaser's `time.addEvent`
- Movement: add new head cell in current direction, remove tail
- Eating apple: keep tail (snake grows by 1), spawn new apple

### Controls
- Arrow keys for direction change
- Reverse direction input ignored (e.g., can't go left while moving right)
- R key to restart after game over

### Game Over Conditions
- Wall collision (head goes out of bounds)
- Self collision (head overlaps body)

### Scoring
- Each apple eaten = +1 score
- `onFinish` returns `{ score, time }` where time is seconds survived

## Rendering (Phaser Graphics)

- Grid background: light checkerboard pattern
- Snake body: green rectangles
- Apple: red circle
- Score/status: Phaser Text objects inside the canvas
- Game over overlay with score and restart prompt

## Build & Integration

### Dependencies
- `phaser` as a regular dependency (bundled with the package)
- Same `peerDependencies` as other packages: `react ^18.0.0`, `react-dom ^18.0.0`
- Same Rollup config/plugins as existing packages

### Demo App
- Add Snake game card to `packages/demo/src/App.tsx`
- Same UI pattern as Minesweeper/Dino (game-card, game-info, result display)

### Workspace
- `pnpm-workspace.yaml` already covers `packages/*` — auto-discovered
