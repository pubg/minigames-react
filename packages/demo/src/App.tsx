import React, { useState } from 'react';
import { Minesweeper } from '@minigames-react/minesweeper';
import '@minigames-react/minesweeper/dist/index.css';
import { Dino } from '@minigames-react/dino';
import '@minigames-react/dino/dist/index.css';
import { Snake } from '@minigames-react/snake';
import '@minigames-react/snake/dist/index.css';
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

type GameTab = 'minesweeper' | 'dino' | 'snake';

function App() {
  const [activeTab, setActiveTab] = useState<GameTab>('minesweeper');
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [gameResult, setGameResult] = useState<GameResult | null>(null);
  const [dinoResult, setDinoResult] = useState<{ score: number; time: number } | null>(null);
  const [snakeResult, setSnakeResult] = useState<{ score: number; time: number } | null>(null);
  const [key, setKey] = useState(0);

  const config = difficulties[difficulty];

  const handleFinish = (result: GameResult) => {
    setGameResult(result);
  };

  const handleDinoFinish = (result: { score: number; time: number }) => {
    setDinoResult(result);
  };

  const handleSnakeFinish = (result: { score: number; time: number }) => {
    setSnakeResult(result);
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
      
      <div className="tab-bar">
        <button
          className={`tab-button ${activeTab === 'minesweeper' ? 'active' : ''}`}
          onClick={() => setActiveTab('minesweeper')}
        >
          Minesweeper
        </button>
        <button
          className={`tab-button ${activeTab === 'dino' ? 'active' : ''}`}
          onClick={() => setActiveTab('dino')}
        >
          Dino Game
        </button>
        <button
          className={`tab-button ${activeTab === 'snake' ? 'active' : ''}`}
          onClick={() => setActiveTab('snake')}
        >
          Snake
        </button>
      </div>

      <div className="games-container">
        {activeTab === 'minesweeper' && (
          <div className="game-card">
            <h2>Minesweeper</h2>

            <div className="difficulty-selector">
              <button
                className={`difficulty-button ${difficulty === 'easy' ? 'active' : ''}`}
                onClick={() => handleDifficultyChange('easy')}
              >
                Easy (8x8, 10 mines)
              </button>
              <button
                className={`difficulty-button ${difficulty === 'medium' ? 'active' : ''}`}
                onClick={() => handleDifficultyChange('medium')}
              >
                Medium (16x16, 40 mines)
              </button>
              <button
                className={`difficulty-button ${difficulty === 'hard' ? 'active' : ''}`}
                onClick={() => handleDifficultyChange('hard')}
              >
                Hard (30x16, 99 mines)
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
                    You Won! Score: {gameResult.score} | Time: {gameResult.time.toFixed(1)}s
                  </>
                ) : (
                  <>
                    Game Over! Try again!
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'dino' && (
          <div className="game-card">
            <h2>Dino Game</h2>

            <div className="game-info">
              <p>
                <strong>How to play:</strong>
              </p>
              <p>Press SPACE or ↑ to jump, ↓ to duck</p>
              <p>Avoid obstacles and survive as long as you can!</p>
            </div>

            <Dino onFinish={handleDinoFinish} speed={1} />

            {dinoResult && (
              <div className="game-result">
                Game Over! Score: {Math.floor(dinoResult.score)} | Time: {dinoResult.time.toFixed(1)}s
              </div>
            )}
          </div>
        )}

        {activeTab === 'snake' && (
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
                Game Over! Score: {snakeResult.score} | Time: {snakeResult.time.toFixed(1)}s
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
