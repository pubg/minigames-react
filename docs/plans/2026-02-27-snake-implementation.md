# Snake Game Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a Phaser-based Snake game package to the minigames-react monorepo.

**Architecture:** React wrapper component mounts a Phaser.Game instance. Game logic lives in a Phaser Scene (`GameScene`). React communicates with Phaser via game events. Package follows the same Rollup-based build as existing packages.

**Tech Stack:** Phaser 3.90, React 18, TypeScript, Rollup, pnpm workspace

---

### Task 1: Scaffold the snake package

**Files:**
- Create: `packages/snake/package.json`
- Create: `packages/snake/tsconfig.json`
- Create: `packages/snake/rollup.config.js`

**Step 1: Create `packages/snake/package.json`**

```json
{
  "name": "@minigames-react/snake",
  "version": "0.1.0",
  "description": "Snake game component for React using Phaser",
  "main": "dist/index.js",
  "module": "dist/index.esm.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "rollup -c",
    "dev": "rollup -c -w",
    "clean": "rm -rf dist"
  },
  "keywords": ["react", "snake", "game", "phaser"],
  "license": "MIT",
  "dependencies": {
    "phaser": "^3.90.0"
  },
  "peerDependencies": {
    "react": "^18.0.0",
    "react-dom": "^18.0.0"
  },
  "devDependencies": {
    "@rollup/plugin-commonjs": "^25.0.7",
    "@rollup/plugin-node-resolve": "^15.2.3",
    "@rollup/plugin-typescript": "^11.1.6",
    "@types/react": "^18.2.48",
    "@types/react-dom": "^18.2.18",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "rollup": "^4.9.6",
    "rollup-plugin-peer-deps-external": "^2.2.4",
    "rollup-plugin-postcss": "^4.0.2",
    "tslib": "^2.6.2",
    "typescript": "^5.3.3"
  },
  "files": [
    "dist"
  ]
}
```

Note: `phaser` is in `dependencies` (not peer), because it must be bundled with the package.

**Step 2: Create `packages/snake/tsconfig.json`**

Copy from `packages/dino/tsconfig.json` (identical config):

```json
{
  "compilerOptions": {
    "target": "ES2015",
    "module": "ESNext",
    "lib": ["ES2015", "DOM"],
    "jsx": "react",
    "declaration": true,
    "declarationMap": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "moduleResolution": "node",
    "resolveJsonModule": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

**Step 3: Create `packages/snake/rollup.config.js`**

Same as `packages/dino/rollup.config.js`:

```js
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import peerDepsExternal from 'rollup-plugin-peer-deps-external';
import postcss from 'rollup-plugin-postcss';

export default {
  input: 'src/index.ts',
  output: [
    {
      file: 'dist/index.js',
      format: 'cjs',
      sourcemap: true,
    },
    {
      file: 'dist/index.esm.js',
      format: 'esm',
      sourcemap: true,
    },
  ],
  plugins: [
    peerDepsExternal(),
    resolve(),
    commonjs(),
    typescript({ tsconfig: './tsconfig.json' }),
    postcss({
      extract: true,
      minimize: true,
    }),
  ],
};
```

**Step 4: Install dependencies**

Run: `cd /Users/musong/Documents/pubg/minigames-react && pnpm install`

Expected: Dependencies installed, `packages/snake/node_modules` created with `phaser`.

**Step 5: Commit**

```bash
git add packages/snake/package.json packages/snake/tsconfig.json packages/snake/rollup.config.js pnpm-lock.yaml
git commit -m "feat(snake): scaffold snake package with Phaser dependency"
```

---

### Task 2: Create types and barrel export

**Files:**
- Create: `packages/snake/src/types.ts`
- Create: `packages/snake/src/index.ts`

**Step 1: Create `packages/snake/src/types.ts`**

```typescript
export interface SnakeProps {
  /** Grid columns (default: 20) */
  cols?: number;
  /** Grid rows (default: 20) */
  rows?: number;
  /** Snake move interval in ms - lower is faster (default: 150) */
  speed?: number;
  /** Callback when game ends */
  onFinish?: (result: { score: number; time: number }) => void;
}

export type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

export interface Position {
  x: number;
  y: number;
}
```

**Step 2: Create `packages/snake/src/index.ts`**

```typescript
export { Snake } from './Snake';
export type { SnakeProps } from './types';
```

Note: This will have a TypeScript error until `Snake.tsx` is created — that's fine, we create it in the next task.

**Step 3: Commit**

```bash
git add packages/snake/src/types.ts packages/snake/src/index.ts
git commit -m "feat(snake): add types and barrel export"
```

---

### Task 3: Implement GameScene (Phaser Scene)

This is the core game logic. The Phaser Scene manages the grid, snake movement, apple spawning, collisions, and rendering.

**Files:**
- Create: `packages/snake/src/scenes/GameScene.ts`

**Step 1: Create `packages/snake/src/scenes/GameScene.ts`**

```typescript
import Phaser from 'phaser';
import { Direction, Position } from '../types';

const CELL_SIZE = 25;

const COLORS = {
  boardLight: 0xaad751,
  boardDark: 0xa2d149,
  snake: 0x4674e9,
  snakeHead: 0x3b63c7,
  apple: 0xe7471d,
  border: 0x578a34,
  textColor: '#ffffff',
  overlayBg: 0x000000,
};

const OPPOSITE: Record<Direction, Direction> = {
  UP: 'DOWN',
  DOWN: 'UP',
  LEFT: 'RIGHT',
  RIGHT: 'LEFT',
};

export class GameScene extends Phaser.Scene {
  private cols!: number;
  private rows!: number;
  private speed!: number;

  private snake!: Position[];
  private direction!: Direction;
  private nextDirection!: Direction;
  private apple!: Position;
  private score!: number;
  private gameOver!: boolean;
  private gameStarted!: boolean;
  private startTime!: number;

  private boardGraphics!: Phaser.GameObjects.Graphics;
  private snakeGraphics!: Phaser.GameObjects.Graphics;
  private appleGraphics!: Phaser.GameObjects.Graphics;
  private scoreText!: Phaser.GameObjects.Text;
  private overlayText!: Phaser.GameObjects.Text;

  private moveTimer!: Phaser.Time.TimerEvent;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private restartKey!: Phaser.Input.Keyboard.Key;

  constructor() {
    super({ key: 'GameScene' });
  }

  init(data: { cols: number; rows: number; speed: number }): void {
    this.cols = data.cols;
    this.rows = data.rows;
    this.speed = data.speed;
  }

  create(): void {
    const canvasWidth = this.cols * CELL_SIZE;
    const canvasHeight = this.rows * CELL_SIZE;

    // Draw static board
    this.boardGraphics = this.add.graphics();
    this.drawBoard();

    // Dynamic graphics layers
    this.snakeGraphics = this.add.graphics();
    this.appleGraphics = this.add.graphics();

    // Score text
    this.scoreText = this.add.text(8, 4, 'Score: 0', {
      fontSize: '14px',
      fontFamily: 'monospace',
      color: COLORS.textColor,
    }).setDepth(10);

    // Overlay text (start / game over)
    this.overlayText = this.add.text(canvasWidth / 2, canvasHeight / 2, '', {
      fontSize: '16px',
      fontFamily: 'monospace',
      color: COLORS.textColor,
      backgroundColor: 'rgba(0,0,0,0.6)',
      padding: { x: 16, y: 12 },
      align: 'center',
    }).setOrigin(0.5).setDepth(20);

    // Input
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.restartKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.R);

    this.resetGame();
  }

  private resetGame(): void {
    this.score = 0;
    this.gameOver = false;
    this.gameStarted = false;
    this.startTime = 0;

    // Snake starts at center, 3 cells long, facing right
    const centerX = Math.floor(this.cols / 2);
    const centerY = Math.floor(this.rows / 2);
    this.snake = [
      { x: centerX, y: centerY },
      { x: centerX - 1, y: centerY },
      { x: centerX - 2, y: centerY },
    ];
    this.direction = 'RIGHT';
    this.nextDirection = 'RIGHT';

    this.spawnApple();
    this.draw();

    this.scoreText.setText('Score: 0');
    this.overlayText.setText('Press Arrow Key to Start');
    this.overlayText.setVisible(true);

    // Remove existing timer if any
    if (this.moveTimer) {
      this.moveTimer.remove();
    }
  }

  update(): void {
    if (this.gameOver) {
      if (Phaser.Input.Keyboard.JustDown(this.restartKey)) {
        this.resetGame();
      }
      return;
    }

    // Read direction input
    if (Phaser.Input.Keyboard.JustDown(this.cursors.up!)) {
      this.tryChangeDirection('UP');
    } else if (Phaser.Input.Keyboard.JustDown(this.cursors.down!)) {
      this.tryChangeDirection('DOWN');
    } else if (Phaser.Input.Keyboard.JustDown(this.cursors.left!)) {
      this.tryChangeDirection('LEFT');
    } else if (Phaser.Input.Keyboard.JustDown(this.cursors.right!)) {
      this.tryChangeDirection('RIGHT');
    }
  }

  private tryChangeDirection(newDir: Direction): void {
    // Ignore reverse direction
    if (OPPOSITE[newDir] === this.direction) {
      return;
    }

    this.nextDirection = newDir;

    // Start game on first input
    if (!this.gameStarted) {
      this.gameStarted = true;
      this.startTime = Date.now();
      this.overlayText.setVisible(false);
      this.moveTimer = this.time.addEvent({
        delay: this.speed,
        callback: this.moveSnake,
        callbackScope: this,
        loop: true,
      });
    }
  }

  private moveSnake(): void {
    if (this.gameOver) return;

    this.direction = this.nextDirection;
    const head = this.snake[0];
    const newHead: Position = { ...head };

    switch (this.direction) {
      case 'UP': newHead.y -= 1; break;
      case 'DOWN': newHead.y += 1; break;
      case 'LEFT': newHead.x -= 1; break;
      case 'RIGHT': newHead.x += 1; break;
    }

    // Wall collision
    if (newHead.x < 0 || newHead.x >= this.cols || newHead.y < 0 || newHead.y >= this.rows) {
      this.endGame();
      return;
    }

    // Self collision
    if (this.snake.some(seg => seg.x === newHead.x && seg.y === newHead.y)) {
      this.endGame();
      return;
    }

    this.snake.unshift(newHead);

    // Apple collision
    if (newHead.x === this.apple.x && newHead.y === this.apple.y) {
      this.score += 1;
      this.scoreText.setText(`Score: ${this.score}`);
      this.spawnApple();
    } else {
      this.snake.pop();
    }

    this.draw();
  }

  private endGame(): void {
    this.gameOver = true;
    if (this.moveTimer) {
      this.moveTimer.remove();
    }

    const elapsedTime = this.startTime > 0 ? (Date.now() - this.startTime) / 1000 : 0;

    this.overlayText.setText(`Game Over!\nScore: ${this.score}\nPress R to restart`);
    this.overlayText.setVisible(true);

    this.game.events.emit('gameOver', {
      score: this.score,
      time: parseFloat(elapsedTime.toFixed(1)),
    });
  }

  private spawnApple(): void {
    const occupied = new Set(this.snake.map(s => `${s.x},${s.y}`));
    const available: Position[] = [];
    for (let x = 0; x < this.cols; x++) {
      for (let y = 0; y < this.rows; y++) {
        if (!occupied.has(`${x},${y}`)) {
          available.push({ x, y });
        }
      }
    }
    if (available.length === 0) {
      // Snake fills entire board — player wins, treat as game over
      this.endGame();
      return;
    }
    this.apple = available[Math.floor(Math.random() * available.length)];
  }

  private drawBoard(): void {
    this.boardGraphics.clear();
    for (let x = 0; x < this.cols; x++) {
      for (let y = 0; y < this.rows; y++) {
        const color = (x + y) % 2 === 0 ? COLORS.boardLight : COLORS.boardDark;
        this.boardGraphics.fillStyle(color);
        this.boardGraphics.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
      }
    }
  }

  private draw(): void {
    // Snake
    this.snakeGraphics.clear();
    this.snake.forEach((seg, i) => {
      const color = i === 0 ? COLORS.snakeHead : COLORS.snake;
      this.snakeGraphics.fillStyle(color);
      this.snakeGraphics.fillRect(
        seg.x * CELL_SIZE + 1,
        seg.y * CELL_SIZE + 1,
        CELL_SIZE - 2,
        CELL_SIZE - 2,
      );
    });

    // Apple
    this.appleGraphics.clear();
    this.appleGraphics.fillStyle(COLORS.apple);
    this.appleGraphics.fillCircle(
      this.apple.x * CELL_SIZE + CELL_SIZE / 2,
      this.apple.y * CELL_SIZE + CELL_SIZE / 2,
      CELL_SIZE / 2 - 2,
    );
  }
}
```

**Step 2: Commit**

```bash
git add packages/snake/src/scenes/GameScene.ts
git commit -m "feat(snake): implement Phaser GameScene with snake logic"
```

---

### Task 4: Implement React wrapper and CSS

**Files:**
- Create: `packages/snake/src/Snake.tsx`
- Create: `packages/snake/src/Snake.css`

**Step 1: Create `packages/snake/src/Snake.css`**

```css
.snake-game {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  padding: 20px;
}

.snake-controls {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  width: 100%;
}

.control-hint {
  display: flex;
  gap: 20px;
  font-size: 13px;
  color: #757575;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.control-hint span {
  padding: 4px 8px;
  background: #f5f5f5;
  border-radius: 3px;
  border: 1px solid #ddd;
}

.snake-canvas-container canvas {
  display: block;
  border: 3px solid #578a34;
  border-radius: 4px;
}
```

**Step 2: Create `packages/snake/src/Snake.tsx`**

```tsx
import React, { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import { SnakeProps } from './types';
import { GameScene } from './scenes/GameScene';
import './Snake.css';

const CELL_SIZE = 25;

export const Snake: React.FC<SnakeProps> = ({
  cols = 20,
  rows = 20,
  speed = 150,
  onFinish,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);
  const onFinishRef = useRef(onFinish);

  useEffect(() => {
    onFinishRef.current = onFinish;
  }, [onFinish]);

  useEffect(() => {
    if (!containerRef.current) return;

    const canvasWidth = cols * CELL_SIZE;
    const canvasHeight = rows * CELL_SIZE;

    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      width: canvasWidth,
      height: canvasHeight,
      parent: containerRef.current,
      backgroundColor: '#a2d149',
      scene: GameScene,
      input: {
        keyboard: true,
      },
      // Prevent Phaser from capturing all keyboard events globally
      disableContextMenu: true,
    };

    const game = new Phaser.Game(config);
    gameRef.current = game;

    // Pass props to the scene
    game.events.once('ready', () => {
      const scene = game.scene.getScene('GameScene') as GameScene;
      scene.scene.restart({ cols, rows, speed });
    });

    // Listen for game over events
    game.events.on('gameOver', (result: { score: number; time: number }) => {
      if (onFinishRef.current) {
        onFinishRef.current(result);
      }
    });

    return () => {
      game.events.off('gameOver');
      game.destroy(true);
      gameRef.current = null;
    };
  }, [cols, rows, speed]);

  return (
    <div className="snake-game">
      <div className="snake-controls">
        <div className="control-hint">
          <span>Arrow Keys to Move</span>
          <span>R to Restart</span>
        </div>
      </div>
      <div ref={containerRef} className="snake-canvas-container" />
    </div>
  );
};
```

**Step 3: Verify build compiles**

Run: `cd /Users/musong/Documents/pubg/minigames-react/packages/snake && pnpm build`

Expected: Build succeeds, `dist/` directory created with `index.js`, `index.esm.js`, `index.d.ts`, `index.css`.

**Step 4: Commit**

```bash
git add packages/snake/src/Snake.tsx packages/snake/src/Snake.css
git commit -m "feat(snake): add React wrapper component and styles"
```

---

### Task 5: Integrate into demo app

**Files:**
- Modify: `packages/demo/package.json` (add `@minigames-react/snake` dependency)
- Modify: `packages/demo/src/App.tsx` (add Snake game card)

**Step 1: Add dependency to demo `package.json`**

In `packages/demo/package.json`, add to `dependencies`:

```json
"@minigames-react/snake": "workspace:*"
```

**Step 2: Update `packages/demo/src/App.tsx`**

Add import at the top (after existing imports):

```tsx
import { Snake } from '@minigames-react/snake';
import '@minigames-react/snake/dist/index.css';
```

Add state for snake result (alongside existing state):

```tsx
const [snakeResult, setSnakeResult] = useState<{ score: number; time: number } | null>(null);
```

Add handler:

```tsx
const handleSnakeFinish = (result: { score: number; time: number }) => {
  setSnakeResult(result);
};
```

Add Snake game card inside `games-container` div, after the Dino game card:

```tsx
<div className="game-card">
  <h2>Snake</h2>

  <div className="game-info">
    <p>
      <strong>How to play:</strong>
    </p>
    <p>Use arrow keys to move the snake</p>
    <p>Eat apples to grow longer. Don't hit walls or yourself!</p>
  </div>

  <Snake cols={20} rows={20} speed={150} onFinish={handleSnakeFinish} />

  {snakeResult && (
    <div className="game-result">
      Snake Game Over! Score: {snakeResult.score} | Time: {snakeResult.time.toFixed(1)}s
    </div>
  )}
</div>
```

**Step 3: Install and build**

Run: `cd /Users/musong/Documents/pubg/minigames-react && pnpm install && pnpm build`

Expected: All packages build successfully.

**Step 4: Test the demo**

Run: `cd /Users/musong/Documents/pubg/minigames-react/packages/demo && pnpm dev`

Verify in browser:
1. Snake game card appears below Dino
2. Green checkerboard grid renders
3. Arrow keys start the game and move the snake
4. Eating apple increases score and snake length
5. Wall collision ends game
6. Self collision ends game
7. R key restarts after game over
8. `onFinish` result displays below the game

**Step 5: Commit**

```bash
git add packages/demo/package.json packages/demo/src/App.tsx pnpm-lock.yaml
git commit -m "feat(demo): integrate Snake game into demo app"
```

---

### Task 6: Final build verification and cleanup

**Step 1: Full clean build from root**

Run: `cd /Users/musong/Documents/pubg/minigames-react && pnpm clean && pnpm install && pnpm build`

Expected: All three packages build cleanly with no errors.

**Step 2: Manual play-test the demo**

Run: `cd /Users/musong/Documents/pubg/minigames-react/packages/demo && pnpm dev`

Checklist:
- [ ] Minesweeper still works correctly
- [ ] Dino game still works correctly
- [ ] Snake game renders and plays correctly
- [ ] All three games coexist without conflicts

**Step 3: Commit any final fixes if needed**
