import { JUMP_STRENGTH } from './constants.js';

export const keys = {
  'ArrowLeft': false,
  'ArrowRight': false,
  'ArrowUp': false,
  a: false,
  d: false,
  w: false,
  r: false,
  k: false,
  t: false,
  l: false,
};

export function setupInputListeners(player1, player2) {
  window.addEventListener('keydown', (e) => {
    if (e.key in keys) keys[e.key] = true;

    if (e.key === 'w' && player1.jumpsLeft > 0) {
      player1.dy = -JUMP_STRENGTH;
      player1.jumping = true;
      player1.grounded = false;
      player1.jumpsLeft--;
      player1.stretchFactor = 1.3;
    }
    if (e.key === 'ArrowUp' && player2.jumpsLeft > 0) {
      player2.dy = -JUMP_STRENGTH;
      player2.jumping = true;
      player2.grounded = false;
      player2.jumpsLeft--;
      player2.stretchFactor = 1.3;
    }
  });

  window.addEventListener('keyup', (e) => {
    if (e.key in keys) keys[e.key] = false;
  });
}

export function resetKeyStates() {
  for (const key in keys) {
    keys[key] = false;
  }
}

export function movePlayer(player, leftKey, rightKey, canvas) {
  let moveDx = 0;
  if (keys[leftKey]) {
    moveDx = -player.speed;
    player.facing = -1;
  } else if (keys[rightKey]) {
    moveDx = player.speed;
    player.facing = 1;
  }
  player.dx = moveDx + player.knockbackDx;
  player.x += player.dx;
  if (player.x < 0) player.x = 0;
  if (player.x + player.width > canvas.width) player.x = canvas.width - player.width;

  player.knockbackDx *= 0.8;
  if (Math.abs(player.knockbackDx) < 0.1) player.knockbackDx = 0;
}