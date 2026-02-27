import Phaser from 'phaser';
import { Direction, Position } from '../types';

const CELL_SIZE = 25;

const COLORS = {
  boardLight: 0xaad751,
  boardDark: 0xa2d149,
  snake: 0x4caf50,
  snakeHead: 0x388e3c,
  apple: 0xe7471d,
  border: 0x578a34,
  textColor: '#ffffff',
  overlayBg: 0x000000,
};

const OPPOSITE: Record<Direction, Direction> = {
  UP: 'DOWN',
  DOWN: 'UP',
  LEFT: 'RIGHT',
  RIGHT: 'LEFT',
};

export class GameScene extends Phaser.Scene {
  private cols!: number;
  private rows!: number;
  private speed!: number;

  private snake!: Position[];
  private direction!: Direction;
  private nextDirection!: Direction;
  private apple!: Position;
  private score!: number;
  private gameOver!: boolean;
  private gameStarted!: boolean;
  private startTime!: number;

  private boardGraphics!: Phaser.GameObjects.Graphics;
  private snakeGraphics!: Phaser.GameObjects.Graphics;
  private appleGraphics!: Phaser.GameObjects.Graphics;
  private scoreText!: Phaser.GameObjects.Text;
  private overlayText!: Phaser.GameObjects.Text;

  private moveTimer!: Phaser.Time.TimerEvent;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private restartKey!: Phaser.Input.Keyboard.Key;

  constructor() {
    super({ key: 'GameScene' });
  }

  init(data: { cols: number; rows: number; speed: number }): void {
    this.cols = data.cols;
    this.rows = data.rows;
    this.speed = data.speed;
  }

  create(): void {
    const canvasWidth = this.cols * CELL_SIZE;
    const canvasHeight = this.rows * CELL_SIZE;

    // Draw static board
    this.boardGraphics = this.add.graphics();
    this.drawBoard();

    // Dynamic graphics layers
    this.snakeGraphics = this.add.graphics();
    this.appleGraphics = this.add.graphics();

    // Score text
    this.scoreText = this.add.text(8, 4, 'Score: 0', {
      fontSize: '14px',
      fontFamily: 'monospace',
      color: COLORS.textColor,
    }).setDepth(10);

    // Overlay text (start / game over)
    this.overlayText = this.add.text(canvasWidth / 2, canvasHeight / 2, '', {
      fontSize: '16px',
      fontFamily: 'monospace',
      color: COLORS.textColor,
      backgroundColor: 'rgba(0,0,0,0.6)',
      padding: { x: 16, y: 12 },
      align: 'center',
    }).setOrigin(0.5).setDepth(20);

    // Input
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.restartKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.R);

    this.resetGame();
  }

  private resetGame(): void {
    this.score = 0;
    this.gameOver = false;
    this.gameStarted = false;
    this.startTime = 0;

    // Snake starts at center, 3 cells long, facing right
    const centerX = Math.floor(this.cols / 2);
    const centerY = Math.floor(this.rows / 2);
    this.snake = [
      { x: centerX, y: centerY },
      { x: centerX - 1, y: centerY },
      { x: centerX - 2, y: centerY },
    ];
    this.direction = 'RIGHT';
    this.nextDirection = 'RIGHT';

    this.spawnApple();
    this.draw();

    this.scoreText.setText('Score: 0');
    this.overlayText.setText('Press Arrow Key to Start');
    this.overlayText.setVisible(true);

    // Remove existing timer if any
    if (this.moveTimer) {
      this.moveTimer.remove();
    }
  }

  update(): void {
    if (this.gameOver) {
      if (Phaser.Input.Keyboard.JustDown(this.restartKey)) {
        this.resetGame();
      }
      return;
    }

    // Read direction input
    if (Phaser.Input.Keyboard.JustDown(this.cursors.up!)) {
      this.tryChangeDirection('UP');
    } else if (Phaser.Input.Keyboard.JustDown(this.cursors.down!)) {
      this.tryChangeDirection('DOWN');
    } else if (Phaser.Input.Keyboard.JustDown(this.cursors.left!)) {
      this.tryChangeDirection('LEFT');
    } else if (Phaser.Input.Keyboard.JustDown(this.cursors.right!)) {
      this.tryChangeDirection('RIGHT');
    }
  }

  private tryChangeDirection(newDir: Direction): void {
    // Ignore reverse direction
    if (OPPOSITE[newDir] === this.direction) {
      return;
    }

    this.nextDirection = newDir;

    // Start game on first input
    if (!this.gameStarted) {
      this.gameStarted = true;
      this.startTime = Date.now();
      this.overlayText.setVisible(false);
      this.moveTimer = this.time.addEvent({
        delay: this.speed,
        callback: this.moveSnake,
        callbackScope: this,
        loop: true,
      });
    }
  }

  private moveSnake(): void {
    if (this.gameOver) return;

    this.direction = this.nextDirection;
    const head = this.snake[0];
    const newHead: Position = { ...head };

    switch (this.direction) {
      case 'UP': newHead.y -= 1; break;
      case 'DOWN': newHead.y += 1; break;
      case 'LEFT': newHead.x -= 1; break;
      case 'RIGHT': newHead.x += 1; break;
    }

    // Wall collision
    if (newHead.x < 0 || newHead.x >= this.cols || newHead.y < 0 || newHead.y >= this.rows) {
      this.endGame();
      return;
    }

    // Self collision
    if (this.snake.some(seg => seg.x === newHead.x && seg.y === newHead.y)) {
      this.endGame();
      return;
    }

    this.snake.unshift(newHead);

    // Apple collision
    if (newHead.x === this.apple.x && newHead.y === this.apple.y) {
      this.score += 1;
      this.scoreText.setText(`Score: ${this.score}`);
      this.spawnApple();
    } else {
      this.snake.pop();
    }

    this.draw();
  }

  private endGame(): void {
    this.gameOver = true;
    if (this.moveTimer) {
      this.moveTimer.remove();
    }

    const elapsedTime = this.startTime > 0 ? (Date.now() - this.startTime) / 1000 : 0;

    this.overlayText.setText(`Game Over!\nScore: ${this.score}\nPress R to restart`);
    this.overlayText.setVisible(true);

    this.game.events.emit('gameOver', {
      score: this.score,
      time: parseFloat(elapsedTime.toFixed(1)),
    });
  }

  private spawnApple(): void {
    const occupied = new Set(this.snake.map(s => `${s.x},${s.y}`));
    const available: Position[] = [];
    for (let x = 0; x < this.cols; x++) {
      for (let y = 0; y < this.rows; y++) {
        if (!occupied.has(`${x},${y}`)) {
          available.push({ x, y });
        }
      }
    }
    if (available.length === 0) {
      this.endGame();
      return;
    }
    this.apple = available[Math.floor(Math.random() * available.length)];
  }

  private drawBoard(): void {
    this.boardGraphics.clear();
    for (let x = 0; x < this.cols; x++) {
      for (let y = 0; y < this.rows; y++) {
        const color = (x + y) % 2 === 0 ? COLORS.boardLight : COLORS.boardDark;
        this.boardGraphics.fillStyle(color);
        this.boardGraphics.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
      }
    }
  }

  private draw(): void {
    // Snake
    this.snakeGraphics.clear();
    this.snake.forEach((seg, i) => {
      const color = i === 0 ? COLORS.snakeHead : COLORS.snake;
      this.snakeGraphics.fillStyle(color);
      this.snakeGraphics.fillRect(
        seg.x * CELL_SIZE + 1,
        seg.y * CELL_SIZE + 1,
        CELL_SIZE - 2,
        CELL_SIZE - 2,
      );
    });

    // Apple
    this.appleGraphics.clear();
    this.appleGraphics.fillStyle(COLORS.apple);
    this.appleGraphics.fillCircle(
      this.apple.x * CELL_SIZE + CELL_SIZE / 2,
      this.apple.y * CELL_SIZE + CELL_SIZE / 2,
      CELL_SIZE / 2 - 2,
    );
  }
}
