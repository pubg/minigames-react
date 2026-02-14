import React, { useEffect, useRef, useState, useCallback } from 'react';
import { DinoProps } from './types';
import {
  createInitialState,
  updateGameState,
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  GROUND_HEIGHT,
  JUMP_STRENGTH,
} from './gameLogic';
import './Dino.css';

export const Dino: React.FC<DinoProps> = ({ onFinish, speed = 1 }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState(createInitialState());
  const [startTime, setStartTime] = useState<number>(0);
  const velocityYRef = useRef(0);
  const animationFrameRef = useRef<number>();
  const keysPressed = useRef<Set<string>>(new Set());
  const gameStateRef = useRef(gameState);
  const onFinishRef = useRef(onFinish);
  const startTimeRef = useRef(startTime);
  const onFinishCalledRef = useRef(false);

  // Update refs when state changes
  useEffect(() => {
    gameStateRef.current = gameState;
    onFinishRef.current = onFinish;
    startTimeRef.current = startTime;
  }, [gameState, onFinish, startTime]);

  // Reset game
  const resetGame = useCallback(() => {
    setGameState(createInitialState());
    velocityYRef.current = 0;
    setStartTime(0);
    keysPressed.current.clear();
    onFinishCalledRef.current = false;
  }, []);

  // Start game
  const startGame = useCallback(() => {
    if (!gameState.gameStarted && !gameState.gameOver) {
      setGameState(prev => ({ ...prev, gameStarted: true }));
      setStartTime(Date.now());
    }
  }, [gameState.gameStarted, gameState.gameOver]);

  // Jump
  const jump = useCallback(() => {
    if (!gameState.gameOver && !gameState.isJumping) {
      if (!gameState.gameStarted) {
        startGame();
      }
      setGameState(prev => ({ ...prev, isJumping: true }));
      velocityYRef.current = JUMP_STRENGTH;
    }
  }, [gameState.gameOver, gameState.isJumping, gameState.gameStarted, startGame]);

  // Duck
  const setDucking = useCallback((ducking: boolean) => {
    if (!gameState.gameOver) {
      if (!gameState.gameStarted && ducking) {
        startGame();
      }
      setGameState(prev => ({ ...prev, isDucking: ducking }));
    }
  }, [gameState.gameOver, gameState.gameStarted, startGame]);

  // Handle keyboard input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        if (!keysPressed.current.has(e.code)) {
          keysPressed.current.add(e.code);
          jump();
        }
      } else if (e.code === 'ArrowDown') {
        e.preventDefault();
        keysPressed.current.add(e.code);
        setDucking(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'ArrowDown') {
        e.preventDefault();
        keysPressed.current.delete(e.code);
        setDucking(false);
      } else if (e.code === 'Space' || e.code === 'ArrowUp') {
        keysPressed.current.delete(e.code);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [jump, setDucking]);

  // Game loop
  useEffect(() => {
    const gameLoop = () => {
      const currentState = gameStateRef.current;
      
      if (currentState.gameOver) {
        const currentOnFinish = onFinishRef.current;
        const currentStartTime = startTimeRef.current;
        if (currentOnFinish && currentStartTime > 0 && !onFinishCalledRef.current) {
          onFinishCalledRef.current = true;
          const elapsedTime = (Date.now() - currentStartTime) / 1000;
          currentOnFinish({
            score: currentState.score,
            time: elapsedTime,
          });
        }
        return;
      }

      if (!currentState.gameStarted) {
        animationFrameRef.current = requestAnimationFrame(gameLoop);
        return;
      }

      const { newState, newVelocityY } = updateGameState(
        currentState,
        velocityYRef.current,
        speed
      );
      velocityYRef.current = newVelocityY;
      setGameState(newState);
      animationFrameRef.current = requestAnimationFrame(gameLoop);
    };

    animationFrameRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [speed]); // Only depend on speed which is a prop

  // Render game
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = '#f7f7f7';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw ground
    ctx.strokeStyle = '#535353';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, GROUND_HEIGHT);
    ctx.lineTo(CANVAS_WIDTH, GROUND_HEIGHT);
    ctx.stroke();

    // Draw dino
    ctx.fillStyle = '#535353';
    if (gameState.isDucking && !gameState.isJumping) {
      // Ducking dino (rectangular)
      ctx.fillRect(
        gameState.dino.x,
        gameState.dino.y,
        gameState.dino.width,
        gameState.dino.height
      );
    } else {
      // Standing/jumping dino (simplified T-Rex shape)
      ctx.fillRect(
        gameState.dino.x,
        gameState.dino.y,
        gameState.dino.width,
        gameState.dino.height
      );
      // Head
      ctx.fillRect(
        gameState.dino.x + 25,
        gameState.dino.y - 10,
        15,
        15
      );
    }

    // Draw obstacles
    gameState.obstacles.forEach(obstacle => {
      ctx.fillStyle = obstacle.type === 'cactus' ? '#535353' : '#666';
      if (obstacle.type === 'cactus') {
        // Draw cactus
        ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
      } else {
        // Draw bird (simplified)
        ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
        // Wings
        ctx.fillRect(obstacle.x - 5, obstacle.y + 5, 10, 3);
        ctx.fillRect(obstacle.x + obstacle.width - 5, obstacle.y + 5, 10, 3);
      }
    });

    // Draw score
    ctx.fillStyle = '#535353';
    ctx.font = '20px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(`Score: ${Math.floor(gameState.score)}`, CANVAS_WIDTH - 20, 30);

    // Draw game over message
    if (gameState.gameOver) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      ctx.fillStyle = '#fff';
      ctx.font = '40px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('GAME OVER', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);
      ctx.font = '20px monospace';
      ctx.fillText(`Score: ${Math.floor(gameState.score)}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
      ctx.fillText('Press R to restart', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 50);
    } else if (!gameState.gameStarted) {
      ctx.fillStyle = '#535353';
      ctx.font = '20px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('Press SPACE or ↑ to start', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
    }
  }, [gameState]);

  // Handle restart
  useEffect(() => {
    const handleRestart = (e: KeyboardEvent) => {
      if (e.code === 'KeyR' && gameState.gameOver) {
        e.preventDefault();
        resetGame();
      }
    };

    window.addEventListener('keydown', handleRestart);
    return () => window.removeEventListener('keydown', handleRestart);
  }, [gameState.gameOver, resetGame]);

  return (
    <div className="dino-game">
      <div className="dino-controls">
        <div className="control-hint">
          <span>⬆️ Jump (Space/↑)</span>
          <span>⬇️ Duck (↓)</span>
        </div>
        {gameState.gameOver && (
          <button className="restart-button" onClick={resetGame}>
            Restart Game
          </button>
        )}
      </div>
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        className="dino-canvas"
      />
    </div>
  );
};
