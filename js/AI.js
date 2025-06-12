// Bot AI core logic
import { keys } from './input.js';
import { executeCloseCombat, executeRangedCombat, isInDanger, executeEvasion } from './enhanced-combat.js';

// Bot state tracking
const botPlanner = {
    isRecovering: false,
    lastJumpTime: 0,
    lastPlatformY: 0,
    recoveryAttempts: 0,
    lastGroundedTime: 0,
    lastMoveDirection: null
};

// Configuration
const CONFIG = {
    JUMP_COOLDOWN: 500,        // Min time between jumps (ms)
    EDGE_BUFFER: 50,           // Stay away from platform edges
    FALL_THRESHOLD: 100,       // Distance below platform to trigger recovery
    MAX_RECOVERY_ATTEMPTS: 3,  // Max consecutive recovery attempts
    GROUND_MEMORY: 1000,       // Remember last grounded time (ms)
    OPTIMAL_DISTANCE: 150      // Preferred combat distance
};

/**
 * Main update function for bot AI
 */
export function updateBot(bot, player, platforms) {
    // Reset keys
    resetKeys();
    
    // Update state
    updateBotState(bot, platforms);
    
    // Priority 1: Platform Recovery
    if (needsRecovery(bot, platforms)) {
        executeRecovery(bot, platforms);
        return;
    }
    
    // Priority 2: Combat
    executeCombat(bot, player, platforms);
}

/**
 * Reset input keys
 */
function resetKeys() {
    keys.ArrowLeft = false;
    keys.ArrowRight = false;
    keys.ArrowUp = false;
    keys.k = false;  // punch
    keys.l = false;  // projectile
}

/**
 * Update bot state tracking
 */
function updateBotState(bot, platforms) {
    const currentTime = Date.now();
    
    // Track grounded state
    if (bot.grounded) {
        botPlanner.lastGroundedTime = currentTime;
        botPlanner.lastPlatformY = bot.y;
        botPlanner.recoveryAttempts = 0;
    }
    
    // Reset recovery state if successful
    if (botPlanner.isRecovering && bot.grounded) {
        botPlanner.isRecovering = false;
    }
}

/**
 * Check if bot needs platform recovery
 */
function needsRecovery(bot, platforms) {
    const mainPlatform = platforms[0];
    
    // Already in recovery mode
    if (botPlanner.isRecovering) return true;
    
    // Check if far below platform
    if (bot.y > mainPlatform.y + CONFIG.FALL_THRESHOLD) {
        return true;
    }
    
    // Check if near platform edge
    const botCenter = bot.x + bot.width / 2;
    const platformLeft = mainPlatform.x + CONFIG.EDGE_BUFFER;
    const platformRight = mainPlatform.x + mainPlatform.width - CONFIG.EDGE_BUFFER;
    
    if (botCenter < platformLeft || botCenter > platformRight) {
        return true;
    }
    
    return false;
}

/**
 * Execute platform recovery
 */
function executeRecovery(bot, platforms) {
    const mainPlatform = platforms[0];
    const currentTime = Date.now();
    
    // Start recovery mode
    botPlanner.isRecovering = true;
    
    // Get back to platform center
    const botCenter = bot.x + bot.width / 2;
    const platformCenter = mainPlatform.x + mainPlatform.width / 2;
    
    // Move towards platform center
    if (botCenter < platformCenter) {
        keys.ArrowRight = true;
        botPlanner.lastMoveDirection = 'right';
    } else {
        keys.ArrowLeft = true;
        botPlanner.lastMoveDirection = 'left';
    }
    
    // Jump if needed
    if (bot.grounded && 
        currentTime - botPlanner.lastJumpTime > CONFIG.JUMP_COOLDOWN && 
        bot.y > mainPlatform.y) {
        keys.ArrowUp = true;
        botPlanner.lastJumpTime = currentTime;
        botPlanner.recoveryAttempts++;
    }
    
    // Emergency direction change if stuck
    if (botPlanner.recoveryAttempts > CONFIG.MAX_RECOVERY_ATTEMPTS) {
        botPlanner.lastMoveDirection = botPlanner.lastMoveDirection === 'right' ? 'left' : 'right';
        botPlanner.recoveryAttempts = 0;
    }
}

/**
 * Execute combat logic
 */
function executeCombat(bot, player, platforms) {
    const distance = Math.abs(player.x - bot.x);
    
    // Check if in immediate danger
    if (isInDanger(bot, player)) {
        executeEvasion(bot, player, platforms);
        return;
    }
    
    // Choose combat range based on situation
    if (distance < 100) {
        executeCloseCombat(bot, player, platforms);
    } else {
        executeRangedCombat(bot, player, platforms);
    }
}

export { botPlanner, CONFIG };