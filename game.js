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

// Define how far off-screen a player can go before losing a stock
const HORIZONTAL_BOUNDARY_OFFSET = 150; // Pixels off screen before losing a stock

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const platform = {
  x: canvas.width / 4,
  y: canvas.height / 2,
  width: canvas.width / 2,
  height: 100,
};

/**
 * Creates a new player object with default properties.
 * @param {number} x - The initial x position of the player.
 * @returns {Object} The player object.
 */
function createPlayer(x) {
  const player = {
    x: x,
    y: platform.y,
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
  console.log('Created player at x:', x);
  return player;
}

// Global player objects, colors will be set during selection
const player1 = createPlayer(platform.x + platform.width/7);
const player2 = createPlayer(platform.x + platform.width -100);

// New: Player selected colors
let player1SelectedColor = '#FF6347'; // Default color for Player 1
let player2SelectedColor = '#4682B4'; // Default color for Player 2

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

// Updated image loading system - removed platform image
let imagesLoaded = 0;
const totalImages = 11; // background + 10 player images (no platform image)
let allImagesLoaded = false;

const backgroundImage = new Image();
// Removed platformImage

// Create objects to store all player images
const player1Images = {};
const player2Images = {};

// Color mapping for filenames
const colorNames = {
  '#FF6347': 'red',
  '#4682B4': 'blue', 
  '#32CD32': 'green',
  '#FFD700': 'gold',
  '#8A2BE2': 'purple'
};

// Image loading function - removed platform image loading
function loadImages() {
    console.log('Loading images...');
    backgroundImage.onload = () => {
        imagesLoaded++;
        checkAllImagesLoaded();
    };
    backgroundImage.onerror = () => {
        imagesLoaded++;
        checkAllImagesLoaded();
    };

    // Load all player 1 images
    Object.entries(colorNames).forEach(([colorCode, colorName]) => {
        const img = new Image();
        img.onload = () => {
            imagesLoaded++;
            checkAllImagesLoaded();
        };
        img.onerror = () => {
            imagesLoaded++;
            checkAllImagesLoaded();
        };
        img.src = `player1${colorName}.png`;
        player1Images[colorCode] = img;
    });

    // Load all player 2 images
    Object.entries(colorNames).forEach(([colorCode, colorName]) => {
        const img = new Image();
        img.onload = () => {
            imagesLoaded++;
            checkAllImagesLoaded();
        };
        img.onerror = () => {
            imagesLoaded++;
            checkAllImagesLoaded();
        };
        img.src = `player2${colorName}.png`;
        player2Images[colorCode] = img;
    });

    // Set background image source
    backgroundImage.src = 'background.jpg';
}

/**
 * Checks if all images have finished loading and updates the flag.
 */
function checkAllImagesLoaded() {
    if (imagesLoaded >= totalImages) {
        allImagesLoaded = true;
        console.log('All images loaded.');
    }
}

/**
 * Returns the correct player image based on the player and their color.
 * @param {Object} player - The player object.
 * @returns {HTMLImageElement|null} The image element or null if not found.
 */
function getPlayerImage(player) {
    if (player === player1) {
        return player1Images[player.color] || null;
    } else if (player === player2) {
        return player2Images[player.color] || null;
    }
    return null;
}

/**
 * Sets up color selection UI for a player and updates preview on selection.
 * @param {HTMLElement} playerColorOptions - The color options container.
 * @param {HTMLElement} playerPreview - The preview element.
 * @param {number} playerNumber - 1 for player1, 2 for player2.
 */
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
                console.log('Player 1 selected color:', color);
            } else {
                player2SelectedColor = color;
                player2Preview.style.backgroundColor = color;
                console.log('Player 2 selected color:', color);
            }
        });
    });
}

// Set up selection for both players
setupColorSelection(player1ColorOptions, player1Preview, 1);
setupColorSelection(player2ColorOptions, player2Preview, 2);

// Start Game Button Logic
startGameBtn.addEventListener('click', () => {
    console.log('Game started!');
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

/**
 * Updates the animation state for a player (stretch, squish, float, etc).
 * @param {Object} player - The player object.
 */
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
  // Log animation state occasionally
  if (player.animationFrame % 60 === 0) {
    console.log('Player animationFrame:', player.animationFrame, 'stretch:', player.stretchFactor, 'squish:', player.squishFactor);
  }
}

/**
 * Handles left/right movement for a player based on key input.
 * @param {Object} player - The player object.
 * @param {string} leftKey - Key for moving left.
 * @param {string} rightKey - Key for moving right.
 */
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
  if (moveDx !== 0) {
    console.log('Player moving', moveDx > 0 ? 'right' : 'left', 'to x:', player.x);
  }

  player.knockbackDx *= 0.8;
  if (Math.abs(player.knockbackDx) < 0.1) player.knockbackDx = 0;
}

/**
 * Applies gravity and platform collision for a player.
 * @param {Object} player - The player object.
 */
function applyGravity(player) {
  const wasGrounded = player.grounded;
  player.dy += GRAVITY;
  const nextY = player.y + player.dy;

  // Use the actual rendered height (doubled) for collision detection
  const playerRenderHeight = player.height * 2;

  const onPlatform = (
    player.dy > 0 &&
    player.y + playerRenderHeight <= platform.y &&
    nextY + playerRenderHeight >= platform.y &&
    player.x + player.width > platform.x &&
    player.x < platform.x + platform.width
  );

  if (onPlatform) {
    player.dy = 0;
    // Position player so their bottom edge sits on top of platform
    player.y = platform.y - playerRenderHeight;
    player.grounded = true;
    player.jumping = false;
    player.jumpsLeft = MAX_JUMPS;
    
    // Add landing squish effect if just landed
    if (!wasGrounded && player.dy > 8) {
      player.squishFactor = 0.7; // Squish down
      console.log('Player landed with squish! Y:', player.y);
    } else if (!wasGrounded) {
      player.squishFactor = 0.85; // Light squish
    }
  } else {
    player.grounded = false;
  }

  player.y += player.dy;
}

/**
 * Updates the stock (lives) display for a player in the UI.
 * @param {Object} player - The player object.
 */
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

/**
 * Updates the percent (damage) display for a player in the UI.
 * @param {Object} player - The player object.
 */
function updatePercentDisplay(player) {
  const percentId = player === player1 ? 'player1Percent' : 'player2Percent';
  const percentContainer = document.getElementById(percentId);

  percentContainer.textContent = `${Math.round((player.knockbackMultiplier - 1) * 10)}%`;
}

/**
 * Checks if a player has fallen off the stage and handles stock loss/reset.
 * @param {Object} player - The player object.
 * @param {number} spawnX - The x position to respawn at.
 */
function checkFallOff(player, spawnX) {
  const playerRenderHeight = player.height * 2;
  
  // Check for falling off the bottom
  if (player.y > canvas.height + playerRenderHeight) {
    console.log('Player fell off bottom! Stocks left:', player.stocks - 1);
    if (player.stocks > 1) {
      player.stocks--;
      updateStockDisplay(player);
      resetPlayer(player, spawnX, platform.y - playerRenderHeight);
    } else {
      player.stocks = 0;
      updateStockDisplay(player);
    }
  }
  // Check for falling off the left side
  else if (player.x + player.width < -HORIZONTAL_BOUNDARY_OFFSET) {
    console.log('Player fell off left! Stocks left:', player.stocks - 1);
    if (player.stocks > 1) {
      player.stocks--;
      updateStockDisplay(player);
      resetPlayer(player, spawnX, platform.y - playerRenderHeight);
    } else {
      player.stocks = 0;
      updateStockDisplay(player);
    }
  }
  // Check for falling off the right side
  else if (player.x > canvas.width + HORIZONTAL_BOUNDARY_OFFSET) {
    console.log('Player fell off right! Stocks left:', player.stocks - 1);
    if (player.stocks > 1) {
      player.stocks--;
      updateStockDisplay(player);
      resetPlayer(player, spawnX, platform.y - playerRenderHeight);
    } else {
      player.stocks = 0;
      updateStockDisplay(player);
    }
  }
}

/**
 * Handles punch charging, punching, and punch collision/knockback.
 * @param {Object} attacker - The player attacking.
 * @param {Object} defender - The player being attacked.
 * @param {string} punchKey - The key for punching.
 */
function handlePunching(attacker, defender, punchKey) {
  // Handle charging
  if (keys[punchKey] && attacker.punchCooldown <= 0 && !attacker.punching) {
    if (!attacker.charging) {
      attacker.charging = true;
      attacker.chargeTime = 0;
      console.log('Player started charging punch');
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
    console.log('Player released punch! Multiplier:', attacker.chargeMultiplier.toFixed(2));
  }

  if (attacker.punching) {
    attacker.punchTimer--;
    if (attacker.punchTimer <= 0) {
      attacker.punching = false;
      attacker.chargeMultiplier = 1; // Reset charge multiplier
    } else {
      const punchWidth = 60;
      const punchHeight = 30;
      // Fixed punch collision box positioning (uses actual player size, not doubled)
      const punchX = attacker.facing === 1 ? attacker.x + attacker.width * 2 : attacker.x - punchWidth;
      const punchY = attacker.y + (attacker.height * 2) / 4;
  
      if (
        punchX < defender.x + defender.width * 2 &&
        punchX + punchWidth > defender.x &&
        punchY < defender.y + defender.height * 2 &&
        punchY + punchHeight > defender.y
      ) {
        console.log('Punch hit! Defender knockbackMultiplier:', defender.knockbackMultiplier.toFixed(2));
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

/**
 * Draws the punch or charge effect for a player.
 * @param {Object} player - The player object.
 * @param {string} color - The color to use for the punch effect.
 */
function drawPunch(player, color) {
    if (!player.punching && !player.charging) return;

    const punchWidth = 60;
    const punchHeight = 30;
    // Adjusted visual punch positioning
    const punchX = player.facing === 1 ? player.x + player.width * 2 - 10 : player.x - punchWidth + 10; // Moved 10px closer
    const punchY = player.y + (player.height * 2) / 2; // Moved further down

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

        // Draw charge bar above player - positioned correctly for doubled size
        const barWidth = 60;
        const barHeight = 8;
        const barX = player.x + (player.width * 2 - barWidth) / 2; // Center above player
        const barY = player.y - 15;

        // Background bar
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(barX, barY, barWidth, barHeight);

        // Charge progress bar
        ctx.fillStyle = `rgba(255, ${255 - chargeProgress * 255}, 0, 0.8)`;
        ctx.fillRect(barX, barY, barWidth * chargeProgress, barHeight);

        ctx.globalAlpha = 1;
    }
}


/**
 * Handles projectile charging, firing, and cooldown for a player.
 * @param {Object} player - The player object.
 * @param {string} key - The key for shooting projectiles.
 */
function shootProjectile(player, key) {
  // Handle projectile charging
  if (keys[key] && player.projectileCooldown <= 0) {
    if (!player.chargingProjectile) {
      player.chargingProjectile = true;
      player.projectileChargeTime = 0;
      console.log('Player started charging projectile');
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
      y: player.y + (player.height * 2) / 2 - chargedSize/2, // Corrected Y-position
      width: chargedSize,
      height: chargedSize,
      dx: chargedSpeed * dir,
      owner: player,
      chargeMultiplier: player.projectileChargeMultiplier
    });
    console.log('Player fired projectile! Multiplier:', player.projectileChargeMultiplier.toFixed(2));
    
    player.projectileCooldown = PROJECTILE_COOLDOWN;
    player.projectileChargeMultiplier = 1; // Reset charge multiplier
  }

  if (player.projectileCooldown > 0) {
    player.projectileCooldown--;
  }
}

/**
 * Updates all projectiles, moves them, checks for collisions, and applies effects.
 */
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
      console.log('Projectile hit! Target knockbackMultiplier:', target.knockbackMultiplier.toFixed(2));
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

    // Projectiles also disappear if they go too far off screen
    if (p.x < -p.width || p.x > canvas.width + p.width) {
      console.log('Projectile removed (off screen)');
      projectiles.splice(i, 1);
    }
  }
}

/**
 * Draws the projectile charging indicator for a player.
 * @param {Object} player - The player object.
 */
function drawProjectileCharging(player) {
  if (!player.chargingProjectile) return;
  
  const chargeProgress = player.projectileChargeTime / MAX_CHARGE_TIME;
  
  // Draw projectile charging indicator - positioned for doubled player size
  const dir = player.facing;
  const chargedSize = Math.round(20 + (player.projectileChargeMultiplier - 1) * 15);
  
  // FIXED: Corrected horizontal position calculation
  const projectileX = dir === 1 ? player.x + player.width * 2 + 10 : player.x - chargedSize - 10;
  const projectileY = player.y + player.height * 2 / 2 - chargedSize/2;
  
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

/**
 * Draws all active projectiles on the canvas.
 */
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

/**
 * Resets a player's state and position after losing a stock or starting a game.
 * @param {Object} player - The player object.
 * @param {number} spawnX - The x position to respawn at.
 */
function resetPlayer(player, spawnX,) {
  if (player.stocks === 3) {  
    player.x = spawnX;
    player.y = 110;
  } else {
    player.x = 750;
    player.y = 200;
  }
    player.dx = 0;
    player.knockbackDx = 0;
    player.dy = 0;
    player.jumping = false;
    player.grounded = true;
    player.jumpsLeft = MAX_JUMPS;
    // player.stocks is NOT reset here, it's handled by checkFallOff
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

/**
 * Resets all key states to false (no keys pressed).
 */
function resetKeyStates() {
  for (const key in keys) {
    keys[key] = false;
  }
}

/**
 * Updates all game logic for one frame (movement, attacks, projectiles, etc).
 */
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

    // Pass the initial spawnX to checkFallOff for each player
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
        console.log('Game over! Winner:', player1.stocks <= 0 ? 'Player 2' : 'Player 1');
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBackground(); // NEW: Draw background first
    drawPlatform();
    drawPlayer(player1);
    drawPlayer(player2);
    drawPunch(player1, '#FF0000');
    drawPunch(player2, '#0000FF');
    drawProjectileCharging(player1);
    drawProjectileCharging(player2);
    drawProjectiles();
}

restartBtn.addEventListener('click', () => {
  console.log('Game restarted!');
  gameOver = false;
  restartBtn.style.display = 'none';
  // Reset players to initial state with 3 stocks
  player1.stocks = 3;
  player2.stocks = 3;
  resetPlayer(player1, platform.x + platform.width/7, platform.y - player1.height);
  resetPlayer(player2, platform.x + platform.width - 100, platform.y - player2.height);
  requestAnimationFrame(gameLoop);
});

/**
 * Draws the winner text overlay when the game ends.
 */
function drawWinnerText() {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = player1.stocks <= 0 ? '#4682B4' : '#FF6347';
  ctx.font = '60px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(`${player1.stocks <= 0 ? 'Player 2' : 'Player 1'} Wins!`, canvas.width / 2, canvas.height / 2 - 60);
}

/**
 * Returns a darkened version of a color based on a multiplier (for damage effects).
 * @param {string} baseColor - The base color in hex.
 * @param {number} multiplier - The knockback multiplier.
 * @returns {string} The darkened RGB color string.
 */
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

/**
 * Draws a player character with animation, color, and facing direction.
 * @param {Object} player - The player object.
 */
function drawPlayer(player) {
    // Calculate animated dimensions and position (doubled in size)
    const animatedWidth = player.width * 1.5 * (player.grounded ? player.squishFactor : 1 / player.stretchFactor);
    const animatedHeight = player.height * 1.5 * (player.grounded ? 1 / player.squishFactor : player.stretchFactor);
    
    // Adjust position to keep player centered during animation
    const animatedX = player.x + (player.width * 2 - animatedWidth) / 2;
    const animatedY = player.y + (player.height * 2 - animatedHeight) + (player.floatOffset || 0);
    
    ctx.save();
    
    // Mirror image based on facing direction
    if (player.facing === -1) {
        ctx.scale(-1, 1);
    }
    
    // Get the correct image based on player and selected color
    const currentPlayerImage = getPlayerImage(player);

    // Add subtle rotation when in air for more dynamic feel
    if (!player.grounded && Math.abs(player.dx) > 2) {
        const centerX = player.facing === -1 ? -(animatedX + animatedWidth/2) : animatedX + animatedWidth/2;
        const centerY = animatedY + animatedHeight/2;
        
        ctx.translate(centerX, centerY);
        ctx.rotate(player.dx * 0.02); // Slight rotation based on horizontal movement
        
        // Check if the specific player image is loaded and valid
        if (currentPlayerImage && currentPlayerImage.complete && currentPlayerImage.naturalWidth > 0) {
            // Draw the image to fill the entire character hitbox
            ctx.drawImage(currentPlayerImage, -animatedWidth/2, -animatedHeight/2, animatedWidth, animatedHeight);
        } else {
            // Fallback to colored rectangle (keeping original player color)
            ctx.fillStyle = player.color;
            ctx.fillRect(-animatedWidth/2, -animatedHeight/2, animatedWidth, animatedHeight);
        }
    } else {
        const drawX = player.facing === -1 ? -(animatedX + animatedWidth) : animatedX;
        const drawY = animatedY;
        
        // Check if the specific player image is loaded and valid
        if (currentPlayerImage && currentPlayerImage.complete && currentPlayerImage.naturalWidth > 0) {
            // Draw the image to fill the entire character hitbox
            ctx.drawImage(currentPlayerImage, drawX, drawY, animatedWidth, animatedHeight);
        } else {
            // Fallback to colored rectangle (keeping original player color)
            ctx.fillStyle = player.color;
            ctx.fillRect(drawX, drawY, animatedWidth, animatedHeight);
        }
    }
    
    ctx.restore();
}

/**
 * Draws the platform using canvas gradients and lines.
 */
function drawPlatform() {
    const x = platform.x;
    const y = platform.y;
    const width = platform.width;
    const height = platform.height;
    
    // Save the current state
    ctx.save();
    
    // Create gradient for platform surface
    const surfaceGradient = ctx.createLinearGradient(x, y, x, y + height * 0.3);
    surfaceGradient.addColorStop(0, '#D2B48C'); // Light tan
    surfaceGradient.addColorStop(1, '#8B7355'); // Darker tan
    
    // Create gradient for platform sides
    const sideGradient = ctx.createLinearGradient(x, y + height * 0.3, x, y + height);
    sideGradient.addColorStop(0, '#8B7355'); // Darker tan
    sideGradient.addColorStop(0.5, '#654321'); // Brown
    sideGradient.addColorStop(1, '#2F1B14'); // Dark brown
    
    // Draw platform top surface
    ctx.fillStyle = surfaceGradient;
    ctx.fillRect(x, y, width, height * 0.3);
    
    // Draw platform sides/base
    ctx.fillStyle = sideGradient;
    ctx.fillRect(x, y + height * 0.3, width, height * 0.7);
    
    // Add some texture lines to make it look more wooden
    ctx.strokeStyle = '#654321';
    ctx.lineWidth = 2;
    
    // Horizontal grain lines
    for (let i = 1; i < 4; i++) {
        const lineY = y + (height * 0.3 * i / 4);
        ctx.beginPath();
        ctx.moveTo(x + 10, lineY);
        ctx.lineTo(x + width - 10, lineY);
        ctx.stroke();
    }
    
    // Vertical wood grain lines
    ctx.lineWidth = 1;
    ctx.strokeStyle = '#5D4E37';
    for (let i = 0; i < 8; i++) {
        const lineX = x + (width * (i + 1) / 9);
        ctx.beginPath();
        ctx.moveTo(lineX, y + height * 0.3);
        ctx.lineTo(lineX, y + height);
        ctx.stroke();
    }
    
    // Add platform edge highlight
    ctx.strokeStyle = '#F5DEB3';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + width, y);
    ctx.stroke();
    
    // Add platform shadow/outline
    ctx.strokeStyle = '#2F1B14';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, width, height);
    
    // Restore the previous state
    ctx.restore();
}

/**
 * Draws the background image or a fallback gradient.
 */
function drawBackground() {
    if (backgroundImage.complete && backgroundImage.naturalWidth > 0) {
        // Draw background image, scaling to fit canvas
        ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);
    } else {
        // Fallback to gradient background
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, '#87CEEB'); // Sky blue
        gradient.addColorStop(1, '#98FB98'); // Pale green
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
}

/**
 * The main game loop: updates and draws the game each frame.
 */
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

loadImages();
