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
const HEADER_HEIGHT = 50;
const PADDING = 8;
const BORDER = 3;

// Classic Windows Minesweeper color palette
const COLORS = {
  bg: 0xc0c0c0,
  borderLight: 0xffffff,
  borderDark: 0x808080,
  revealedBg: 0xc0c0c0,
  mineBg: 0xff0000,
  counterBg: 0x000000,
  counterText: '#ff0000',
  numberColors: [
    '',         // 0
    '#0000ff',  // 1 - blue
    '#008000',  // 2 - green
    '#ff0000',  // 3 - red
    '#000080',  // 4 - dark blue
    '#800000',  // 5 - maroon
    '#008080',  // 6 - teal
    '#000000',  // 7 - black
    '#808080',  // 8 - gray
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

  private graphics!: Phaser.GameObjects.Graphics;
  private cellTexts!: Phaser.GameObjects.Text[][];
  private mineCounterText!: Phaser.GameObjects.Text;
  private faceText!: Phaser.GameObjects.Text;
  private overlayText!: Phaser.GameObjects.Text;
  private restartKey!: Phaser.Input.Keyboard.Key;

  // Board area offset (after padding + header)
  private boardOffsetX!: number;
  private boardOffsetY!: number;

  constructor() {
    super({ key: 'GameScene' });
  }

  init(data: { cols: number; rows: number; mines: number }): void {
    this.cols = data.cols;
    this.rows = data.rows;
    this.mineCount = data.mines;
  }

  create(): void {
    this.boardOffsetX = PADDING + BORDER;
    this.boardOffsetY = PADDING + HEADER_HEIGHT + BORDER;

    this.graphics = this.add.graphics();

    // Cell text objects
    this.cellTexts = [];
    for (let r = 0; r < this.rows; r++) {
      this.cellTexts[r] = [];
      for (let c = 0; c < this.cols; c++) {
        const text = this.add.text(
          this.boardOffsetX + c * CELL_SIZE + CELL_SIZE / 2,
          this.boardOffsetY + r * CELL_SIZE + CELL_SIZE / 2,
          '',
          { fontSize: '14px', fontFamily: 'monospace', fontStyle: 'bold' }
        ).setOrigin(0.5).setDepth(5);
        this.cellTexts[r][c] = text;
      }
    }

    // Mine counter (left side of header) — red digits on black background
    this.mineCounterText = this.add.text(
      PADDING + BORDER + 6,
      PADDING + 8,
      '',
      {
        fontSize: '24px',
        fontFamily: '"Courier New", monospace',
        fontStyle: 'bold',
        color: COLORS.counterText,
        backgroundColor: '#000000',
        padding: { x: 4, y: 2 },
      }
    ).setDepth(10);

    // Face button (center of header)
    const canvasWidth = (PADDING + BORDER) * 2 + this.cols * CELL_SIZE;
    this.faceText = this.add.text(
      canvasWidth / 2,
      PADDING + HEADER_HEIGHT / 2,
      '',
      { fontSize: '24px' }
    ).setOrigin(0.5).setDepth(10).setInteractive({ useHandCursor: true });

    this.faceText.on('pointerdown', () => {
      this.resetGame();
    });

    // Overlay text
    const boardCenterX = this.boardOffsetX + (this.cols * CELL_SIZE) / 2;
    const boardCenterY = this.boardOffsetY + (this.rows * CELL_SIZE) / 2;
    this.overlayText = this.add.text(boardCenterX, boardCenterY, '', {
      fontSize: '16px',
      fontFamily: 'monospace',
      fontStyle: 'bold',
      color: '#ffffff',
      backgroundColor: 'rgba(0,0,0,0.75)',
      padding: { x: 16, y: 12 },
      align: 'center',
    }).setOrigin(0.5).setDepth(20).setVisible(false);

    // Keyboard
    this.restartKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.R);

    // Mouse input
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      const col = Math.floor((pointer.x - this.boardOffsetX) / CELL_SIZE);
      const row = Math.floor((pointer.y - this.boardOffsetY) / CELL_SIZE);

      if (row < 0 || row >= this.rows || col < 0 || col >= this.cols) return;
      if (this.state === 'won' || this.state === 'lost') return;

      if (pointer.rightButtonDown()) {
        this.handleRightClick(row, col);
      } else {
        this.handleLeftClick(row, col);
      }
    });

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
    this.drawAll();
  }

  private handleLeftClick(row: number, col: number): void {
    const cell = this.board[row][col];
    if (cell.isFlagged || cell.isRevealed) return;

    if (this.state === 'ready') {
      this.board = placeMines(this.board, this.mineCount, row, col);
      this.board = revealCell(this.board, row, col);
      this.state = 'playing';
      this.startTime = Date.now();
      this.drawAll();
      return;
    }

    if (cell.isMine) {
      this.board = revealAllMines(this.board);
      this.state = 'lost';
      this.drawAll();
      this.showResult();
      return;
    }

    this.board = revealCell(this.board, row, col);
    this.drawAll();

    if (checkWin(this.board)) {
      this.state = 'won';
      this.drawAll();
      this.showResult();
    }
  }

  private handleRightClick(row: number, col: number): void {
    if (this.board[row][col].isRevealed) return;

    const wasFlagged = this.board[row][col].isFlagged;
    this.board = toggleFlag(this.board, row, col);
    this.flagCount += wasFlagged ? -1 : 1;
    this.drawAll();
  }

  private showResult(): void {
    const elapsed = this.startTime > 0 ? (Date.now() - this.startTime) / 1000 : 0;
    const won = this.state === 'won';

    this.overlayText.setText(won
      ? 'You Won!\nPress R to restart'
      : 'Game Over!\nPress R to restart'
    );
    this.overlayText.setVisible(true);

    this.game.events.emit('gameOver', {
      won,
      time: parseFloat(elapsed.toFixed(1)),
      score: won ? Math.max(0, Math.round(1000 - elapsed * 10)) : 0,
    });
  }

  // ─── Rendering ──────────────────────────────────────────

  private drawAll(): void {
    this.graphics.clear();

    const boardW = this.cols * CELL_SIZE;
    const boardH = this.rows * CELL_SIZE;
    const canvasW = (PADDING + BORDER) * 2 + boardW;
    const canvasH = PADDING * 2 + HEADER_HEIGHT + BORDER * 2 + boardH;

    // Outer background
    this.graphics.fillStyle(COLORS.bg);
    this.graphics.fillRect(0, 0, canvasW, canvasH);

    // Outer 3D raised border
    this.draw3DBorder(0, 0, canvasW, canvasH, BORDER, true);

    // Header area — sunken panel
    const headerInnerX = PADDING + BORDER;
    const headerInnerY = PADDING;
    const headerInnerW = boardW;
    const headerInnerH = HEADER_HEIGHT - BORDER;
    this.draw3DBorder(headerInnerX - 2, headerInnerY, headerInnerW + 4, headerInnerH, 2, false);

    // Header content
    const remaining = this.mineCount - this.flagCount;
    const str = String(remaining);
    this.mineCounterText.setText(('000' + str).slice(-3));

    if (this.state === 'won') {
      this.faceText.setText('😎');
    } else if (this.state === 'lost') {
      this.faceText.setText('😵');
    } else {
      this.faceText.setText('🙂');
    }

    // Board area — sunken panel
    this.draw3DBorder(this.boardOffsetX - BORDER, this.boardOffsetY - BORDER,
      boardW + BORDER * 2, boardH + BORDER * 2, BORDER, false);

    // Draw cells
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        this.drawCell(r, c);
      }
    }
  }

  private drawCell(r: number, c: number): void {
    const cell = this.board[r][c];
    const x = this.boardOffsetX + c * CELL_SIZE;
    const y = this.boardOffsetY + r * CELL_SIZE;
    const textObj = this.cellTexts[r][c];

    if (cell.isRevealed) {
      // Revealed cell — flat with thin border
      if (cell.isMine) {
        this.graphics.fillStyle(COLORS.mineBg);
      } else {
        this.graphics.fillStyle(COLORS.revealedBg);
      }
      this.graphics.fillRect(x, y, CELL_SIZE, CELL_SIZE);
      this.graphics.lineStyle(1, COLORS.borderDark, 0.4);
      this.graphics.strokeRect(x, y, CELL_SIZE, CELL_SIZE);

      // Content
      if (cell.isMine) {
        textObj.setText('💣');
        textObj.setFontSize(16);
        textObj.setColor('#000000');
      } else if (cell.adjacentMines > 0) {
        textObj.setText(cell.adjacentMines.toString());
        textObj.setFontSize(16);
        textObj.setColor(COLORS.numberColors[cell.adjacentMines] || '#000000');
      } else {
        textObj.setText('');
      }
    } else {
      // Unrevealed cell — raised 3D button look
      this.graphics.fillStyle(COLORS.bg);
      this.graphics.fillRect(x, y, CELL_SIZE, CELL_SIZE);
      this.draw3DBorder(x, y, CELL_SIZE, CELL_SIZE, 2, true);

      if (cell.isFlagged) {
        textObj.setText('🚩');
        textObj.setFontSize(14);
        textObj.setColor('#ff0000');
      } else {
        textObj.setText('');
      }
    }
  }

  /** Draw classic Windows 3D border. raised=true → light top-left, dark bottom-right. */
  private draw3DBorder(x: number, y: number, w: number, h: number, thickness: number, raised: boolean): void {
    const light = raised ? COLORS.borderLight : COLORS.borderDark;
    const dark = raised ? COLORS.borderDark : COLORS.borderLight;

    // Top & left edges
    this.graphics.fillStyle(light);
    this.graphics.fillRect(x, y, w, thickness);                  // top
    this.graphics.fillRect(x, y, thickness, h);                  // left

    // Bottom & right edges
    this.graphics.fillStyle(dark);
    this.graphics.fillRect(x, y + h - thickness, w, thickness);  // bottom
    this.graphics.fillRect(x + w - thickness, y, thickness, h);  // right
  }
}
