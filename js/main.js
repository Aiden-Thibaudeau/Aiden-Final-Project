import { loadImages } from './assets.js';
import { 
    handlePunching, 
    shootProjectile, 
    updateProjectiles,
    projectiles 
} from './combat.js';
import { 
    createPlayer, 
    movePlayer, 
    applyGravity, 
    updatePlayerAnimation, 
    resetPlayer,
    applyColorStats  // Add this import
} from './player.js';
import { 
    drawBackground,
    drawPlatform,
    drawPlayer,
    drawPunch,
    drawProjectileCharging,
    drawProjectiles,
    drawWinnerText
} from './render.js';
import {
    elements,
    ctx,
    player1SelectedColor,
    player2SelectedColor,
    initializeUI,
    showGameUI,
    toggleRestartButton,
    updateStockDisplay,
    updatePercentDisplay
} from './ui.js';
import { initializeControls, resetKeyStates } from './input.js';

let gameOver = false;
let gameStarted = false;
let lastFrameTime = 0;
const TARGET_FPS = 60;
const FRAME_TIME = 1000 / TARGET_FPS;
let frameCounter = 0;
let lastFpsUpdate = 0;
let currentFps = 0;

// Initialize canvas dimensions
elements.canvas.width = window.innerWidth;
elements.canvas.height = window.innerHeight;

// Create platform
const platform = {
    x: elements.canvas.width / 4,
    y: elements.canvas.height / 2,
    width: elements.canvas.width / 2,
    height: 100
};

// Create players
const player1 = createPlayer(platform.x + platform.width/7, platform.y);
const player2 = createPlayer(platform.x + platform.width - 100, platform.y);

// Initialize stock display
updateStockDisplay(player1, true);
updateStockDisplay(player2, false);
updatePercentDisplay(player1, true);
updatePercentDisplay(player2, false);

/**
 * Initialize game
 */
function initGame() {
    // Initialize UI
    initializeUI();
    
    // Initialize controls
    initializeControls(player1, player2);
    
    // Set up start game handler
    elements.startGameBtn.addEventListener('click', startGame);
    
    // Set up restart handler
    elements.restartBtn.addEventListener('click', restartGame);
    
    // Load images
    loadImages();
}

/**
 * Start new game
 */
function startGame() {
    console.log('Game started!');
    gameStarted = true;
    gameOver = false;
    
    // Reset stocks
    player1.stocks = 3;
    player2.stocks = 3;

    // Set player colors and apply their stats
    player1.color = player1SelectedColor;
    player2.color = player2SelectedColor;
    applyColorStats(player1, player1SelectedColor);
    applyColorStats(player2, player2SelectedColor);
    
    // Reset players
    resetPlayer(player1, platform.x + platform.width/7, platform.y);
    resetPlayer(player2, platform.x + platform.width - 100, platform.y);
    
    // Show game UI and update displays
    showGameUI();
    
    // Update UI displays
    updateStockDisplay(player1, true);
    updateStockDisplay(player2, false);
    updatePercentDisplay(player1, true);
    updatePercentDisplay(player2, false);
    
    // Start game loop
    gameLoop();
}

/**
 * Restart game
 */
function restartGame() {
    console.log('Game restarted!');
    gameOver = false;
    toggleRestartButton(false);
    
    // Reset stocks
    player1.stocks = 3;
    player2.stocks = 3;
    
    // Reapply color stats before resetting players
    applyColorStats(player1, player1.color);
    applyColorStats(player2, player2.color);
    
    // Reset players
    resetPlayer(player1, platform.x + platform.width/7, platform.y);
    resetPlayer(player2, platform.x + platform.width - 100, platform.y);
    
    // Reset keys
    resetKeyStates();
    
    // Start game loop
    requestAnimationFrame(gameLoop);
}

/**
 * Check if player fell off stage
 */
function checkFallOff(player, spawnX) {
    const playerRenderHeight = player.height * 2;
    
    // Check for falling off the bottom
    if (player.y > elements.canvas.height + playerRenderHeight) {
        console.log('Player fell off bottom!');
        handlePlayerLoss(player, spawnX);
    }
    // Check for falling off the left side
    else if (player.x + player.width < -150) {
        console.log('Player fell off left!');
        handlePlayerLoss(player, spawnX);
    }
    // Check for falling off the right side
    else if (player.x > elements.canvas.width + 150) {
        console.log('Player fell off right!');
        handlePlayerLoss(player, spawnX);
    }
}

/**
 * Handle player loss
 */
function handlePlayerLoss(player, spawnX) {
    if (player.stocks > 1) {
        player.stocks--;
        updateStockDisplay(player, player === player1);
        resetPlayer(player, spawnX, platform.y);
    } else {
        player.stocks = 0;
        updateStockDisplay(player, player === player1);
        gameOver = true;
        toggleRestartButton(true);
    }
}

/**
 * Update game state
 */
function updateGame() {
    // Move players
    movePlayer(player1, 'a', 'd');
    movePlayer(player2, 'ArrowLeft', 'ArrowRight');
    
    // Apply gravity
    applyGravity(player1, platform);
    applyGravity(player2, platform);
    
    // Update animations
    updatePlayerAnimation(player1);
    updatePlayerAnimation(player2);
    
    // Apply friction
    player1.dx *= 0.95;
    player2.dx *= 0.95;
    
    // Check boundaries
    checkFallOff(player1, platform.x + platform.width/7);
    checkFallOff(player2, platform.x + platform.width - 100);
    
    // Handle combat
    handlePunching(player1, player2, 'r');
    handlePunching(player2, player1, 'k');
    
    shootProjectile(player1, 't');
    shootProjectile(player2, 'l');
    
    updateProjectiles(player1, player2);
    
    // Update UI
    updatePercentDisplay(player1, true);
    updatePercentDisplay(player2, false);
}

/**
 * Render game
 */
function render() {
    ctx.clearRect(0, 0, elements.canvas.width, elements.canvas.height);
    
    drawBackground(ctx);
    drawPlatform(ctx, platform);
    drawPlayer(ctx, player1, player1, player2);
    drawPlayer(ctx, player2, player1, player2);
    drawPunch(ctx, player1, '#FF0000');
    drawPunch(ctx, player2, '#0000FF');
    drawProjectileCharging(ctx, player1);
    drawProjectileCharging(ctx, player2);
    drawProjectiles(ctx, projectiles);
    
    if (gameOver) {
        drawWinnerText(ctx, player1);
    }
}

/**
 * Game loop with timing control
 */
function gameLoop(timestamp) {
    if (!gameStarted) return;
    
    // Calculate time since last frame
    const deltaTime = timestamp - lastFrameTime;
    
    // Skip frame if too soon
    if (deltaTime < FRAME_TIME) {
        requestAnimationFrame(gameLoop);
        return;
    }
    
    // FPS calculation
    frameCounter++;
    if (timestamp - lastFpsUpdate >= 1000) {
        currentFps = frameCounter;
        frameCounter = 0;
        lastFpsUpdate = timestamp;
        console.log('FPS:', currentFps);
    }
    
    lastFrameTime = timestamp;
    
    if (!gameOver) {
        updateGame();
    }
    
    render();
    
    if (!gameOver) {
        requestAnimationFrame(gameLoop);
    }
}

// Initialize game when loaded
window.addEventListener('load', initGame);