export interface SnakeProps {
  /** Grid columns (default: 20) */
  cols?: number;
  /** Grid rows (default: 20) */
  rows?: number;
  /** Snake move interval in ms - lower is faster (default: 150) */
  speed?: number;
  /** Callback when game ends */
  onFinish?: (result: { score: number; time: number }) => void;
}

export type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

export interface Position {
  x: number;
  y: number;
}
