import React, { useState } from 'react';
import { Minesweeper } from '@minigames-react/minesweeper';
import '@minigames-react/minesweeper/dist/index.css';
import './App.css';

interface GameResult {
  won: boolean;
  time: number;
  score: number;
}

type Difficulty = 'easy' | 'medium' | 'hard';

interface DifficultyConfig {
  lines: number;
  rows: number;
  mines: number;
}

const difficulties: Record<Difficulty, DifficultyConfig> = {
  easy: { lines: 8, rows: 8, mines: 10 },
  medium: { lines: 16, rows: 16, mines: 40 },
  hard: { lines: 30, rows: 16, mines: 99 },
};

function App() {
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [gameResult, setGameResult] = useState<GameResult | null>(null);
  const [key, setKey] = useState(0);

  const config = difficulties[difficulty];

  const handleFinish = (result: GameResult) => {
    setGameResult(result);
  };

  const handleDifficultyChange = (newDifficulty: Difficulty) => {
    setDifficulty(newDifficulty);
    setGameResult(null);
    setKey(prev => prev + 1);
  };

  return (
    <div className="app">
      <div className="app-header">
        <h1>🎮 Minigames React</h1>
        <p>A collection of classic mini-games built with React</p>
      </div>
      
      <div className="games-container">
        <div className="game-card">
          <h2>💣 Minesweeper</h2>
          
          <div className="difficulty-selector">
            <button
              className={`difficulty-button ${difficulty === 'easy' ? 'active' : ''}`}
              onClick={() => handleDifficultyChange('easy')}
            >
              Easy (8×8, 10 mines)
            </button>
            <button
              className={`difficulty-button ${difficulty === 'medium' ? 'active' : ''}`}
              onClick={() => handleDifficultyChange('medium')}
            >
              Medium (16×16, 40 mines)
            </button>
            <button
              className={`difficulty-button ${difficulty === 'hard' ? 'active' : ''}`}
              onClick={() => handleDifficultyChange('hard')}
            >
              Hard (30×16, 99 mines)
            </button>
          </div>

          <div className="game-info">
            <p>
              <strong>How to play:</strong>
            </p>
            <p>Left click to reveal, right click to flag</p>
            <p>Reveal all safe cells to win!</p>
          </div>

          <Minesweeper
            key={key}
            lines={config.lines}
            rows={config.rows}
            mines={config.mines}
            onFinish={handleFinish}
          />

          {gameResult && (
            <div className={`game-result ${gameResult.won ? '' : 'lost'}`}>
              {gameResult.won ? (
                <>
                  🎉 You Won! Score: {gameResult.score} | Time: {gameResult.time.toFixed(1)}s
                </>
              ) : (
                <>
                  💥 Game Over! Try again!
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
