import { loadImages } from './assets.js';
import { 
    handlePunching, 
    shootProjectile, 
    updateProjectiles,
    projectiles, 
    updateParticles, 
    renderParticles,
    particles
} from './combat.js';
import { 
    createPlayer, 
    movePlayer, 
    applyGravity, 
    updatePlayerAnimation, 
    resetPlayer,
    applyColorStats
} from './player.js';
import { 
    drawBackground,
    drawPlatform,
    drawPlatforms,
    drawPlayer,
    drawPunch,
    drawProjectileCharging,
    drawProjectiles,
    drawWinnerText
} from './render.js';
import {
    elements,
    getContext,
    player1SelectedColor,
    player2SelectedColor,
    selectedStage,
    initializeUI,
    showGameUI,
    updateStockDisplay,
    updatePercentDisplay,
    isBot
} from './ui.js';
import { initializeControls, resetKeyStates } from './input.js';
import { setRestartButtonBounds } from './input.js';
import { updateBot } from './AI.js';

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

// Import stage layouts
import { stageLayouts } from './constants.js';

// Initialize empty platforms array
let platforms = [];

// Function to create platforms based on selected stage
function createPlatforms(stageName) {
    const layout = stageLayouts[stageName];
    return layout.platforms.map(p => ({
        x: p.x * elements.canvas.width,
        y: p.y * elements.canvas.height,
        width: p.width * elements.canvas.width,
        height: p.height
    }));
}

// Create initial platforms based on classic layout
const initialPlatforms = createPlatforms('classic');

// Create players at initial positions based on classic layout
const initialLayout = stageLayouts['classic'];
const player1 = createPlayer(
    initialLayout.spawns.player1.x * elements.canvas.width,
    initialLayout.spawns.player1.y * elements.canvas.height
);
const player2 = createPlayer(
    initialLayout.spawns.player2.x * elements.canvas.width,
    initialLayout.spawns.player2.y * elements.canvas.height
);

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
    if (elements.startGameBtn) {
        elements.startGameBtn.addEventListener('click', startGame);
    } else {
        console.error('Start game button not found');
    }
    
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
    
    // Create platforms for selected stage
    platforms = createPlatforms(selectedStage);
    console.log('Created platforms for stage:', selectedStage, platforms);
    
    // Reset stocks and positions
    player1.stocks = 3;
    player2.stocks = 3;
    
    // Update stock displays immediately
    updateStockDisplay(player1, true);
    updateStockDisplay(player2, false);
    
    // Set initial positions based on stage layout
    const layout = stageLayouts[selectedStage];
    player1.x = layout.spawns.player1.x * elements.canvas.width;
    player1.y = layout.spawns.player1.y * elements.canvas.height;
    player2.x = layout.spawns.player2.x * elements.canvas.width;
    player2.y = layout.spawns.player2.y * elements.canvas.height;

    // Set player colors and apply their stats
    player1.color = player1SelectedColor;
    player2.color = player2SelectedColor;
    applyColorStats(player1, player1SelectedColor);
    applyColorStats(player2, player2SelectedColor);

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
export function restartGame() {
    // Reset game state
    gameOver = false;
    gameStarted = false;
    
    // Hide game UI and restart button
    elements.gameUI.style.display = 'none';
    
    // Show character select screen
    elements.characterSelectScreen.style.display = 'flex';
    
    // Reset player states
    player1.stocks = 3;
    player2.stocks = 3;
    player1.knockbackMultiplier = 1;
    player2.knockbackMultiplier = 1;
    
    // Clear any existing projectiles and particles
    projectiles.length = 0;
    particles.length = 0;
    
    // Reset key states
    resetKeyStates();
}

/**
 * Check if player fell off stage
 */
function checkFallOff(player, isPlayer1) {
    const playerRenderHeight = player.height * 2;
    const layout = stageLayouts[selectedStage];
    
    // Check for falling off the stage
    if (player.y > elements.canvas.height + playerRenderHeight ||
        player.x + player.width < -150 ||
        player.x > elements.canvas.width + 150) {
        
        if (player.stocks > 1) {
            player.stocks--;
            updateStockDisplay(player, isPlayer1);
            const spawnPoint = isPlayer1 ? layout.spawns.player1 : layout.spawns.player2;
            resetPlayer(player, 
                spawnPoint.x * elements.canvas.width,
                spawnPoint.y * elements.canvas.height);
        } else {
            player.stocks = 0;
            updateStockDisplay(player, isPlayer1);
            gameOver = true;  // Simply set the gameOver flag
        }
    }
}

/**
 * Handle player loss
 */
function handlePlayerLoss(player, spawnX) {
    player.stocks--;
    
    if (player.stocks <= 0) {
        handleGameOver();
    } else {
        resetPlayer(player, spawnX, elements.canvas.height * 0.3);
    }
    
    // Update stock display
    updateStockDisplay(player, player === player1);
}

/**
 * Handle game over
 */
function handleGameOver() {
    gameOver = true;
    gameStarted = false;
    
    // Ensure the gameUI is visible
    elements.gameUI.style.display = 'block';
    
    // Show the restart button
    elements.restartBtn.style.display = 'block';
    
    // Stop any ongoing game processes
    cancelAnimationFrame(gameLoop);
}

/**
 * Update game state
 */
function updateGame() {
    // Move players
    movePlayer(player1, 'a', 'd');
    if (!isBot) {
        movePlayer(player2, 'ArrowLeft', 'ArrowRight');
    } else {
        updateBot(player2, player1, platforms);
        movePlayer(player2, 'ArrowLeft', 'ArrowRight'); // Apply bot's movement choices
    }

    // Apply gravity
    applyGravity(player1, platforms);
    applyGravity(player2, platforms);
    
    // Update animations
    updatePlayerAnimation(player1);
    updatePlayerAnimation(player2);
    
    // Apply friction
    player1.dx *= 0.95;
    player2.dx *= 0.95;
    
    // Check boundaries
    checkFallOff(player1, true);
    checkFallOff(player2, false);
    
    // Handle combat
    handlePunching(player1, player2, 'r');
    handlePunching(player2, player1, 'k'); // Let bot punch if it chose to
    
    // Handle projectiles
    shootProjectile(player1, 't');
    shootProjectile(player2, 'l'); // Let bot shoot if it chose to
    
    updateProjectiles(player1, player2);
    
    // Update particle effects
    updateParticles();
    
    // Update UI
    updatePercentDisplay(player1, true);
    updatePercentDisplay(player2, false);
}

/**
 * Render game
 */
function render() {
    const ctx = getContext();
    if (!ctx) return;
    
    // Draw all game elements
    ctx.clearRect(0, 0, elements.canvas.width, elements.canvas.height);
    drawBackground(ctx);
    
    // Draw platforms if they exist
    if (platforms && platforms.length > 0) {
        drawPlatforms(ctx, platforms);
    }
    
    drawPlayer(ctx, player1, player1, player2);
    drawPlayer(ctx, player2, player1, player2);
    drawPunch(ctx, player1, '#FF0000');
    drawPunch(ctx, player2, '#0000FF');
    drawProjectileCharging(ctx, player1);
    drawProjectileCharging(ctx, player2);
    drawProjectiles(ctx, projectiles);
    
    // Render particle effects (after game objects but before UI)
    renderParticles(ctx);
    
    // Draw UI elements last to ensure they're on top
    updateStockDisplay(player1, true);
    updateStockDisplay(player2, false);
    updatePercentDisplay(player1, true);
    updatePercentDisplay(player2, false);
    
    // Debug: Show particle count (optional - remove in production)
    if (particles.length > 0) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.font = '14px Arial';
        ctx.fillText(`Particles: ${particles.length}`, 10, elements.canvas.height - 10);
    }
    
    if (gameOver) {
        drawWinnerText(ctx, player1);
        requestAnimationFrame(render); // Keep rendering the final state
    } else if (gameStarted) {
        requestAnimationFrame(gameLoop);
    }
}

/**
 * Game loop with timing control
 */
function gameLoop(timestamp) {
    // If game is over, just render the final state
    if (gameOver) {
        render();
        return;
    }

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
    }
    
    // Update game state
    updateGame();
    
    // Store timing
    lastFrameTime = timestamp;
    
    // Continue game loop
    if (!gameOver) {
        render();
        requestAnimationFrame(gameLoop);
    }
}

// Initialize game when loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGame);
} else {
    initGame();
}