export interface MinesweeperProps {
  /**
   * Number of horizontal cells
   */
  lines: number;
  
  /**
   * Number of vertical cells (defaults to lines if not provided)
   */
  rows?: number;
  
  /**
   * Number of mines to place on the board
   */
  mines: number;
  
  /**
   * Callback function called when the game ends
   * @param result - Object containing game result information
   * @param result.won - Whether the player won
   * @param result.time - Time taken in seconds
   * @param result.score - Final score
   */
  onFinish?: (result: { won: boolean; time: number; score: number }) => void;
}

export interface Cell {
  isMine: boolean;
  isRevealed: boolean;
  isFlagged: boolean;
  adjacentMines: number;
}

export type Board = Cell[][];
