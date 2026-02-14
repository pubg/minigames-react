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
            score: Math.floor(currentState.score),
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

  // Helper function to draw T-Rex
  const drawDino = (ctx: CanvasRenderingContext2D, x: number, y: number, isDucking: boolean, frame: number) => {
    ctx.fillStyle = '#535353';
    
    if (isDucking) {
      // Ducking T-Rex - lower profile
      // Body
      ctx.fillRect(x + 6, y + 18, 32, 14);
      // Tail
      ctx.fillRect(x, y + 20, 6, 4);
      // Head
      ctx.fillRect(x + 32, y + 14, 10, 8);
      ctx.fillRect(x + 38, y + 14, 4, 4);
      // Eye
      ctx.fillRect(x + 38, y + 14, 2, 2);
      // Front leg
      ctx.fillRect(x + 30, y + 28, 4, 4);
      // Back leg
      ctx.fillRect(x + 18, y + 28, 4, 4);
    } else {
      // Standing/Jumping T-Rex
      // Tail
      ctx.fillRect(x, y + 16, 4, 4);
      ctx.fillRect(x + 4, y + 12, 4, 8);
      
      // Body
      ctx.fillRect(x + 8, y + 8, 16, 16);
      
      // Neck
      ctx.fillRect(x + 22, y + 4, 6, 12);
      
      // Head
      ctx.fillRect(x + 28, y, 12, 10);
      ctx.fillRect(x + 32, y + 10, 8, 4);
      
      // Eye
      ctx.fillRect(x + 34, y + 2, 2, 2);
      
      // Mouth detail
      ctx.fillRect(x + 38, y + 6, 2, 2);
      
      // Legs - alternate for running animation
      const legFrame = Math.floor(frame / 5) % 2;
      if (legFrame === 0) {
        // Front leg forward
        ctx.fillRect(x + 20, y + 24, 4, 6);
        ctx.fillRect(x + 20, y + 30, 6, 2);
        // Back leg back
        ctx.fillRect(x + 10, y + 24, 4, 4);
        ctx.fillRect(x + 8, y + 28, 6, 2);
      } else {
        // Front leg back
        ctx.fillRect(x + 20, y + 24, 4, 4);
        ctx.fillRect(x + 18, y + 28, 6, 2);
        // Back leg forward
        ctx.fillRect(x + 10, y + 24, 4, 6);
        ctx.fillRect(x + 10, y + 30, 6, 2);
      }
      
      // Arm
      ctx.fillRect(x + 22, y + 12, 4, 4);
    }
  };

  // Helper function to draw cactus
  const drawCactus = (ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number) => {
    ctx.fillStyle = '#535353';
    
    // Main stem
    const stemWidth = 8;
    const stemX = x + (width - stemWidth) / 2;
    ctx.fillRect(stemX, y, stemWidth, height);
    
    // Add arms if cactus is tall enough
    if (height > 30) {
      // Left arm
      ctx.fillRect(stemX - 6, y + height * 0.3, 6, 3);
      ctx.fillRect(stemX - 6, y + height * 0.3, 3, height * 0.3);
      
      // Right arm (if wide enough)
      if (width > 16) {
        ctx.fillRect(stemX + stemWidth, y + height * 0.4, 6, 3);
        ctx.fillRect(stemX + stemWidth + 3, y + height * 0.4, 3, height * 0.25);
      }
    }
  };

  // Helper function to draw pterodactyl
  const drawPterodactyl = (ctx: CanvasRenderingContext2D, x: number, y: number, frame: number) => {
    ctx.fillStyle = '#535353';
    
    // Body
    ctx.fillRect(x + 6, y + 4, 16, 8);
    
    // Head
    ctx.fillRect(x + 20, y + 2, 8, 6);
    ctx.fillRect(x + 26, y + 4, 4, 4);
    
    // Beak
    ctx.fillRect(x + 28, y + 6, 4, 2);
    
    // Eye
    ctx.fillRect(x + 24, y + 4, 2, 2);
    
    // Tail
    ctx.fillRect(x, y + 6, 6, 4);
    ctx.fillRect(x - 4, y + 8, 4, 2);
    
    // Wings - flapping animation
    const wingFrame = Math.floor(frame / 8) % 2;
    if (wingFrame === 0) {
      // Wings up
      ctx.fillRect(x + 6, y, 12, 4);
      ctx.fillRect(x + 6, y + 12, 12, 4);
    } else {
      // Wings down
      ctx.fillRect(x + 6, y - 2, 12, 4);
      ctx.fillRect(x + 6, y + 14, 12, 4);
    }
  };

  // Animation frame counter
  const frameCountRef = useRef(0);

  // Render game
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    frameCountRef.current++;

    // Clear canvas with white background (Chrome style)
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw ground with dashed line
    ctx.strokeStyle = '#535353';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, GROUND_HEIGHT);
    ctx.lineTo(CANVAS_WIDTH, GROUND_HEIGHT);
    ctx.stroke();
    
    // Draw ground dots/texture
    ctx.fillStyle = '#535353';
    for (let i = 0; i < CANVAS_WIDTH; i += 20) {
      ctx.fillRect(i, GROUND_HEIGHT + 2, 2, 2);
    }

    // Draw dino
    drawDino(
      ctx,
      gameState.dino.x,
      gameState.dino.y,
      gameState.isDucking && !gameState.isJumping,
      gameState.gameStarted ? frameCountRef.current : 0
    );

    // Draw obstacles
    gameState.obstacles.forEach(obstacle => {
      if (obstacle.type === 'cactus') {
        drawCactus(ctx, obstacle.x, obstacle.y, obstacle.width, obstacle.height);
      } else {
        drawPterodactyl(ctx, obstacle.x, obstacle.y, frameCountRef.current);
      }
    });

    // Draw score (Chrome style)
    ctx.fillStyle = '#535353';
    ctx.font = 'bold 16px monospace';
    ctx.textAlign = 'right';
    const score = Math.floor(gameState.score);
    const scoreText = ('00000' + score).slice(-5);
    ctx.fillText(scoreText, CANVAS_WIDTH - 20, 30);

    // Draw game over message (Chrome style)
    if (gameState.gameOver) {
      ctx.fillStyle = '#535353';
      ctx.font = 'bold 24px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('G A M E  O V E R', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 10);
      
      // Draw restart icon (simple arrow)
      const iconX = CANVAS_WIDTH / 2 - 20;
      const iconY = CANVAS_HEIGHT / 2 + 15;
      ctx.fillRect(iconX, iconY, 16, 16);
      ctx.fillStyle = '#fff';
      ctx.fillRect(iconX + 4, iconY + 4, 8, 8);
      ctx.fillStyle = '#535353';
      ctx.font = '12px monospace';
      ctx.fillText('Press R to restart', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 50);
    } else if (!gameState.gameStarted) {
      // Draw start message more subtly
      ctx.fillStyle = '#535353';
      ctx.font = '14px monospace';
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
