# @minigames-react/dino

A Chrome Dino-style game component for React.

## Installation

```bash
npm install @minigames-react/dino
# or
pnpm add @minigames-react/dino
```

## Usage

```tsx
import { Dino } from '@minigames-react/dino';
import '@minigames-react/dino/dist/index.css';

function App() {
  const handleFinish = (result) => {
    console.log(`Game Over! Score: ${result.score}, Time: ${result.time}s`);
  };

  return (
    <div>
      <h1>Dino Game</h1>
      <Dino onFinish={handleFinish} speed={1} />
    </div>
  );
}
```

## Props

- `onFinish?: (result: { score: number; time: number }) => void` - Callback function called when the game ends
- `speed?: number` - Game speed multiplier (default: 1)

## Controls

- **Space** or **↑** - Jump
- **↓** - Duck
- **R** - Restart (when game is over)

## Features

- Classic Chrome Dino game mechanics
- Jump and duck to avoid obstacles
- Progressive difficulty
- Score tracking
- Keyboard controls
