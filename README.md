# minigames-react

A monorepo containing various mini-games implemented as React components.

## 📦 Packages

- **[@minigames-react/minesweeper](./packages/minesweeper)** - Classic Minesweeper game component
- **[@minigames-react/demo](./packages/demo)** - Demo site showcasing all games

## 🚀 Getting Started

### Installation

```bash
pnpm install
```

### Build

```bash
pnpm build
```

### Development

To run the demo site in development mode:

```bash
cd packages/demo
pnpm dev
```

## 🎮 Available Games

### Minesweeper

A classic mine-sweeping puzzle game with customizable board size and difficulty.

```tsx
import { Minesweeper } from '@minigames-react/minesweeper';

<Minesweeper
  lines={10}
  rows={10}
  mines={15}
  onFinish={(result) => console.log(result)}
/>
```

## 🔜 Coming Soon

- **Dino Game** - Chrome's offline dinosaur game

## 📄 License

MIT