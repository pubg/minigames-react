import React, { useEffect, useRef } from 'react';
import * as Phaser from 'phaser';
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
