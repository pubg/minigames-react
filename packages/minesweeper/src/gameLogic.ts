import { Board } from './types';

/**
 * Creates an empty game board
 */
export function createBoard(rows: number, cols: number): Board {
  return Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => ({
      isMine: false,
      isRevealed: false,
      isFlagged: false,
      adjacentMines: 0,
    }))
  );
}

/**
 * Places mines randomly on the board
 */
export function placeMines(
  board: Board,
  numMines: number,
  firstClickRow: number,
  firstClickCol: number
): Board {
  const rows = board.length;
  const cols = board[0].length;
  const newBoard = board.map(row => row.map(cell => ({ ...cell })));
  
  let minesPlaced = 0;
  const maxAttempts = rows * cols * 10; // Prevent infinite loop
  let attempts = 0;
  
  while (minesPlaced < numMines && attempts < maxAttempts) {
    attempts++;
    const row = Math.floor(Math.random() * rows);
    const col = Math.floor(Math.random() * cols);
    
    // Don't place mine on first click or if already has mine
    if (
      (row === firstClickRow && col === firstClickCol) ||
      newBoard[row][col].isMine
    ) {
      continue;
    }
    
    newBoard[row][col].isMine = true;
    minesPlaced++;
  }
  
  // Calculate adjacent mines for each cell
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      if (!newBoard[row][col].isMine) {
        newBoard[row][col].adjacentMines = countAdjacentMines(newBoard, row, col);
      }
    }
  }
  
  return newBoard;
}

/**
 * Counts the number of mines adjacent to a cell
 */
function countAdjacentMines(board: Board, row: number, col: number): number {
  const rows = board.length;
  const cols = board[0].length;
  let count = 0;
  
  for (let r = Math.max(0, row - 1); r <= Math.min(rows - 1, row + 1); r++) {
    for (let c = Math.max(0, col - 1); c <= Math.min(cols - 1, col + 1); c++) {
      if (r === row && c === col) continue;
      if (board[r][c].isMine) count++;
    }
  }
  
  return count;
}

/**
 * Reveals a cell and recursively reveals adjacent cells if no adjacent mines
 */
export function revealCell(board: Board, row: number, col: number): Board {
  const rows = board.length;
  const cols = board[0].length;
  const newBoard = board.map(row => row.map(cell => ({ ...cell })));
  
  // Use iterative approach with a queue to avoid deep recursion
  const queue: [number, number][] = [[row, col]];
  
  while (queue.length > 0) {
    const [r, c] = queue.shift()!;
    
    if (
      r < 0 ||
      r >= rows ||
      c < 0 ||
      c >= cols ||
      newBoard[r][c].isRevealed ||
      newBoard[r][c].isFlagged
    ) {
      continue;
    }
    
    newBoard[r][c].isRevealed = true;
    
    // If no adjacent mines, add adjacent cells to queue
    if (newBoard[r][c].adjacentMines === 0 && !newBoard[r][c].isMine) {
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue;
          queue.push([r + dr, c + dc]);
        }
      }
    }
  }
  
  return newBoard;
}

/**
 * Toggles the flag state of a cell
 */
export function toggleFlag(board: Board, row: number, col: number): Board {
  const newBoard = board.map(row => row.map(cell => ({ ...cell })));
  
  if (!newBoard[row][col].isRevealed) {
    newBoard[row][col].isFlagged = !newBoard[row][col].isFlagged;
  }
  
  return newBoard;
}

/**
 * Checks if the game is won (all non-mine cells revealed)
 */
export function checkWin(board: Board): boolean {
  for (let row of board) {
    for (let cell of row) {
      if (!cell.isMine && !cell.isRevealed) {
        return false;
      }
    }
  }
  return true;
}

/**
 * Reveals all mines (used when game is lost)
 */
export function revealAllMines(board: Board): Board {
  return board.map(row =>
    row.map(cell => ({
      ...cell,
      isRevealed: cell.isMine ? true : cell.isRevealed,
    }))
  );
}
