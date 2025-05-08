let gameOver = false;
const restartBtn = document.getElementById('restartBtn');

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const GRAVITY = 2;
const JUMP_STRENGTH = 20;
const PLAYER_SPEED = 12;
const MAX_JUMPS = 2;
const PUNCH_DURATION = 10;
const PUNCH_COOLDOWN = 20;
const KNOCKBACK_FORCE = 15;
const projectiles = [];
const PROJECTILE_SPEED = 15;
const PROJECTILE_COOLDOWN = 20;
const PROJECTILE_KNOCKBACK = 10;
KNOCKBACK_MULTIPLIER = 1;

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const platform = {
  x: canvas.width / 4,
  y: canvas.height / 2,
  width: canvas.width / 2,
  height: 100,
};

function createPlayer(x) {
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
  };
}

const player1 = createPlayer(platform.x + platform.width/7);
const player2 = createPlayer(platform.x + platform.width -100);

updateStockDisplay(player1);
updateStockDisplay(player2);

const keys = {
  ArrowLeft: false,
  ArrowRight: false,
  ArrowUp: false,
  a: false,
  d: false,
  w: false,
  f: false,
  '.': false,
  g: false,
  '/': false,
};

window.addEventListener('keydown', (e) => {
  if (e.key in keys) keys[e.key] = true;

  if (e.key === 'w' && player1.jumpsLeft > 0) {
    player1.dy = -JUMP_STRENGTH;
    player1.jumping = true;
    player1.grounded = false;
    player1.jumpsLeft--;
  }
  if (e.key === 'ArrowUp' && player2.jumpsLeft > 0) {
    player2.dy = -JUMP_STRENGTH;
    player2.jumping = true;
    player2.grounded = false;
    player2.jumpsLeft--;
  }
});

window.addEventListener('keyup', (e) => {
  if (e.key in keys) keys[e.key] = false;
});

function movePlayer(player, leftKey, rightKey) {
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

function applyGravity(player) {
  player.dy += GRAVITY;
  const nextY = player.y + player.dy;

  const onPlatform = (
    player.dy > 0 &&
    player.y + player.height <= platform.y &&
    nextY + player.height >= platform.y &&
    player.x + player.width > platform.x &&
    player.x < platform.x + platform.width
  );

  if (onPlatform) {
    player.dy = 0;
    player.y = platform.y - player.height;
    player.grounded = true;
    player.jumping = false;
    player.jumpsLeft = MAX_JUMPS;
  } else {
    player.grounded = false;
  }

  player.y += player.dy;
}

function updateStockDisplay(player) {
  const containerId = player === player1 ? 'player1Stock' : 'player2Stock';
  const stockContainer = document.getElementById(containerId);

  stockContainer.innerHTML = '';
  for (let i = 0; i < player.stocks; i++) {
    const heart = document.createElement('img');
    heart.src = 'hearts.png';
    heart.alt = 'Heart';
    stockContainer.appendChild(heart);
  }
}

function checkFallOff(player, spawnX) {
  if (player.y > canvas.height) {
    if (player.stocks > 1) {
      player.stocks--;
      updateStockDisplay(player);
      player.x = spawnX;
      player.y = platform.y - player.height;
      player.dy = 0;
      player.jumping = false;
      player.grounded = true;
      player.jumpsLeft = MAX_JUMPS;
    } else {
      player.stocks = 0;
      updateStockDisplay(player);
    }
  }
}

function handlePunching(attacker, defender, punchKey) {
  if (keys[punchKey] && attacker.punchCooldown <= 0 && !attacker.punching) {
    attacker.punching = true;
    attacker.punchTimer = PUNCH_DURATION;
    attacker.punchCooldown = PUNCH_COOLDOWN;
  }

  if (attacker.punching) {
    attacker.punchTimer--;
    if (attacker.punchTimer <= 0) {
      attacker.punching = false;
    } else {
      const punchWidth = 60;
      const punchHeight = 30;
      const punchX = attacker.facing === 1 ? attacker.x + attacker.width : attacker.x - punchWidth;
      const punchY = attacker.y + attacker.height / 4;

      if (
        punchX < defender.x + defender.width &&
        punchX + punchWidth > defender.x &&
        punchY < defender.y + defender.height &&
        punchY + punchHeight > defender.y
      ) {
        const knockDirection = attacker.facing;
        defender.knockbackDx = knockDirection * (KNOCKBACK_FORCE*KNOCKBACK_MULTIPLIER);
        defender.dy = -10;
        KNOCKBACK_MULTIPLIER += 0.1;
      }
    }
  }

  if (attacker.punchCooldown > 0) {
    attacker.punchCooldown--;
  }
}

function drawPunch(player, color) {
  if (!player.punching) return;

  const punchWidth = 60;
  const punchHeight = 30;
  const punchX = player.facing === 1 ? player.x + player.width : player.x - punchWidth;
  const punchY = player.y + player.height / 4;

  ctx.fillStyle = color;
  ctx.fillRect(punchX, punchY, punchWidth, punchHeight);
}

function shootProjectile(player, key) {
  if (keys[key] && player.projectileCooldown <= 0) {
    const dir = player.facing;
    projectiles.push({
      x: player.x + (dir === 1 ? player.width : -20),
      y: player.y + player.height / 2 - 5,
      width: 20,
      height: 10,
      dx: PROJECTILE_SPEED * dir,
      owner: player
    });
    player.projectileCooldown = PROJECTILE_COOLDOWN;
  }

  if (player.projectileCooldown > 0) {
    player.projectileCooldown--;
  }
}

function updateProjectiles() {
  for (let i = projectiles.length - 1; i >= 0; i--) {
    const p = projectiles[i];
    p.x += p.dx;

    const target = p.owner === player1 ? player2 : player1;
    if (
      p.x < target.x + target.width &&
      p.x + p.width > target.x &&
      p.y < target.y + target.height &&
      p.y + p.height > target.y
    ) {
      target.knockbackDx = Math.sign(p.dx) * PROJECTILE_KNOCKBACK;
      target.dy = -8;
      projectiles.splice(i, 1);
      continue;
    }

    if (p.x < 0 || p.x > canvas.width) {
      projectiles.splice(i, 1);
    }
  }
}

function drawProjectiles() {
  ctx.fillStyle = 'gold';
  projectiles.forEach(p => {
    ctx.fillRect(p.x, p.y, p.width, p.height);
  });
}

function resetPlayer(player, spawnX, spawnY) {
  player.x = spawnX;
  player.y = spawnY;
  player.dx = 0;
  player.dy = 0;
  player.jumping = false;
  player.grounded = true;
  player.jumpsLeft = MAX_JUMPS;
  player.stocks = 3;
  updateStockDisplay(player);
  resetKeyStates();
}

function resetKeyStates() {
  for (const key in keys) {
    keys[key] = false;
  }
}

function updateGame() {
  movePlayer(player1, 'a', 'd');
  movePlayer(player2, 'ArrowLeft', 'ArrowRight');

  applyGravity(player1);
  applyGravity(player2);

  player1.dx *= 0.95;
  player2.dx *= 0.95;

  checkFallOff(player1, platform.x + platform.width/7);
  checkFallOff(player2, platform.x + platform.width - 100);

  handlePunching(player1, player2, 'f');
  handlePunching(player2, player1, '.');

  shootProjectile(player1, 'g');
  shootProjectile(player2, '/');

  updateProjectiles();

  if (!gameOver && (player1.stocks <= 0 || player2.stocks <= 0)) {
    gameOver = true;
    restartBtn.style.display = 'block';
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawPlatform();
  drawPlayer(player1, '#FF6347');
  drawPlayer(player2, '#4682B4');
  drawPunch(player1, '#FF0000');
  drawPunch(player2, '#0000FF');
  drawProjectiles();
}

restartBtn.addEventListener('click', () => {
  gameOver = false;
  restartBtn.style.display = 'none';
  resetPlayer(player1, platform.x + platform.width/7, platform.y - player1.height);
  resetPlayer(player2, platform.x + platform.width - 100, platform.y - player2.height);
  requestAnimationFrame(gameLoop);
});

function drawWinnerText() {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = player1.stocks <= 0 ? '#4682B4' : '#FF6347';
  ctx.font = '60px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(`${player1.stocks <= 0 ? 'Blue' : 'Red'} Wins!`, canvas.width / 2, canvas.height / 2 - 60);
}

function drawPlayer(player, color) {
  ctx.fillStyle = color;
  ctx.fillRect(player.x, player.y, player.width, player.height);
}

function drawPlatform() {
  ctx.fillStyle = '#8B4513';
  ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
}

function gameLoop() {
  updateGame();
  if (gameOver) {
    drawWinnerText();
    return;
  }
  requestAnimationFrame(gameLoop);
}

gameLoop();
