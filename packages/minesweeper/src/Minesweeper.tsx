import React, { useEffect, useRef } from 'react';
import * as Phaser from 'phaser';
import { MinesweeperProps } from './types';
import { GameScene } from './scenes/GameScene';
import './Minesweeper.css';

const CELL_SIZE = 30;
const HEADER_HEIGHT = 50;
const PADDING = 8;
const BORDER = 3;

export const Minesweeper: React.FC<MinesweeperProps> = ({
  lines,
  rows: propRows,
  mines,
  onFinish,
}) => {
  const rows = propRows || lines;
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);
  const onFinishRef = useRef(onFinish);

  useEffect(() => {
    onFinishRef.current = onFinish;
  }, [onFinish]);

  useEffect(() => {
    if (!containerRef.current) return;

    const canvasWidth = (PADDING + BORDER) * 2 + lines * CELL_SIZE;
    const canvasHeight = PADDING * 2 + HEADER_HEIGHT + BORDER * 2 + rows * CELL_SIZE;

    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      width: canvasWidth,
      height: canvasHeight,
      parent: containerRef.current,
      backgroundColor: '#c0c0c0',
      input: {
        keyboard: true,
      },
      disableContextMenu: true,
    };

    const game = new Phaser.Game(config);
    gameRef.current = game;

    game.events.once('ready', () => {
      game.scene.add('GameScene', GameScene, true, { cols: lines, rows, mines });
    });

    game.events.on('gameOver', (result: { won: boolean; time: number; score: number }) => {
      if (onFinishRef.current) {
        onFinishRef.current(result);
      }
    });

    return () => {
      game.events.off('gameOver');
      game.destroy(true);
      gameRef.current = null;
    };
  }, [lines, rows, mines]);

  return (
    <div className="minesweeper">
      <div className="minesweeper-controls">
        <div className="control-hint">
          <span>Left Click to Reveal</span>
          <span>Right Click to Flag</span>
          <span>R to Restart</span>
        </div>
      </div>
      <div ref={containerRef} className="minesweeper-canvas-container" />
    </div>
  );
};
