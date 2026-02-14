import React, { useState, useEffect, useCallback } from 'react';
import { MinesweeperProps, Board } from './types';
import {
  createBoard,
  placeMines,
  revealCell,
  toggleFlag,
  checkWin,
  revealAllMines,
} from './gameLogic';
import './Minesweeper.css';

export const Minesweeper: React.FC<MinesweeperProps> = ({
  lines,
  rows: propRows,
  mines,
  onFinish,
}) => {
  const rows = propRows || lines;
  const [board, setBoard] = useState<Board>(() => createBoard(rows, lines));
  const [gameState, setGameState] = useState<'ready' | 'playing' | 'won' | 'lost'>('ready');
  const [startTime, setStartTime] = useState<number>(0);
  const [flagCount, setFlagCount] = useState<number>(0);

  // Reset game
  const resetGame = useCallback(() => {
    setBoard(createBoard(rows, lines));
    setGameState('ready');
    setStartTime(0);
    setFlagCount(0);
  }, [rows, lines]);

  // Handle cell click (reveal)
  const handleCellClick = useCallback(
    (row: number, col: number) => {
      if (gameState === 'won' || gameState === 'lost') return;
      if (board[row][col].isFlagged || board[row][col].isRevealed) return;

      // First click - place mines
      if (gameState === 'ready') {
        const boardWithMines = placeMines(board, mines, row, col);
        const revealedBoard = revealCell(boardWithMines, row, col);
        setBoard(revealedBoard);
        setGameState('playing');
        setStartTime(Date.now());
        return;
      }

      // Subsequent clicks
      if (board[row][col].isMine) {
        // Hit a mine - game over
        const finalBoard = revealAllMines(board);
        setBoard(finalBoard);
        setGameState('lost');
        
        if (onFinish) {
          const elapsedTime = (Date.now() - startTime) / 1000;
          onFinish({
            won: false,
            time: elapsedTime,
            score: 0,
          });
        }
      } else {
        // Safe cell - reveal
        const revealedBoard = revealCell(board, row, col);
        setBoard(revealedBoard);

        // Check win condition
        if (checkWin(revealedBoard)) {
          setGameState('won');
          
          if (onFinish) {
            const elapsedTime = (Date.now() - startTime) / 1000;
            const score = Math.max(0, Math.round(1000 - elapsedTime * 10));
            onFinish({
              won: true,
              time: elapsedTime,
              score: score,
            });
          }
        }
      }
    },
    [board, gameState, mines, onFinish, startTime]
  );

  // Handle right click (flag)
  const handleCellRightClick = useCallback(
    (e: React.MouseEvent, row: number, col: number) => {
      e.preventDefault();
      if (gameState === 'won' || gameState === 'lost') return;
      if (board[row][col].isRevealed) return;

      const flagged = board[row][col].isFlagged;
      const newBoard = toggleFlag(board, row, col);
      setBoard(newBoard);
      setFlagCount(prev => (flagged ? prev - 1 : prev + 1));
    },
    [board, gameState]
  );

  // Get cell content
  const getCellContent = (row: number, col: number): string => {
    const cell = board[row][col];
    
    if (cell.isFlagged) return '🚩';
    if (!cell.isRevealed) return '';
    if (cell.isMine) return '💣';
    if (cell.adjacentMines === 0) return '';
    return cell.adjacentMines.toString();
  };

  // Get cell class
  const getCellClass = (row: number, col: number): string => {
    const cell = board[row][col];
    const classes = ['minesweeper-cell'];
    
    if (cell.isRevealed) {
      classes.push('revealed');
      if (cell.isMine) classes.push('mine');
      else if (cell.adjacentMines > 0) classes.push(`adjacent-${cell.adjacentMines}`);
    }
    
    return classes.join(' ');
  };

  return (
    <div className="minesweeper">
      <div className="minesweeper-header">
        <div className="minesweeper-info">
          <span className="mine-count">💣 {mines - flagCount}</span>
          <button className="reset-button" onClick={resetGame}>
            {gameState === 'won' ? '😎' : gameState === 'lost' ? '😵' : '🙂'}
          </button>
        </div>
        {gameState !== 'ready' && gameState !== 'playing' && (
          <div className="game-result">
            {gameState === 'won' ? '🎉 You Won!' : '💥 Game Over!'}
          </div>
        )}
      </div>
      <div 
        className="minesweeper-board"
        style={{
          gridTemplateColumns: `repeat(${lines}, 30px)`,
          gridTemplateRows: `repeat(${rows}, 30px)`,
        }}
      >
        {board.map((row, rowIndex) =>
          row.map((_, colIndex) => (
            <div
              key={`${rowIndex}-${colIndex}`}
              className={getCellClass(rowIndex, colIndex)}
              onClick={() => handleCellClick(rowIndex, colIndex)}
              onContextMenu={(e) => handleCellRightClick(e, rowIndex, colIndex)}
            >
              {getCellContent(rowIndex, colIndex)}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
