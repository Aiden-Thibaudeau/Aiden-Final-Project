import { keys } from './input.js';

/**
 * Updates bot behavior based on game state
 * @param {Object} bot - The bot player object
 * @param {Object} player - The human player object
 * @param {Object} platforms - Array of platforms
 */
export function updateBot(bot, player, platforms) {
    // Reset all bot-controlled keys
    keys['ArrowLeft'] = false;
    keys['ArrowRight'] = false;
    keys['ArrowUp'] = false;
    keys['k'] = false; // punch
    keys['l'] = false; // projectile

    const mainPlatform = platforms[0];
    const distanceToPlayer = player.x - bot.x;
    const verticalDistance = player.y - bot.y;
    const isAbovePlayer = verticalDistance > 50;
    const isBelowPlayer = verticalDistance < -50;
    const preferredDistance = 200; // Bot tries to maintain this distance

    // Recovery logic - highest priority
    const isOffPlatform = bot.x < mainPlatform.x - 150 || 
                         bot.x > mainPlatform.x + mainPlatform.width + 150 ||
                         bot.y > mainPlatform.y + 200;

    if (isOffPlatform) {
        // Move towards platform center
        const platformCenter = mainPlatform.x + mainPlatform.width / 2;
        if (bot.x < platformCenter) {
            keys['ArrowRight'] = true;
        } else {
            keys['ArrowLeft'] = true;
        }

        // Jump if we have jumps available
        if (bot.jumpsLeft > 0 && !bot.jumping) {
            performJump(bot);
        }
        return;
    }

    // Platform edge avoidance
    if (isNearPlatformEdge(bot, platforms)) {
        const platformCenter = mainPlatform.x + mainPlatform.width / 2;
        if (bot.x < platformCenter) {
            keys['ArrowRight'] = true;
        } else {
            keys['ArrowLeft'] = true;
        }
        if (bot.jumpsLeft > 0 && !bot.jumping) {
            performJump(bot);
        }
        return;
    }

    // Movement and positioning
    const tooClose = Math.abs(distanceToPlayer) < preferredDistance - 50;
    const tooFar = Math.abs(distanceToPlayer) > preferredDistance + 50;

    if (tooClose) {
        // Move away from player
        keys['ArrowLeft'] = distanceToPlayer > 0;
        keys['ArrowRight'] = distanceToPlayer < 0;
    } else if (tooFar) {
        // Move towards player
        keys['ArrowLeft'] = distanceToPlayer < 0;
        keys['ArrowRight'] = distanceToPlayer > 0;
    }

    // Jumping logic
    if (isBelowPlayer && bot.grounded && bot.jumpsLeft > 0) {
        performJump(bot);
    }

    // Combat logic
    const closeRange = Math.abs(distanceToPlayer) < 100 && Math.abs(verticalDistance) < 80;
    const midRange = Math.abs(distanceToPlayer) < 300 && Math.abs(verticalDistance) < 100;

    if (closeRange && bot.punchCooldown <= 0) {
        keys['k'] = true; // Punch when close
    } else if (midRange && bot.projectileCooldown <= 0 && !closeRange) {
        keys['l'] = true; // Shoot when at medium range
    }
}

/**
 * Helper function to perform a jump
 */
function performJump(bot) {
    bot.dy = -bot.jumpStrength;
    bot.jumping = true;
    bot.grounded = false;
    bot.jumpsLeft--;
    bot.stretchFactor = 1.3;
}

/**
 * Checks if the bot is near a platform edge
 */
function isNearPlatformEdge(bot, platforms) {
    const EDGE_THRESHOLD = 60;
    
    for (const platform of platforms) {
        // Check if bot is on or near the platform vertically
        if (Math.abs(bot.y + bot.height * 2 - platform.y) < 20) {
            // Check horizontal distance to platform edges
            const leftEdge = platform.x;
            const rightEdge = platform.x + platform.width;
            
            return (Math.abs(bot.x - leftEdge) < EDGE_THRESHOLD || 
                    Math.abs(bot.x - rightEdge) < EDGE_THRESHOLD);
        }
    }
    return false;
}