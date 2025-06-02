import { PLAYER_SPEED, MAX_JUMPS } from './constants.js';

export function createPlayer(x, platform) {
  return {
    x: x,
    y: platform.y - 50,
    width: 50,
    height: 50,
    speed: PLAYER_SPEED,
    dx: 0,
    dy: 0,
    jumping: false,
    grounded: false,
    jumpsLeft: MAX_JUMPS,
    punching: false,
    punchTimer: 0,
    punchCooldown: 0,
    facing: 1,
    knockbackDx: 0,
    stocks: 3,
    projectileCooldown: 0,
    knockbackMultiplier: 1,
    charging: false,
    chargeTime: 0,
    chargeMultiplier: 1,
    chargingProjectile: false,
    projectileChargeTime: 0,
    projectileChargeMultiplier: 1,
    animationFrame: 0,
    squishFactor: 1,
    stretchFactor: 1,
    color: '#FF6347'
  };
}

export function updatePlayerAnimation(player) {
  player.animationFrame++;
  
  if (player.dy < 0 && !player.grounded) {
    player.stretchFactor = Math.max(player.stretchFactor - 0.02, 1.1);
  } else if (player.dy > 5 && !player.grounded) {
    player.stretchFactor = Math.min(player.stretchFactor + 0.03, 1.2);
  } else {
    if (player.stretchFactor > 1) {
      player.stretchFactor = Math.max(player.stretchFactor - 0.05, 1);
    } else if (player.stretchFactor < 1) {
      player.stretchFactor = Math.min(player.stretchFactor + 0.05, 1);
    }
  }
  
  if (player.grounded && player.squishFactor < 1) {
    player.squishFactor = Math.min(player.squishFactor + 0.08, 1);
  } else if (player.squishFactor > 1) {
    player.squishFactor = Math.max(player.squishFactor - 0.08, 1);
  }
  
  if (!player.grounded && Math.abs(player.dy) < 3) {
    player.floatOffset = Math.sin(player.animationFrame * 0.2) * 2;
  } else {
    player.floatOffset = 0;
  }
}

export function resetPlayer(player, spawnX, spawnY) {
  player.x = spawnX;
  player.y = spawnY;
  player.dx = 0;
  player.dy = 0;
  player.jumping = false;
  player.grounded = true;
  player.jumpsLeft = MAX_JUMPS;
  player.stocks = 3;
  player.knockbackMultiplier = 1;
  player.charging = false;
  player.chargeTime = 0;
  player.chargeMultiplier = 1;
  player.chargingProjectile = false;
  player.projectileChargeTime = 0;
  player.projectileChargeMultiplier = 1;
  player.animationFrame = 0;
  player.squishFactor = 1;
  player.stretchFactor = 1;
  player.floatOffset = 0;
  player.punchCooldown = 0;
  player.projectileCooldown = 0;
  player.punching = false;
  player.charging = false;
  player.chargingProjectile = false;
}