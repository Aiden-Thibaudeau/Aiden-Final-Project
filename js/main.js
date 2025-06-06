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

/**
 * Initialize game
 */
function initGame() {
    console.log('Initializing game...');
    
    try {
        // Initialize UI first
        initializeUI();
        
        // Initialize controls
        initializeControls(player1, player2);
        
        // Set up start game handler
        elements.startGameBtn.addEventListener('click', () => {
            console.log('Start game clicked');
            if (document.readyState === 'complete') {
                startGame();
            } else {
                console.warn('Document not fully loaded, waiting...');
            }
        });
        
        // Set up restart handler
        elements.restartBtn.addEventListener('click', restartGame);
        
        // Load images
        loadImages();
        
        console.log('Game initialization complete');
    } catch (error) {
        console.error('Error during game initialization:', error);
    }
}

/**
 * Start new game
 */
function startGame() {
    console.log('Starting game...');
    
    // Create platforms for selected stage
    platforms = createPlatforms(selectedStage);
    console.log('Created platforms for stage:', selectedStage, platforms);
    
    // Reset game state
    gameStarted = true;
    gameOver = false;
    projectiles.length = 0;
    
    // Reset stocks and positions
    player1.stocks = 3;
    player2.stocks = 3;
    
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
      // Reset players to their spawn positions
    const spawnLayout = stageLayouts[selectedStage];
    resetPlayer(player1, 
        spawnLayout.spawns.player1.x * elements.canvas.width,
        spawnLayout.spawns.player1.y * elements.canvas.height);
    resetPlayer(player2,
        spawnLayout.spawns.player2.x * elements.canvas.width,
        spawnLayout.spawns.player2.y * elements.canvas.height);
    
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
    gameStarted = true;
    toggleRestartButton(false);
    
    // Create platforms for selected stage
    platforms = createPlatforms(selectedStage);
    
    // Reset stocks and clear any existing state
    player1.stocks = 3;
    player2.stocks = 3;
    player1.knockbackMultiplier = 1;
    player2.knockbackMultiplier = 1;
    
    // Reapply color stats before resetting players
    applyColorStats(player1, player1.color);
    applyColorStats(player2, player2.color);
    
    // Reset players to their spawn positions using stage layout
    const respawnLayout = stageLayouts[selectedStage];
    resetPlayer(player1, 
        respawnLayout.spawns.player1.x * elements.canvas.width,
        respawnLayout.spawns.player1.y * elements.canvas.height);
    resetPlayer(player2,
        respawnLayout.spawns.player2.x * elements.canvas.width,
        respawnLayout.spawns.player2.y * elements.canvas.height);
    
    // Clear any active projectiles
    projectiles.length = 0;
    
    // Update UI displays
    updateStockDisplay(player1, true);
    updateStockDisplay(player2, false);
    updatePercentDisplay(player1, true);
    updatePercentDisplay(player2, false);
    
    // Reset input states
    resetKeyStates();
    
    // Restart game loop
    lastFrameTime = performance.now();
    requestAnimationFrame(gameLoop);
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
            // Decrement stocks and update UI before resetting position
            player.stocks--;
            updateStockDisplay(player, isPlayer1);
            
            // Reset player to spawn point
            const spawnPoint = isPlayer1 ? layout.spawns.player1 : layout.spawns.player2;
            resetPlayer(player, 
                spawnPoint.x * elements.canvas.width,
                spawnPoint.y * elements.canvas.height);
            
            // Reset knockback multiplier on respawn
            player.knockbackMultiplier = 1;
            updatePercentDisplay(player, isPlayer1);
        } else {
            player.stocks = 0;
            updateStockDisplay(player, isPlayer1);
            gameOver = true;
            toggleRestartButton(true);
        }
    }
}

/**
 * Handle player loss
 */
function handlePlayerLoss(player, spawnX) {
    const isPlayer1 = player === player1;
    
    if (player.stocks > 1) {
        // Decrement stocks and update UI
        player.stocks--;
        updateStockDisplay(player, isPlayer1);
        
        // Reset player position and stats
        const respawnLayout = stageLayouts[selectedStage];
        const spawnPoint = isPlayer1 ? respawnLayout.spawns.player1 : respawnLayout.spawns.player2;
        resetPlayer(player, 
            spawnPoint.x * elements.canvas.width,
            spawnPoint.y * elements.canvas.height);
        
        // Reset knockback multiplier and update percentage display
        player.knockbackMultiplier = 1;
        updatePercentDisplay(player, isPlayer1);
    } else {
        // Game over state
        player.stocks = 0;
        updateStockDisplay(player, isPlayer1);
        gameOver = true;
        toggleRestartButton(true);
        console.log('Game over! Winner:', isPlayer1 ? 'Player 2' : 'Player 1');
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
    const ctx = getContext();
    if (!ctx) return;
    
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
    
    if (gameOver) {
        drawWinnerText(ctx, player1);
    }
}

/**
 * Game loop with timing control
 */
function gameLoop(timestamp) {
    if (!gameStarted || !timestamp) {
        requestAnimationFrame(gameLoop);
        return;
    }
    
    try {
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
    } catch (error) {
        console.error('Error in game loop:', error);
        gameOver = true;
    }
}

// Initialize game when loaded
window.addEventListener('load', initGame);