export interface DinoProps {
  /**
   * Callback function called when the game ends
   * @param result - Object containing game result information
   * @param result.score - Final score
   * @param result.time - Time survived in seconds
   */
  onFinish?: (result: { score: number; time: number }) => void;
  
  /**
   * Game speed multiplier (default: 1)
   */
  speed?: number;
}

export interface GameObject {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Obstacle extends GameObject {
  type: 'cactus' | 'bird';
}

export interface GameState {
  dino: GameObject;
  obstacles: Obstacle[];
  score: number;
  isJumping: boolean;
  isDucking: boolean;
  gameOver: boolean;
  gameStarted: boolean;
}
