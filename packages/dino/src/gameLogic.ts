import { GameObject, Obstacle, GameState } from './types';

// Game constants
export const CANVAS_WIDTH = 800;
export const CANVAS_HEIGHT = 200;
export const GROUND_HEIGHT = 150;
export const DINO_WIDTH = 40;
export const DINO_HEIGHT = 45;
export const DINO_X = 50;
export const GRAVITY = 0.6;
export const JUMP_STRENGTH = -12;
export const DUCK_HEIGHT = 30;
export const OBSTACLE_SPEED = 5;
export const OBSTACLE_SPAWN_DISTANCE = 300;

/**
 * Creates initial game state
 */
export function createInitialState(): GameState {
  return {
    dino: {
      x: DINO_X,
      y: GROUND_HEIGHT - DINO_HEIGHT,
      width: DINO_WIDTH,
      height: DINO_HEIGHT,
    },
    obstacles: [],
    score: 0,
    isJumping: false,
    isDucking: false,
    gameOver: false,
    gameStarted: false,
  };
}

/**
 * Checks collision between dino and obstacle
 */
export function checkCollision(dino: GameObject, obstacle: Obstacle): boolean {
  // Add some padding for more forgiving collision
  const padding = 5;
  
  return (
    dino.x + padding < obstacle.x + obstacle.width &&
    dino.x + dino.width - padding > obstacle.x &&
    dino.y + padding < obstacle.y + obstacle.height &&
    dino.y + dino.height - padding > obstacle.y
  );
}

/**
 * Creates a random obstacle
 */
export function createObstacle(lastObstacleX: number): Obstacle {
  const types: ('cactus' | 'bird')[] = ['cactus', 'bird'];
  const type = types[Math.floor(Math.random() * types.length)];
  
  const gap = OBSTACLE_SPAWN_DISTANCE + Math.random() * 200;
  const x = Math.max(CANVAS_WIDTH, lastObstacleX + gap);
  
  if (type === 'cactus') {
    const heights = [35, 45, 50];
    const height = heights[Math.floor(Math.random() * heights.length)];
    return {
      type: 'cactus',
      x,
      y: GROUND_HEIGHT - height,
      width: 20,
      height,
    };
  } else {
    // Bird at different heights
    const birdHeights = [GROUND_HEIGHT - 80, GROUND_HEIGHT - 60, GROUND_HEIGHT - 100];
    const y = birdHeights[Math.floor(Math.random() * birdHeights.length)];
    return {
      type: 'bird',
      x,
      y,
      width: 35,
      height: 25,
    };
  }
}

/**
 * Updates game state
 */
export function updateGameState(
  state: GameState,
  velocityY: number,
  speed: number
): { newState: GameState; newVelocityY: number } {
  if (state.gameOver || !state.gameStarted) {
    return { newState: state, newVelocityY: velocityY };
  }

  const newState = { ...state };
  let newVelocityY = velocityY;

  // Update dino position
  if (state.isJumping) {
    newVelocityY += GRAVITY;
    newState.dino = {
      ...state.dino,
      y: state.dino.y + newVelocityY,
    };

    // Check if landed
    const groundY = GROUND_HEIGHT - DINO_HEIGHT;
    if (newState.dino.y >= groundY) {
      newState.dino.y = groundY;
      newState.isJumping = false;
      newVelocityY = 0;
    }
  }

  // Update dino height when ducking
  if (state.isDucking && !state.isJumping) {
    newState.dino = {
      ...state.dino,
      height: DUCK_HEIGHT,
      y: GROUND_HEIGHT - DUCK_HEIGHT,
    };
  } else if (!state.isDucking && state.dino.height !== DINO_HEIGHT) {
    newState.dino = {
      ...state.dino,
      height: DINO_HEIGHT,
      y: state.isJumping ? state.dino.y : GROUND_HEIGHT - DINO_HEIGHT,
    };
  }

  // Update obstacles
  const obstacleSpeed = OBSTACLE_SPEED * speed;
  newState.obstacles = state.obstacles
    .map(obstacle => ({
      ...obstacle,
      x: obstacle.x - obstacleSpeed,
    }))
    .filter(obstacle => obstacle.x + obstacle.width > 0);

  // Add new obstacles
  const lastObstacleX = newState.obstacles.length > 0
    ? newState.obstacles[newState.obstacles.length - 1].x
    : -OBSTACLE_SPAWN_DISTANCE;

  if (lastObstacleX < CANVAS_WIDTH) {
    newState.obstacles.push(createObstacle(lastObstacleX));
  }

  // Check collisions
  for (const obstacle of newState.obstacles) {
    if (checkCollision(newState.dino, obstacle)) {
      newState.gameOver = true;
      break;
    }
  }

  // Update score (increment by a small amount each frame)
  newState.score = state.score + (0.1 * speed);

  return { newState, newVelocityY };
}
