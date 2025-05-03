// Get the canvas element and set up its context
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game configuration variables
const GRAVITY = 1.5;
const JUMP_STRENGTH = 25;
const PLAYER_SPEED = 10;
const MAX_JUMPS = 2;  // Maximum number of jumps (including double jump)

// Set the canvas size to full screen
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Define the player object
const player = {
  x: 1000,
  y: canvas.height - 50,
  width: 50,
  height: 50,
  speed: PLAYER_SPEED,
  dx: 0,
  dy: 0,
  jumping: false,
  grounded: false,
  jumpsLeft: MAX_JUMPS,  // Track number of jumps left
};

// Define the platform object (covers half the screen width)
const platform = {
  x: canvas.width / 4,  // Start the platform at one-fourth of the screen width
  y: canvas.height - 500,
  width: canvas.width / 2,  // Platform takes half the screen width
  height: 100,
};

// Control input keys
const keys = {
  left: false,
  right: false,
  up: false,
};

// Handle keydown and keyup events for player movement
window.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowLeft') keys.left = true;
  if (e.key === 'ArrowRight') keys.right = true;
  if (e.key === 'ArrowUp') {
    if (player.jumpsLeft > 0) {  // Check if the player has jumps left
      player.dy = -JUMP_STRENGTH;
      player.jumping = true;
      player.grounded = false;
      player.jumpsLeft--;  // Decrease jumps left
    }
  }
});

window.addEventListener('keyup', (e) => {
  if (e.key === 'ArrowLeft') keys.left = false;
  if (e.key === 'ArrowRight') keys.right = false;
});

// Function to move the player based on input
function movePlayer() {
  if (keys.left) {
    player.dx = -player.speed;
  } else if (keys.right) {
    player.dx = player.speed;
  } else {
    player.dx = 0;
  }

  player.x += player.dx;

  // Ensure the player stays within the screen boundaries
  if (player.x < 0) player.x = 0;
  if (player.x + player.width > canvas.width) player.x = canvas.width - player.width;
}

// Function to handle gravity and jumping
function applyGravity() {
  // Check for collision with the platform
  if (player.y + player.height >= platform.y && player.dy >= 0 && player.x + player.width > platform.x && player.x < platform.x + platform.width) {
    player.dy = 0;
    player.y = platform.y - player.height;
    player.grounded = true;
    player.jumping = false;
    player.jumpsLeft = MAX_JUMPS;  // Reset jumps when the player lands on the platform
  } else {
    player.dy += GRAVITY; // Apply gravity if not on the ground
    player.grounded = false;
  }

  player.y += player.dy;
}

// Function to reset player to the platform when they fall off the screen
function checkFallOff() {
  if (player.y > canvas.height) {
    player.x = 1000;  // Reset player's position
    player.y = platform.y - player.height; // Reset to the platform's y position
    player.dy = 0;  // Reset vertical velocity
    player.jumping = false;
    player.grounded = true;
    player.jumpsLeft = MAX_JUMPS;  // Reset jumps when respawning
  }
}

// Function to update the game state
function updateGame() {
  movePlayer();
  applyGravity();
  checkFallOff();  // Check if the player fell off the screen

  // Redraw the game
  ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear the canvas
  drawPlatform();
  drawPlayer();
}

// Function to draw the player on the screen
function drawPlayer() {
  ctx.fillStyle = '#FF6347'; // Red color for the player
  ctx.fillRect(player.x, player.y, player.width, player.height);
}

// Function to draw the platform on the screen
function drawPlatform() {
  ctx.fillStyle = '#8B4513'; // Brown color for the platform
  ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
}

// Main game loop
function gameLoop() {
  updateGame();
  requestAnimationFrame(gameLoop); // Keep the game loop running
}

// Start the game
gameLoop();
