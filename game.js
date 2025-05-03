let gameOver = false;
const restartBtn = document.getElementById('restartBtn');

// Get the canvas element and set up its context
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game configuration variables
const GRAVITY = 1.5;
const JUMP_STRENGTH = 25;
const PLAYER_SPEED = 8;
const MAX_JUMPS = 2;
const PUNCH_DURATION = 10;  // Frames
const PUNCH_COOLDOWN = 30;  // Frames between punches
const KNOCKBACK_FORCE = 35; // Horizontal knockback force

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Define the platform object
const platform = {
  x: canvas.width / 4,
  y: canvas.height - 500,
  width: canvas.width / 2,
  height: 100,
};

// Function to create players
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
    facing: 1,  // 1 = right, -1 = left
    knockbackDx: 0,
    stocks: 3,
  };
}

// Players
const player1 = createPlayer(1000);
const player2 = createPlayer(platform.x + platform.width - 100);


updateStockDisplay(player1);
updateStockDisplay(player2);

// Input tracking
const keys = {
  ArrowLeft: false,
  ArrowRight: false,
  ArrowUp: false,
  a: false,
  d: false,
  w: false,
  f: false,
  '.': false,
};

window.addEventListener('keydown', (e) => {
  if (e.key in keys) keys[e.key] = true;

  // Jumping
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

// Move players
function movePlayer(player, leftKey, rightKey) {
  let moveDx = 0;
  if (keys[leftKey]) {
    moveDx = -player.speed;
    player.facing = -1;
  } else if (keys[rightKey]) {
    moveDx = player.speed;
    player.facing = 1;
  }

  // Combine movement and knockback
  player.dx = moveDx + player.knockbackDx;

  // Apply horizontal movement
  player.x += player.dx;

  // Clamp within canvas
  if (player.x < 0) player.x = 0;
  if (player.x + player.width > canvas.width) player.x = canvas.width - player.width;

  // Gradually reduce knockback
  player.knockbackDx *= 0.8;
  if (Math.abs(player.knockbackDx) < 0.1) player.knockbackDx = 0;
}





// Gravity + Platform
function applyGravity(player) {
  player.dy += GRAVITY;
  const nextY = player.y + player.dy;

  const isFallingOntoPlatform = (
    player.dy > 0 &&
    player.y + player.height <= platform.y &&
    nextY + player.height >= platform.y &&
    player.x + player.width > platform.x &&
    player.x < platform.x + platform.width
  );

  if (isFallingOntoPlatform) {
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

// Fall check
function checkFallOff(player, spawnX) {
  if (player.y > canvas.height) {
    if (player.stocks > 1) {
      player.stocks--;
      updateStockDisplay(player);

      // Respawn
      player.x = spawnX;
      player.y = platform.y - player.height;
      player.dy = 0;
      player.jumping = false;
      player.grounded = true;
      player.jumpsLeft = MAX_JUMPS;
    } else {
      player.stocks = 0;
      updateStockDisplay(player);
      // Optional: Handle game over
    }
  }
}


// Punch handling
function handlePunching(attacker, defender, punchKey) {
  // Start punch if key pressed and not cooling down
  if (keys[punchKey] && attacker.punchCooldown <= 0 && !attacker.punching) {
    attacker.punching = true;
    attacker.punchTimer = PUNCH_DURATION;
    attacker.punchCooldown = PUNCH_COOLDOWN;
  }

  // Update punch timer
  if (attacker.punching) {
    attacker.punchTimer--;
    if (attacker.punchTimer <= 0) {
      attacker.punching = false;
    } else {
      // Punch hitbox (in front of player)
      const punchWidth = 30;
      const punchHeight = 30;
      const punchX = attacker.facing === 1 ? attacker.x + attacker.width : attacker.x - punchWidth;
      const punchY = attacker.y + attacker.height / 4;

      // Collision with defender
      if (
        punchX < defender.x + defender.width &&
        punchX + punchWidth > defender.x &&
        punchY < defender.y + defender.height &&
        punchY + punchHeight > defender.y
      ) {
        // Apply knockback away from attacker
        const knockDirection = attacker.facing;
        defender.knockbackDx = knockDirection * KNOCKBACK_FORCE;
        defender.dy = -10; // Knock upward
        // Apply additional backward movement for realism
      }
    }
  }

  // Reduce cooldown
  if (attacker.punchCooldown > 0) {
    attacker.punchCooldown--;
  }
}

// Draw punch
function drawPunch(player, color) {
  if (!player.punching) return;

  const punchWidth = 30;
  const punchHeight = 30;
  const punchX = player.facing === 1 ? player.x + player.width : player.x - punchWidth;
  const punchY = player.y + player.height / 4;

  ctx.fillStyle = color;
  ctx.fillRect(punchX, punchY, punchWidth, punchHeight);
}

// Reset player function moved outside updateGame
// Reset player function moved outside updateGame
function resetPlayer(player, spawnX, spawnY) {
  player.x = spawnX;
  player.y = spawnY;
  player.dx = 0;
  player.dy = 0;
  player.jumping = false;
  player.grounded = true;
  player.jumpsLeft = MAX_JUMPS;
  player.stocks = 3;  // Reset stocks to 3
  updateStockDisplay(player);  // Update the display of stocks
  resetKeyStates();  // Reset key states
}

// Function to reset key states
function resetKeyStates() {
  // Explicitly set the key states to false to prevent movement after respawn
  for (const key in keys) {
    keys[key] = false;
  }
}

// Game state
function updateGame() {
  movePlayer(player1, 'a', 'd');
  movePlayer(player2, 'ArrowLeft', 'ArrowRight');

  applyGravity(player1);
  applyGravity(player2);

  player1.dx *= 0.95;
  player2.dx *= 0.95;

  checkFallOff(player1, 1000);
  checkFallOff(player2, platform.x + platform.width - 100);

  handlePunching(player1, player2, 'f');
  handlePunching(player2, player1, '.');

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
}

restartBtn.addEventListener('click', () => {
  gameOver = false;
  restartBtn.style.display = 'none';

  resetPlayer(player1, 1000, platform.y - player1.height);
  resetPlayer(player2, platform.x + platform.width - 100, platform.y - player2.height);

  requestAnimationFrame(gameLoop);  // Resume game
});

function drawWinnerText() {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = player1.stocks <= 0 ? '#4682B4' : '#FF6347';
  ctx.font = '60px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(`${player1.stocks <= 0 ? 'Blue' : 'Red'} Wins!`, canvas.width / 2, canvas.height / 2 - 60);
}

// Draw player
function drawPlayer(player, color) {
  ctx.fillStyle = color;
  ctx.fillRect(player.x, player.y, player.width, player.height);
}

// Draw platform
function drawPlatform() {
  ctx.fillStyle = '#8B4513';
  ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
}

// Game loop
function gameLoop() {
  updateGame();

  if (gameOver) {
    drawWinnerText();
    return; // Stop game updates
  }

  requestAnimationFrame(gameLoop);
}

gameLoop();
