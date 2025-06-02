let gameOver = false;
let gameStarted = false; // New: To control game state

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// New: Character Select Screen Elements
const characterSelectScreen = document.getElementById('characterSelectScreen');
const player1ColorOptions = document.getElementById('player1ColorOptions');
const player2ColorOptions = document.getElementById('player2ColorOptions');
const player1Preview = document.getElementById('player1Preview');
const player2Preview = document.getElementById('player2Preview');
const startGameBtn = document.getElementById('startGameBtn');
const restartBtn = document.getElementById('restartBtn');
const gameUI = document.getElementById('gameUI'); // New: Container for game UI

const GRAVITY = 1.5;
const JUMP_STRENGTH = 20;
const PLAYER_SPEED = 8;
const MAX_JUMPS = 2;
const PUNCH_DURATION = 10;
const PUNCH_COOLDOWN = 20;
const KNOCKBACK_FORCE = 15;
const projectiles = [];
const PROJECTILE_SPEED = 12;
const PROJECTILE_COOLDOWN = 20;
const PROJECTILE_KNOCKBACK = 10;

// New charging constants
const MAX_CHARGE_TIME = 90; // 1.5 seconds at 60fps
const MIN_CHARGE_MULTIPLIER = 1.0;
const MAX_CHARGE_MULTIPLIER = 2.5;

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
    knockbackMultiplier: 1,
    // New charging properties
    charging: false,
    chargeTime: 0,
    chargeMultiplier: 1,
    // New projectile charging properties
    chargingProjectile: false,
    projectileChargeTime: 0,
    projectileChargeMultiplier: 1,
    // New animation properties
    animationFrame: 0,
    squishFactor: 1, // For landing squish effect
    stretchFactor: 1, // For jumping stretch effect
  };
}

// Global player objects, colors will be set during selection
const player1 = createPlayer(platform.x + platform.width/7);
const player2 = createPlayer(platform.x + platform.width -100);

// New: Player selected colors
let player1SelectedColor = '#FF6347'; // Default color for Player 1
let player2SelectedColor = '#4682B4'; // Default color for Player 2

// Initial stock and percent displays are handled after game starts
// updateStockDisplay(player1); // Remove this
// updateStockDisplay(player2); // Remove this

updateStockDisplay(player1);
updateStockDisplay(player2);

const keys = {
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

// New: Character selection logic
const colors = ['#FF6347', '#4682B4', '#32CD32', '#FFD700', '#8A2BE2'];

function setupColorSelection(playerColorOptions, playerPreview, playerNumber) {
    playerColorOptions.querySelectorAll('.color-box').forEach(box => {
        const color = box.dataset.color;
        box.style.backgroundColor = color; // Ensure background color is set

        // Set default selected state
        if ((playerNumber === 1 && color === player1SelectedColor) || (playerNumber === 2 && color === player2SelectedColor)) {
            box.classList.add('selected');
        }

        box.addEventListener('click', () => {
            // Remove 'selected' from all other boxes for this player
            playerColorOptions.querySelectorAll('.color-box').forEach(b => b.classList.remove('selected'));
            // Add 'selected' to the clicked box
            box.classList.add('selected');

            // Update player's selected color and preview
            if (playerNumber === 1) {
                player1SelectedColor = color;
                player1Preview.style.backgroundColor = color;
            } else {
                player2SelectedColor = color;
                player2Preview.style.backgroundColor = color;
            }
        });
    });
}

// Set up selection for both players
setupColorSelection(player1ColorOptions, player1Preview, 1);
setupColorSelection(player2ColorOptions, player2Preview, 2);

// Start Game Button Logic
startGameBtn.addEventListener('click', () => {
    characterSelectScreen.style.display = 'none';
    gameUI.style.display = 'block'; // Show game UI
    gameStarted = true;
    // Set actual player colors from selection
    player1.color = player1SelectedColor;
    player2.color = player2SelectedColor;

    // Reset players to initial state with selected colors
    resetPlayer(player1, platform.x + platform.width / 7, platform.y - player1.height);
    resetPlayer(player2, platform.x + platform.width - 100, platform.y - player2.height);

    gameLoop(); // Start the game loop
});

window.addEventListener('keydown', (e) => {
  if (e.key in keys) keys[e.key] = true;

  if (e.key === 'w' && player1.jumpsLeft > 0) {
    player1.dy = -JUMP_STRENGTH;
    player1.jumping = true;
    player1.grounded = false;
    player1.jumpsLeft--;
    // Add jump stretch effect
    player1.stretchFactor = 1.3;
  }
  if (e.key === 'ArrowUp' && player2.jumpsLeft > 0) {
    player2.dy = -JUMP_STRENGTH;
    player2.jumping = true;
    player2.grounded = false;
    player2.jumpsLeft--;
    // Add jump stretch effect
    player2.stretchFactor = 1.3;
  }
});

window.addEventListener('keyup', (e) => {
  if (e.key in keys) keys[e.key] = false;
});

function updatePlayerAnimation(player) {
  // Update animation frame counter
  player.animationFrame++;
  
  // Handle stretch effect (jumping/rising)
  if (player.dy < 0 && !player.grounded) { // Rising
    player.stretchFactor = Math.max(player.stretchFactor - 0.02, 1.1);
  } else if (player.dy > 5 && !player.grounded) { // Falling fast
    player.stretchFactor = Math.min(player.stretchFactor + 0.03, 1.2);
  } else {
    // Return to normal
    if (player.stretchFactor > 1) {
      player.stretchFactor = Math.max(player.stretchFactor - 0.05, 1);
    } else if (player.stretchFactor < 1) {
      player.stretchFactor = Math.min(player.stretchFactor + 0.05, 1);
    }
  }
  
  // Handle squish effect (landing)
  if (player.grounded && player.squishFactor < 1) {
    player.squishFactor = Math.min(player.squishFactor + 0.08, 1);
  } else if (player.squishFactor > 1) {
    player.squishFactor = Math.max(player.squishFactor - 0.08, 1);
  }
  
  // Add subtle floating animation when airborne
  if (!player.grounded && Math.abs(player.dy) < 3) {
    const floatOffset = Math.sin(player.animationFrame * 0.2) * 2;
    player.floatOffset = floatOffset;
  } else {
    player.floatOffset = 0;
  }
}

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
  const wasGrounded = player.grounded;
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
    
    // Add landing squish effect if just landed
    if (!wasGrounded && player.dy > 8) {
      player.squishFactor = 0.7; // Squish down
    } else if (!wasGrounded) {
      player.squishFactor = 0.85; // Light squish
    }
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

function updatePercentDisplay(player) {
  const percentId = player === player1 ? 'player1Percent' : 'player2Percent';
  const percentContainer = document.getElementById(percentId);

  percentContainer.textContent = `${Math.round((player.knockbackMultiplier - 1) * 10)}%`;
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
      player.knockbackMultiplier = 1;
      // Reset animation properties
      player.squishFactor = 1;
      player.stretchFactor = 1;
      player.floatOffset = 0;
    } else {
      player.stocks = 0;
      updateStockDisplay(player);
    }
  }
}

function handlePunching(attacker, defender, punchKey) {
  // Handle charging
  if (keys[punchKey] && attacker.punchCooldown <= 0 && !attacker.punching) {
    if (!attacker.charging) {
      attacker.charging = true;
      attacker.chargeTime = 0;
    } else {
      // Continue charging
      attacker.chargeTime = Math.min(attacker.chargeTime + 1, MAX_CHARGE_TIME);
    }
    
    // Calculate charge multiplier
    const chargeProgress = attacker.chargeTime / MAX_CHARGE_TIME;
    attacker.chargeMultiplier = MIN_CHARGE_MULTIPLIER + 
      (MAX_CHARGE_MULTIPLIER - MIN_CHARGE_MULTIPLIER) * chargeProgress;
  }
  
  // Release punch when key is released
  if (!keys[punchKey] && attacker.charging && attacker.punchCooldown <= 0) {
    attacker.charging = false;
    attacker.punching = true;
    attacker.punchTimer = PUNCH_DURATION;
    attacker.punchCooldown = PUNCH_COOLDOWN;
  }

  if (attacker.punching) {
    attacker.punchTimer--;
    if (attacker.punchTimer <= 0) {
      attacker.punching = false;
      attacker.chargeMultiplier = 1; // Reset charge multiplier
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
        // Apply charge multiplier to knockback and damage
        const chargedKnockback = KNOCKBACK_FORCE * attacker.chargeMultiplier;
        const chargeDamage = 0.3 * attacker.chargeMultiplier;
        
        defender.knockbackDx = knockDirection * (chargedKnockback * defender.knockbackMultiplier);
        defender.dy = -10 * Math.sqrt(attacker.chargeMultiplier); // Stronger upward knockback for charged punches
        defender.knockbackMultiplier = Math.min(defender.knockbackMultiplier + chargeDamage, 11);
        
        // Add hit stretch effect to defender
        defender.stretchFactor = 1.4;
      }
    }
  }

  if (attacker.punchCooldown > 0) {
    attacker.punchCooldown--;
  }
}

function drawPunch(player, color) {
  if (!player.punching && !player.charging) return;

  const punchWidth = 60;
  const punchHeight = 30;
  const punchX = player.facing === 1 ? player.x + player.width : player.x - punchWidth;
  const punchY = player.y + player.height / 4;

  if (player.punching) {
    // Draw punch with intensity based on charge
    const alpha = 0.3 + (player.chargeMultiplier - 1) * 0.4;
    ctx.fillStyle = color;
    ctx.globalAlpha = alpha;
    ctx.fillRect(punchX, punchY, punchWidth, punchHeight);
    ctx.globalAlpha = 1;
  } else if (player.charging) {
    // Draw charging indicator
    const chargeProgress = player.chargeTime / MAX_CHARGE_TIME;
    const chargeAlpha = 0.2 + chargeProgress * 0.6;
    
    // Pulsing effect
    const pulse = Math.sin(player.chargeTime * 0.3) * 0.2 + 0.8;
    
    ctx.fillStyle = color;
    ctx.globalAlpha = chargeAlpha * pulse;
    ctx.fillRect(punchX, punchY, punchWidth, punchHeight);
    
    // Draw charge bar above player
    const barWidth = 60;
    const barHeight = 8;
    const barX = player.x + (player.width - barWidth) / 2;
    const barY = player.y - 20;
    
    // Background bar
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(barX, barY, barWidth, barHeight);
    
    // Charge progress bar
    ctx.fillStyle = `rgba(255, ${255 - chargeProgress * 255}, 0, 0.8)`;
    ctx.fillRect(barX, barY, barWidth * chargeProgress, barHeight);
    
    ctx.globalAlpha = 1;
  }
}

function shootProjectile(player, key) {
  // Handle projectile charging
  if (keys[key] && player.projectileCooldown <= 0) {
    if (!player.chargingProjectile) {
      player.chargingProjectile = true;
      player.projectileChargeTime = 0;
    } else {
      // Continue charging
      player.projectileChargeTime = Math.min(player.projectileChargeTime + 1, MAX_CHARGE_TIME);
    }
    
    // Calculate charge multiplier
    const chargeProgress = player.projectileChargeTime / MAX_CHARGE_TIME;
    player.projectileChargeMultiplier = MIN_CHARGE_MULTIPLIER + 
      (MAX_CHARGE_MULTIPLIER - MIN_CHARGE_MULTIPLIER) * chargeProgress;
  }
  
  // Release projectile when key is released
  if (!keys[key] && player.chargingProjectile && player.projectileCooldown <= 0) {
    player.chargingProjectile = false;
    const dir = player.facing;
    
    // Create charged projectile
    const chargedSpeed = PROJECTILE_SPEED * player.projectileChargeMultiplier;
    const chargedSize = Math.round(20 + (player.projectileChargeMultiplier - 1) * 15); // Size increases with charge
    
    projectiles.push({
      x: player.x + (dir === 1 ? player.width : -chargedSize),
      y: player.y + player.height / 2 - chargedSize/2,
      width: chargedSize,
      height: chargedSize,
      dx: chargedSpeed * dir,
      owner: player,
      chargeMultiplier: player.projectileChargeMultiplier
    });
    
    player.projectileCooldown = PROJECTILE_COOLDOWN;
    player.projectileChargeMultiplier = 1; // Reset charge multiplier
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
      // Apply knockback using projectile's charge multiplier
      const chargedKnockback = PROJECTILE_KNOCKBACK * (p.chargeMultiplier || 1);
      const chargeDamage = 0.2 * (p.chargeMultiplier || 1);
      
      target.knockbackDx = Math.sign(p.dx) * (chargedKnockback * target.knockbackMultiplier);
      target.dy = -8 * Math.sqrt(p.chargeMultiplier || 1);
      target.knockbackMultiplier = Math.min(target.knockbackMultiplier + chargeDamage, 11);

      // Add hit stretch effect
      target.stretchFactor = 1.3;

      projectiles.splice(i, 1);
      continue;
    }    

    if (p.x < 0 || p.x > canvas.width) {
      projectiles.splice(i, 1);
    }
  }
}

function drawProjectileCharging(player) {
  if (!player.chargingProjectile) return;
  
  const chargeProgress = player.projectileChargeTime / MAX_CHARGE_TIME;
  
  // Draw projectile charging indicator
  const dir = player.facing;
  const chargedSize = Math.round(20 + (player.projectileChargeMultiplier - 1) * 15);
  const projectileX = player.x + (dir === 1 ? player.width + 10 : -chargedSize - 10);
  const projectileY = player.y + player.height / 2 - chargedSize/2;
  
  // Pulsing effect
  const pulse = Math.sin(player.projectileChargeTime * 0.4) * 0.3 + 0.7;
  
  // Draw charging projectile
  const intensity = Math.round(255 * chargeProgress);
  ctx.fillStyle = `rgba(255, ${255 - intensity * 0.5}, 0, ${0.3 + chargeProgress * 0.5})`;
  ctx.globalAlpha = pulse;
  ctx.fillRect(projectileX, projectileY, chargedSize, chargedSize);
  
  // Draw charge bar above projectile
  const barWidth = 40;
  const barHeight = 6;
  const barX = projectileX + (chargedSize - barWidth) / 2;
  const barY = projectileY - 15;
  
  // Background bar
  ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
  ctx.fillRect(barX, barY, barWidth, barHeight);
  
  // Charge progress bar
  ctx.fillStyle = `rgba(255, ${255 - chargeProgress * 255}, 0, 0.8)`;
  ctx.fillRect(barX, barY, barWidth * chargeProgress, barHeight);
  
  ctx.globalAlpha = 1;
}

function drawProjectiles() {
  projectiles.forEach(p => {
    // Color intensity based on charge
    const charge = p.chargeMultiplier || 1;
    const intensity = Math.round(255 * Math.min(charge / MAX_CHARGE_MULTIPLIER, 1));
    ctx.fillStyle = `rgb(255, ${255 - intensity * 0.5}, 0)`; // Gold to orange-red
    
    // Add glow effect for charged projectiles
    if (charge > 1.5) {
      ctx.shadowColor = ctx.fillStyle;
      ctx.shadowBlur = 10;
    }
    
    ctx.fillRect(p.x, p.y, p.width, p.height);
    
    // Reset shadow
    ctx.shadowBlur = 0;
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
    player.knockbackMultiplier = 1;
    player.charging = false;
    player.chargeTime = 0;
    player.chargeMultiplier = 1;
    player.chargingProjectile = false;
    player.projectileChargeTime = 0;
    player.projectileChargeMultiplier = 1;
    // Reset animation properties
    player.animationFrame = 0;
    player.squishFactor = 1;
    player.stretchFactor = 1;
    player.floatOffset = 0;
    // New: Reset punch/projectile cooldowns to ensure they are ready for the new game
    player.punchCooldown = 0;
    player.projectileCooldown = 0;
    player.punching = false; // Ensure punching state is false
    player.charging = false; // Ensure charging state is false
    player.chargingProjectile = false; // Ensure projectile charging state is false

    updateStockDisplay(player);
    updatePercentDisplay(player); // Also update percentage on reset
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
  
  // Update animations
  updatePlayerAnimation(player1);
  updatePlayerAnimation(player2);

  player1.dx *= 0.95;
  player2.dx *= 0.95;

  checkFallOff(player1, platform.x + platform.width/7);
  checkFallOff(player2, platform.x + platform.width - 100);

  handlePunching(player1, player2, 'r');
  handlePunching(player2, player1, 'k');

  shootProjectile(player1, 't');
  shootProjectile(player2, 'l');

  updateProjectiles();

  if (!gameOver && (player1.stocks <= 0 || player2.stocks <= 0)) {
    gameOver = true;
    restartBtn.style.display = 'block';
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height);
drawPlatform();
drawPlayer(player1); // Removed color argument
drawPlayer(player2); // Removed color argument
drawPunch(player1, '#FF0000'); // You can make these dynamic too if you want, but for now they are fine.
drawPunch(player2, '#0000FF'); // Same here
drawProjectileCharging(player1);
drawProjectileCharging(player2);
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
  ctx.fillText(`${player1.stocks <= 0 ? 'Player 2' : 'Player 1'} Wins!`, canvas.width / 2, canvas.height / 2 - 60);
}

function getDarkenedColor(baseColor, multiplier) {
    const maxMultiplier = 10;
    const factor = Math.min(multiplier / maxMultiplier, 1); // clamp between 0 and 1

    // Convert hex color to RGB
    let hex = baseColor.startsWith('#') ? baseColor.slice(1) : baseColor;
    // Handle 3-digit hex (e.g., #F00)
    if (hex.length === 3) {
        hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
    }
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    const darken = 1 - factor * 0.7; // reduce brightness by up to 70%

    return `rgb(${Math.round(r * darken)}, ${Math.round(g * darken)}, ${Math.round(b * darken)})`;
}

function drawPlayer(player) { // Removed baseColor parameter
    const color = getDarkenedColor(player.color, player.knockbackMultiplier); // Use player.color
    ctx.fillStyle = color;
  
  // Calculate animated dimensions and position
  const animatedWidth = player.width * (player.grounded ? player.squishFactor : 1/player.stretchFactor);
  const animatedHeight = player.height * (player.grounded ? 1/player.squishFactor : player.stretchFactor);
  
  // Adjust position to keep player centered during animation
  const animatedX = player.x + (player.width - animatedWidth) / 2;
  const animatedY = player.y + (player.height - animatedHeight) + (player.floatOffset || 0);
  
  // Add subtle rotation when in air for more dynamic feel
  if (!player.grounded && Math.abs(player.dx) > 2) {
    ctx.save();
    ctx.translate(animatedX + animatedWidth/2, animatedY + animatedHeight/2);
    ctx.rotate(player.dx * 0.02); // Slight rotation based on horizontal movement
    ctx.fillRect(-animatedWidth/2, -animatedHeight/2, animatedWidth, animatedHeight);
    ctx.restore();
  } else {
    ctx.fillRect(animatedX, animatedY, animatedWidth, animatedHeight);
  }
  
  // Draw a subtle shadow when jumping
  if (!player.grounded) {
    const shadowY = platform.y + 5;
    const shadowAlpha = Math.max(0.1, 0.3 - (player.y - platform.y) / 200);
    const shadowWidth = animatedWidth * (0.8 - (player.y - platform.y) / 400);
    
    ctx.fillStyle = `rgba(0, 0, 0, ${shadowAlpha})`;
    ctx.fillRect(
      player.x + (player.width - shadowWidth) / 2, 
      shadowY, 
      shadowWidth, 
      8
    );
  }
}

function drawPlatform() {
  ctx.fillStyle = '#8B4513';
  ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
}

function gameLoop() {
    if (!gameStarted) {
        // Do nothing if game hasn't started yet, character select screen is active
        return;
    }

    updateGame();
    updatePercentDisplay(player1);
    updatePercentDisplay(player2);
    if (gameOver) {
        drawWinnerText();
        return;
    }
    requestAnimationFrame(gameLoop);
}

// New: Initial setup: display character select screen and hide game UI
characterSelectScreen.style.display = 'flex';
gameUI.style.display = 'none'; // Hide game UI until game starts