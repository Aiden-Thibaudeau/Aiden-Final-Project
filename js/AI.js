import { keys } from './input.js';
import { GameState, calculateUtility, generateActions } from './AIState.js';

// Bot memory for persistent behavior
const botMemory = {
    lastActionTime: 0,
    consecutiveSameAction: 0,
    lastAction: null,
    firstJumpTime: 0,
    lastX: 0,
    stuckTimer: 0,
    lastMovementTime: 0, // Track last movement time
    lastMovingRight: undefined // Track last movement direction
};

const SAFE_ZONE = 40;      // Safe distance from edge
const MIN_PLAYER_DIST = 120; // Minimum safe distance from player
const MOVEMENT_COOLDOWN = 15; // Frames to wait between movement changes

/**
 * Updates bot behavior based on game state using a planner-based system
 * @param {Object} bot - The bot player object
 * @param {Object} player - The human player object
 * @param {Object} platforms - Array of platforms
 */
export function updateBot(bot, player, platforms) {
    // Reset all bot-controlled keys
    keys['ArrowLeft'] = keys['ArrowRight'] = keys['ArrowUp'] = keys['k'] = keys['l'] = false;

    const mainPlatform = platforms[0];
    const platformCenter = mainPlatform.x + mainPlatform.width / 2;
    const distanceToPlayer = player.x - bot.x;
    const absDistanceToPlayer = Math.abs(distanceToPlayer);
    const tooCloseToPlayer = absDistanceToPlayer < MIN_PLAYER_DIST;

    // Check if bot is stuck (oscillating near edge)
    if (Math.abs(bot.x - botMemory.lastX) < 5) {
        botMemory.stuckTimer++;
    } else {
        botMemory.stuckTimer = 0;
    }
    botMemory.lastX = bot.x;

    // Critical recovery check - this takes precedence over everything
    const isOffPlatform = (
        bot.x < mainPlatform.x - 20 || // Left of platform with small buffer
        bot.x > mainPlatform.x + mainPlatform.width + 20 || // Right of platform with small buffer
        bot.y > mainPlatform.y // Below platform
    );

    if (isOffPlatform) {
        const distanceToCenter = platformCenter - bot.x;
        const distanceToTop = mainPlatform.y - bot.y;

        // If stuck, force a jump to break the pattern
        if (botMemory.stuckTimer > 30 && bot.jumpsLeft > 0) {
            performJump(bot);
            keys['ArrowUp'] = true;
            botMemory.stuckTimer = 0;
        }
        // Always move toward platform center, even when near player
        keys['ArrowRight'] = bot.x < platformCenter;
        keys['ArrowLeft'] = bot.x > platformCenter;

        // Smart jumping logic
        if (bot.jumpsLeft > 0) {
            // If we're below the platform and haven't jumped yet
            if (bot.y > mainPlatform.y && bot.jumpsLeft === 2) {
                performJump(bot);
                keys['ArrowUp'] = true;
                botMemory.firstJumpTime = Date.now();
            } 
            // Use second jump when falling and platform is above us
            else if (bot.jumpsLeft === 1 && 
                    Date.now() - botMemory.firstJumpTime > 200 &&
                    bot.dy > 0 && // Only jump when we start falling
                    distanceToTop < 0) {
                performJump(bot);
                keys['ArrowUp'] = true;
            }
        }
        
        return; // Skip all other AI logic when in critical recovery
    }    // When on platform but too close to player, prioritize center movement
    if (tooCloseToPlayer && !isOffPlatform) {
        const distanceToCenter = platformCenter - bot.x;
        const now = Date.now();
        const timeSinceLastMovement = now - botMemory.lastMovementTime;
        const wantsToMoveRight = bot.x < platformCenter;
        
        // Only change direction if enough time has passed
        if (timeSinceLastMovement >= MOVEMENT_COOLDOWN || 
            (wantsToMoveRight ? !botMemory.lastMovingRight : botMemory.lastMovingRight) ||
            botMemory.lastMovingRight === undefined) {
            
            // Update movement direction
            keys['ArrowRight'] = wantsToMoveRight;
            keys['ArrowLeft'] = !wantsToMoveRight;
            botMemory.lastMovingRight = wantsToMoveRight;
            botMemory.lastMovementTime = now;
        } else {
            // Continue last movement direction
            keys['ArrowRight'] = botMemory.lastMovingRight;
            keys['ArrowLeft'] = !botMemory.lastMovingRight;
        }
        
        // Jump if not at platform center to get over player
        if (Math.abs(distanceToCenter) > 50 && bot.grounded && bot.jumpsLeft > 0) {
            performJump(bot);
            keys['ArrowUp'] = true;
        }
        return;
    }

    // Reset timers when back on platform
    if (!isOffPlatform) {
        botMemory.firstJumpTime = 0;
        botMemory.stuckTimer = 0;
    }

    // Regular AI behavior continues here
    const state = new GameState(bot, player, platforms);
    const actions = generateActions(state);

    // Calculate utility scores for each action
    actions.forEach(action => {
        action.score = calculateUtility(action, state);
        
        // Add variety by slightly penalizing repeated actions
        if (action.name === botMemory.lastAction) {
            action.score -= botMemory.consecutiveSameAction * 50;
        }
    });

    // Sort actions by score and select the best one
    actions.sort((a, b) => b.score - a.score);
    const selectedAction = actions[0];

    if (selectedAction) {
        const now = Date.now();
        const timeSinceLastMovement = now - botMemory.lastMovementTime;
        
        // Only execute if enough time has passed since last movement
        if (timeSinceLastMovement >= MOVEMENT_COOLDOWN || selectedAction.name !== botMemory.lastAction) {
            // Execute the selected action
            selectedAction.execute(keys);
            
            // Update bot memory
            if (selectedAction.name === botMemory.lastAction) {
                botMemory.consecutiveSameAction++;
            } else {
                botMemory.consecutiveSameAction = 0;
                botMemory.lastMovementTime = now; // Reset cooldown timer on action change
            }
            botMemory.lastAction = selectedAction.name;
            botMemory.lastActionTime = now;
        }
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
        if (Math.abs(bot.y + bot.height * 2 - platform.y) < 20) {
            const leftEdge = platform.x;
            const rightEdge = platform.x + platform.width;
            
            return (Math.abs(bot.x - leftEdge) < EDGE_THRESHOLD || 
                    Math.abs(bot.x - rightEdge) < EDGE_THRESHOLD);
        }
    }
    return false;
}