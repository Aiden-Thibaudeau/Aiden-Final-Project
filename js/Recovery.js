// AI Platform Recovery System
import { keys } from './input.js';

// Recovery configuration
const RECOVERY_CONFIG = {
    EDGE_BUFFER: 40,           // Smaller edge buffer to give more room
    MAX_RECOVERY_TIME: 5000,   // More time to attempt recovery
    JUMP_BUFFER: 10,          // Smaller buffer to jump more readily
    MAX_FALL_SPEED: 8,        // More aggressive fall speed threshold
    PLATFORM_MEMORY: 2000,    // How long to remember last platform position
    MIN_JUMP_INTERVAL: 100    // Much shorter time between jumps
};

// Recovery state tracking
const recoveryState = {
    isRecovering: false,
    recoveryStartTime: 0,
    lastJumpTime: 0,
    lastGroundedPosition: { x: 0, y: 0 },
    lastGroundedTime: 0,
    targetPlatform: null,
    recoveryAttempts: 0,
    lastSuccessfulRecovery: 0
};

/**
 * Check if recovery is needed
 */
export function needsRecovery(bot, platforms) {
    // Not grounded and falling fast
    if (!bot.grounded && bot.dy > RECOVERY_CONFIG.MAX_FALL_SPEED) {
        return true;
    }    const mainPlatform = platforms[0];
    const botCenter = bot.x + bot.width / 2;
    
    // Near platform edge or in dangerous position
    if (bot.grounded) {
        const platformLeft = mainPlatform.x + RECOVERY_CONFIG.EDGE_BUFFER;
        const platformRight = mainPlatform.x + mainPlatform.width - RECOVERY_CONFIG.EDGE_BUFFER;
        
        // Also check if we're moving fast near the edge
        const dangerousSpeed = Math.abs(bot.dx) > 8;
        const nearEdge = botCenter < platformLeft || botCenter > platformRight;
        
        if (nearEdge || (dangerousSpeed && (botCenter < platformLeft + 30 || botCenter > platformRight - 30))) {
            return true;
        }
    }

    // Check fall state
    const estimatedJumpHeight = 180; // Approximate height of a jump
    const maxRecoverableHeight = bot.jumpsLeft * estimatedJumpHeight;
    
    // Need recovery if:
    // 1. Far below platform and can still make it back
    // 2. Falling fast and have jumps
    // 3. Below platform but within jump range
    if (!bot.grounded && (
        (bot.y > mainPlatform.y + mainPlatform.height * 1.5 && bot.y <= mainPlatform.y + maxRecoverableHeight) ||
        (bot.dy > RECOVERY_CONFIG.MAX_FALL_SPEED && bot.jumpsLeft > 0) ||
        (bot.y > mainPlatform.y && bot.y <= mainPlatform.y + maxRecoverableHeight)
    )) {
        return true;
    }

    return false;
}

/**
 * Find best platform to recover to
 */
function findRecoveryPlatform(bot, platforms) {
    let bestPlatform = null;
    let bestScore = -Infinity;

    for (const platform of platforms) {
        // Calculate the horizontal and vertical distances
        const horizontalDist = Math.abs((platform.x + platform.width/2) - (bot.x + bot.width/2));
        const verticalDist = platform.y - bot.y;
        
        // Skip platforms we're too far above
        if (verticalDist < -100) continue;
        
        // Score this platform based on position and size
        let score = 1000;
        score -= horizontalDist; // Prefer closer platforms
        score -= Math.abs(verticalDist) * 2; // Strongly prefer platforms at similar height
        score += platform.width; // Prefer wider platforms
        
        // Bonus for platforms we were recently on
        if (Math.abs(platform.y - recoveryState.lastGroundedPosition.y) < 10) {
            score += 500;
        }
        
        if (score > bestScore) {
            bestScore = score;
            bestPlatform = platform;
        }
    }

    return bestPlatform;
}

/**
 * Execute recovery movement
 */
export function executeRecovery(bot, platforms) {
    // Always try to use the main platform as target
    const target = platforms[0];
    const botCenter = bot.x + bot.width/2;
    const platformCenter = target.x + target.width/2;
    const horizontalDist = platformCenter - botCenter;
    const verticalDist = target.y - bot.y;
    
    // Basic movement - try to stay under the platform
    if (Math.abs(horizontalDist) > 20) {
        // Move towards platform center
        keys.ArrowRight = horizontalDist > 0;
        keys.ArrowLeft = horizontalDist < 0;
    }

    // JUMP LOGIC
    // Always jump if:
    // 1. We have jumps available
    // 2. We're below the platform
    if (bot.jumpsLeft > 0 && verticalDist < 0) {
        keys.ArrowUp = true;
    }
    const canJump = currentTime - recoveryState.lastJumpTime > 100; // Reduced jump interval
    
    // Jump if:
    // 1. Below the platform
    // 2. Have jumps available
    // 3. Somewhat lined up horizontally
    const shouldJump = canJump && 
        bot.jumpsLeft > 0 && 
        verticalDist < 0 && 
        Math.abs(horizontalDist) < target.width;

    if (shouldJump && bot.jumpsLeft > 0) {
        keys.ArrowUp = true;
        recoveryState.lastJumpTime = currentTime;
    }

    // Update state if recovered successfully
    if (bot.grounded && !needsRecovery(bot, platforms)) {
        handleSuccessfulRecovery(bot);
    }
}

/**
 * Handle successful platform recovery
 */
function handleSuccessfulRecovery(bot) {
    const currentTime = Date.now();
    
    recoveryState.isRecovering = false;
    recoveryState.lastSuccessfulRecovery = currentTime;
    recoveryState.recoveryAttempts = 0;
    recoveryState.lastGroundedPosition = {
        x: bot.x,
        y: bot.y
    };
    recoveryState.lastGroundedTime = currentTime;
}

/**
 * Reset recovery state
 */
function resetRecovery() {
    recoveryState.isRecovering = false;
    recoveryState.targetPlatform = null;
}

/**
 * Update recovery state tracking
 */
export function updateRecoveryState(bot) {
    const currentTime = Date.now();
    
    // Track grounded position
    if (bot.grounded) {
        recoveryState.lastGroundedPosition = {
            x: bot.x,
            y: bot.y
        };
        recoveryState.lastGroundedTime = currentTime;
    }
}

export { recoveryState, RECOVERY_CONFIG };