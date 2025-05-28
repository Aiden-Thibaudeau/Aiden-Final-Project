// Game constants and configuration
export const GAME_CONFIG = {
  GRAVITY: 1.5,
  JUMP_STRENGTH: 20,
  PLAYER_SPEED: 8,
  MAX_JUMPS: 2,
  PUNCH_DURATION: 10,
  PUNCH_COOLDOWN: 20,
  KNOCKBACK_FORCE: 15,
  PROJECTILE_SPEED: 12,
  PROJECTILE_COOLDOWN: 20,
  PROJECTILE_KNOCKBACK: 10,
  
  // Charging constants
  MAX_CHARGE_TIME: 90, // 1.5 seconds at 60fps
  MIN_CHARGE_MULTIPLIER: 1.0,
  MAX_CHARGE_MULTIPLIER: 2.5,
  
  // Player colors
  PLAYER1_COLOR: '#FF6347',
  PLAYER2_COLOR: '#4682B4',
  PUNCH_COLOR_P1: '#FF0000',
  PUNCH_COLOR_P2: '#0000FF',
  
  // Platform color
  PLATFORM_COLOR: '#8B4513'
};

export const CONTROLS = {
  PLAYER1: {
    LEFT: 'a',
    RIGHT: 'd',
    JUMP: 'w',
    PUNCH: 'q',
    PROJECTILE: 'e'
  },
  PLAYER2: {
    LEFT: '4',
    RIGHT: '6',
    JUMP: '8',
    PUNCH: '7',
    PROJECTILE: '9'
  }
};