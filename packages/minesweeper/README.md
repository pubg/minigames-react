# @minigames-react/minesweeper

A Minesweeper game component for React.

## Installation

```bash
npm install @minigames-react/minesweeper
# or
yarn add @minigames-react/minesweeper
# or
pnpm add @minigames-react/minesweeper
```

## Usage

```tsx
import { Minesweeper } from '@minigames-react/minesweeper';

function App() {
  const handleFinish = (result) => {
    console.log('Game finished!', result);
    // result: { won: boolean, time: number, score: number }
  };

  return (
    <Minesweeper
      lines={10}      // Number of columns
      rows={10}       // Number of rows (optional, defaults to lines)
      mines={15}      // Number of mines
      onFinish={handleFinish}  // Callback when game ends
    />
  );
}
```

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `lines` | `number` | Yes | Number of horizontal cells (columns) |
| `rows` | `number` | No | Number of vertical cells (rows). Defaults to `lines` if not provided |
| `mines` | `number` | Yes | Number of mines to place on the board |
| `onFinish` | `(result: GameResult) => void` | No | Callback function called when the game ends |

### GameResult

```typescript
interface GameResult {
  won: boolean;    // Whether the player won the game
  time: number;    // Time taken in seconds
  score: number;   // Final score (higher is better)
}
```

## How to Play

- **Left click**: Reveal a cell
- **Right click**: Flag a cell as a potential mine
- **Objective**: Reveal all cells that don't contain mines

## License

MIT
