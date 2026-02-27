import * as Phaser from 'phaser';
import { Cell, Board } from '../types';
import {
  createBoard,
  placeMines,
  revealCell,
  toggleFlag,
  checkWin,
  revealAllMines,
} from '../gameLogic';

const CELL_SIZE = 30;
const HEADER_HEIGHT = 40;

const COLORS = {
  unrevealed: 0xbdbdbd,
  unrevealedHover: 0xd0d0d0,
  revealed: 0xe0e0e0,
  border: 0x999999,
  mine: 0xff0000,
  flag: 0xff6600,
  headerBg: 0x333333,
  headerText: '#ffffff',
  numberColors: [
    '', // 0 - unused
    '#1976d2', // 1 - blue
    '#388e3c', // 2 - green
    '#d32f2f', // 3 - red
    '#7b1fa2', // 4 - purple
    '#ff8f00', // 5 - orange
    '#0097a7', // 6 - cyan
    '#424242', // 7 - black
    '#9e9e9e', // 8 - gray
  ],
};

type GameState = 'ready' | 'playing' | 'won' | 'lost';

export class GameScene extends Phaser.Scene {
  private cols!: number;
  private rows!: number;
  private mineCount!: number;

  private board!: Board;
  private state!: GameState;
  private flagCount!: number;
  private startTime!: number;

  private cellGraphics!: Phaser.GameObjects.Graphics;
  private cellTexts!: Phaser.GameObjects.Text[][];
  private headerText!: Phaser.GameObjects.Text;
  private statusText!: Phaser.GameObjects.Text;
  private overlayText!: Phaser.GameObjects.Text;
  private restartKey!: Phaser.Input.Keyboard.Key;

  constructor() {
    super({ key: 'GameScene' });
  }

  init(data: { cols: number; rows: number; mines: number }): void {
    this.cols = data.cols;
    this.rows = data.rows;
    this.mineCount = data.mines;
  }

  create(): void {
    const canvasWidth = this.cols * CELL_SIZE;
    const canvasHeight = this.rows * CELL_SIZE + HEADER_HEIGHT;

    this.cellGraphics = this.add.graphics();

    // Create text objects for each cell
    this.cellTexts = [];
    for (let r = 0; r < this.rows; r++) {
      this.cellTexts[r] = [];
      for (let c = 0; c < this.cols; c++) {
        const text = this.add.text(
          c * CELL_SIZE + CELL_SIZE / 2,
          HEADER_HEIGHT + r * CELL_SIZE + CELL_SIZE / 2,
          '',
          { fontSize: '16px', fontFamily: 'monospace', fontStyle: 'bold' }
        ).setOrigin(0.5).setDepth(5);
        this.cellTexts[r][c] = text;
      }
    }

    // Header
    this.headerText = this.add.text(8, 10, '', {
      fontSize: '16px',
      fontFamily: 'monospace',
      fontStyle: 'bold',
      color: COLORS.headerText,
    }).setDepth(10);

    this.statusText = this.add.text(canvasWidth - 8, 10, '', {
      fontSize: '16px',
      fontFamily: 'monospace',
      color: COLORS.headerText,
    }).setOrigin(1, 0).setDepth(10);

    // Overlay
    this.overlayText = this.add.text(canvasWidth / 2, HEADER_HEIGHT + (this.rows * CELL_SIZE) / 2, '', {
      fontSize: '18px',
      fontFamily: 'monospace',
      fontStyle: 'bold',
      color: '#ffffff',
      backgroundColor: 'rgba(0,0,0,0.7)',
      padding: { x: 20, y: 14 },
      align: 'center',
    }).setOrigin(0.5).setDepth(20).setVisible(false);

    // Input
    this.restartKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.R);

    // Mouse input
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      const col = Math.floor(pointer.x / CELL_SIZE);
      const row = Math.floor((pointer.y - HEADER_HEIGHT) / CELL_SIZE);

      if (row < 0 || row >= this.rows || col < 0 || col >= this.cols) return;
      if (this.state === 'won' || this.state === 'lost') return;

      if (pointer.rightButtonDown()) {
        this.handleRightClick(row, col);
      } else {
        this.handleLeftClick(row, col);
      }
    });

    // Disable context menu on canvas
    this.game.canvas.addEventListener('contextmenu', (e) => {
      e.preventDefault();
    });

    this.resetGame();
  }

  update(): void {
    if ((this.state === 'won' || this.state === 'lost') &&
        Phaser.Input.Keyboard.JustDown(this.restartKey)) {
      this.resetGame();
    }
  }

  private resetGame(): void {
    this.board = createBoard(this.rows, this.cols);
    this.state = 'ready';
    this.flagCount = 0;
    this.startTime = 0;
    this.overlayText.setVisible(false);
    this.drawBoard();
    this.updateHeader();
  }

  private handleLeftClick(row: number, col: number): void {
    const cell = this.board[row][col];
    if (cell.isFlagged || cell.isRevealed) return;

    if (this.state === 'ready') {
      this.board = placeMines(this.board, this.mineCount, row, col);
      this.board = revealCell(this.board, row, col);
      this.state = 'playing';
      this.startTime = Date.now();
      this.drawBoard();
      this.updateHeader();
      return;
    }

    if (cell.isMine) {
      this.board = revealAllMines(this.board);
      this.state = 'lost';
      this.drawBoard();
      this.showResult();
      return;
    }

    this.board = revealCell(this.board, row, col);
    this.drawBoard();

    if (checkWin(this.board)) {
      this.state = 'won';
      this.showResult();
    }
  }

  private handleRightClick(row: number, col: number): void {
    if (this.board[row][col].isRevealed) return;

    const wasFlagged = this.board[row][col].isFlagged;
    this.board = toggleFlag(this.board, row, col);
    this.flagCount += wasFlagged ? -1 : 1;
    this.drawBoard();
    this.updateHeader();
  }

  private showResult(): void {
    const elapsed = this.startTime > 0 ? (Date.now() - this.startTime) / 1000 : 0;
    const won = this.state === 'won';

    if (won) {
      this.overlayText.setText('You Won!\nPress R to restart');
    } else {
      this.overlayText.setText('Game Over!\nPress R to restart');
    }
    this.overlayText.setVisible(true);
    this.updateHeader();

    this.game.events.emit('gameOver', {
      won,
      time: parseFloat(elapsed.toFixed(1)),
      score: won ? Math.max(0, Math.round(1000 - elapsed * 10)) : 0,
    });
  }

  private updateHeader(): void {
    this.headerText.setText(`Mines: ${this.mineCount - this.flagCount}`);

    if (this.state === 'won') {
      this.statusText.setText('Won!');
    } else if (this.state === 'lost') {
      this.statusText.setText('Lost');
    } else {
      this.statusText.setText('');
    }
  }

  private drawBoard(): void {
    this.cellGraphics.clear();
    const canvasWidth = this.cols * CELL_SIZE;

    // Header background
    this.cellGraphics.fillStyle(COLORS.headerBg);
    this.cellGraphics.fillRect(0, 0, canvasWidth, HEADER_HEIGHT);

    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const cell = this.board[r][c];
        const x = c * CELL_SIZE;
        const y = HEADER_HEIGHT + r * CELL_SIZE;

        // Cell background
        if (cell.isRevealed) {
          if (cell.isMine) {
            this.cellGraphics.fillStyle(0xffcccc);
          } else {
            this.cellGraphics.fillStyle(COLORS.revealed);
          }
        } else {
          this.cellGraphics.fillStyle(COLORS.unrevealed);
        }
        this.cellGraphics.fillRect(x + 1, y + 1, CELL_SIZE - 2, CELL_SIZE - 2);

        // 3D border effect for unrevealed cells
        if (!cell.isRevealed) {
          this.cellGraphics.fillStyle(0xffffff);
          this.cellGraphics.fillRect(x, y, CELL_SIZE, 2);
          this.cellGraphics.fillRect(x, y, 2, CELL_SIZE);
          this.cellGraphics.fillStyle(0x808080);
          this.cellGraphics.fillRect(x, y + CELL_SIZE - 2, CELL_SIZE, 2);
          this.cellGraphics.fillRect(x + CELL_SIZE - 2, y, 2, CELL_SIZE);
        } else {
          // Subtle border for revealed cells
          this.cellGraphics.lineStyle(1, COLORS.border, 0.3);
          this.cellGraphics.strokeRect(x, y, CELL_SIZE, CELL_SIZE);
        }

        // Cell content
        const textObj = this.cellTexts[r][c];
        if (cell.isFlagged) {
          textObj.setText('F');
          textObj.setColor('#ff3300');
        } else if (cell.isRevealed && cell.isMine) {
          textObj.setText('*');
          textObj.setColor('#000000');
        } else if (cell.isRevealed && cell.adjacentMines > 0) {
          textObj.setText(cell.adjacentMines.toString());
          textObj.setColor(COLORS.numberColors[cell.adjacentMines] || '#000000');
        } else {
          textObj.setText('');
        }
      }
    }
  }
}
