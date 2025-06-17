import { keys, makeBotJump } from './input.js';
import { projectiles } from './combat.js';
import { stageLayouts } from './constants.js';
import { elements } from './ui.js';
import {
    MAX_CHARGE_TIME,
    MIN_CHARGE_MULTIPLIER,
    MAX_CHARGE_MULTIPLIER,
    PUNCH_DURATION,
    PUNCH_COOLDOWN,
    PROJECTILE_COOLDOWN,
    PROJECTILE_SPEED,
    KNOCKBACK_FORCE
} from './constants.js';

// AI Decision intervals (in frames)
const DECISION_INTERVAL = 15;
const REACTION_DELAY = 8;

// AI personality settings - adjustable difficulty
const AI_SETTINGS = {
    AGGRESSION: 0.7,
    REACTION_TIME: 0.8,
    ACCURACY: 0.75,
    EVASION_SKILL: 0.8,
    COMBO_LIKELIHOOD: 0.6,
    CHARGE_PATIENCE: 0.7,
    STAGE_AWARENESS: 0.9
};

// AI state tracking
let aiState = {
    frameCounter: 0,
    lastDecision: 0,
    currentAction: 'idle',
    currentCombatAction: 'none',
    targetPosition: null,
    chargingAction: null,
    chargeStartFrame: 0,
    reactionDelay: 0,
    lastPlayerAction: null,
    dangerLevel: 0,
    comboCooldown: 0,
    edgeAvoidance: false,
    lastDamageFrame: 0
};

/**
 * Helper function to move the bot towards a target position
 */
function moveBotTowardsTarget(bot, targetX) {
    const dx = targetX - bot.x;
    if (dx > 5) {
        keys['ArrowRight'] = true;
        keys['ArrowLeft'] = false;
        bot.facing = 1;
    } else if (dx < -5) {
        keys['ArrowLeft'] = true;
        keys['ArrowRight'] = false;
        bot.facing = -1;
    } else {
        keys['ArrowLeft'] = false;
        keys['ArrowRight'] = false;
    }
}

/**
 * Function to generate a random X position on the stage
 */
function getRandomStageX(stageWidth) {
    const minX = 0.25 * stageWidth;
    const maxX = 0.75 * stageWidth;
    return Math.random() * (maxX - minX) + minX;
}

/**
 * Main AI update function - combines movement and combat
 */
export function updateAI(bot, player, platforms) {
    aiState.frameCounter++;
    
    // First priority: Handle movement (recovery and positioning)
    handleMovement(bot, player);
    
    // Second priority: Handle combat decisions (only when not in recovery)
    if (!bot.inRecovery) {
        if (aiState.frameCounter % DECISION_INTERVAL === 0) {
            analyzeCombatSituation(bot, player, platforms);
            makeCombatDecision(bot, player, platforms);
        }
        executeCombatAction(bot, player, platforms);
    }
    
    // Update AI state
    updateAIState(bot, player);
}

/**
 * Handle movement logic (prioritized from updateBot)
 */
function handleMovement(bot, player) {
    const platformLeft = 0.25 * elements.canvas.width;
    const platformRight = 0.75 * elements.canvas.width;
    const stageWidth = elements.canvas.width;
    const stageCenter = stageWidth * 0.5;

    // Check if bot is currently outside platform x confines
    const botOffPlatform = bot.x < platformLeft || bot.x > platformRight;

    // Start recovery mode if bot goes off platform
    if (botOffPlatform && !bot.inRecovery) {
        bot.inRecovery = true;
        console.log("Bot Recovering!");
        bot.hasReachedCenter = false;
        // Clear combat actions during recovery
        clearCombatKeys();
    }

    // Recovery behavior
    if (bot.inRecovery) {
        const dx = stageCenter - bot.x;

        // Move towards center
        if (dx > 5) {
            keys['ArrowRight'] = true;
            keys['ArrowLeft'] = false;
            bot.facing = 1;
        } else if (dx < -5) {
            keys['ArrowLeft'] = true;
            keys['ArrowRight'] = false;
            bot.facing = -1;
        } else {
            keys['ArrowLeft'] = false;
            keys['ArrowRight'] = false;
            bot.hasReachedCenter = true;
        }

        // Use double jump for recovery
        if (bot.jumpsLeft > 0 && bot.dy > 12) {
            makeBotJump(bot);
        }

        // Stop recovery when bot is back within platform bounds AND has reached center
        const botBackOnPlatform = bot.x >= platformLeft && bot.x <= platformRight;
        if (botBackOnPlatform && bot.hasReachedCenter) {
            bot.inRecovery = false;
            bot.hasReachedCenter = false;
            keys['ArrowLeft'] = false;
            keys['ArrowRight'] = false;
            bot.inAttack = true;
            console.log("Bot Attacking!");
            bot.targetX = player.x;
            bot.targetCooldown = 3;
        }
    } else if (bot.inAttack) {
        // Attack mode movement
        const distanceToPlayer = Math.abs(bot.x - player.x);
        
        if (distanceToPlayer < 10) {
            console.log("Bot Redirecting!");
            if (Math.abs(bot.x - stageCenter) < 5) {
                bot.targetX = getRandomStageX(stageWidth);
            } else {
                bot.targetX = stageCenter;
            }
            bot.targetCooldown = 3;
        }

        if (bot.targetX === undefined) {
            bot.targetX = player.x;
        }

        // Only move if not executing a combat action that requires staying still
        if (!isStationaryCombatAction()) {
            moveBotTowardsTarget(bot, bot.targetX);
        }

        // Check if the bot has reached the target
        if (Math.abs(bot.x - bot.targetX) < 5) {
            if (bot.targetCooldown === 0) {
                bot.targetX = player.x;
                bot.targetCooldown = 3;
            } else {
                bot.targetCooldown--;
            }
        }

        // Random Jumping (with evasion consideration)
        if (Math.random() < 0.01 || shouldJumpForEvasion(bot, player)) {
            if (bot.jumpsLeft > 0) {
                makeBotJump(bot);
            }
        }
    } else {
        // Initialize attack mode
        bot.inAttack = true;
        bot.targetX = player.x;
        bot.targetCooldown = 3;
    }
}

/**
 * Analyze combat situation
 */
function analyzeCombatSituation(bot, player, platforms) {
    const distance = getDistance(bot, player);
    aiState.dangerLevel = calculateDangerLevel(bot, player, distance);
    
    // Check for incoming projectiles
    const incomingProjectile = getIncomingProjectile(bot);
    if (incomingProjectile) {
        aiState.dangerLevel += 0.3;
    }
    
    // Analyze player behavior
    detectPlayerPatterns(player);
}

/**
 * Make combat decisions
 */
function makeCombatDecision(bot, player, platforms) {
    if (aiState.reactionDelay > 0) {
        aiState.reactionDelay--;
        return;
    }

    const distance = getDistance(bot, player);
    const actions = evaluateCombatActions(bot, player, distance);
    
    // Sort actions by weighted priority
    const sortedActions = Object.entries(actions)
        .sort(([,a], [,b]) => b - a)
        .map(([action]) => action);
    
    // Choose action with some randomness
    const topActions = sortedActions.slice(0, 3);
    const selectedAction = topActions[Math.floor(Math.random() * Math.min(topActions.length, 2))];
    
    aiState.currentCombatAction = selectedAction;
    aiState.lastDecision = aiState.frameCounter;
}

/**
 * Evaluate combat actions
 */
function evaluateCombatActions(bot, player, distance) {
    const actions = {
        punch: 0,
        projectile: 0,
        chargePunch: 0,
        chargeProjectile: 0,
        dodge: 0,
        defend: 0,
        none: 0.1 // Always have a small chance to do nothing
    };
    
    // Punch evaluation
    if (bot.punchCooldown <= 0) {
        if (distance < 100) actions.punch += 0.8;
        if (player.punching || player.charging) actions.punch += 0.6;
        actions.punch *= AI_SETTINGS.AGGRESSION;
    }
    
    // Projectile evaluation
    if (bot.projectileCooldown <= 0) {
        if (distance > 80 && distance < 300) actions.projectile += 0.7;
        if (Math.abs(player.dx) < 2) actions.projectile += 0.5;
        if (hasLineOfSight(bot, player)) actions.projectile += 0.3;
    }
    
    // Charge attacks
    if (distance > 150 && !player.punching) {
        actions.chargePunch += 0.6 * AI_SETTINGS.CHARGE_PATIENCE;
        actions.chargeProjectile += 0.5 * AI_SETTINGS.CHARGE_PATIENCE;
    }
    
    // Evasion
    if (aiState.dangerLevel > 0.5) {
        actions.dodge += aiState.dangerLevel * AI_SETTINGS.EVASION_SKILL;
        actions.defend += aiState.dangerLevel * 0.7;
    }
    
    return actions;
}

/**
 * Execute combat actions
 */
function executeCombatAction(bot, player, platforms) {
    switch (aiState.currentCombatAction) {
        case 'punch':
            executePunch(bot, player);
            break;
        case 'projectile':
            executeProjectile(bot, player);
            break;
        case 'chargePunch':
            executeChargePunch(bot, player);
            break;
        case 'chargeProjectile':
            executeChargeProjectile(bot, player);
            break;
        case 'dodge':
            executeDodge(bot, player);
            break;
        case 'defend':
            executeDefend(bot);
            break;
        default:
            // Do nothing, let movement handle
            break;
    }
}

/**
 * Check if current combat action requires staying stationary
 */
function isStationaryCombatAction() {
    return aiState.chargingAction !== null || 
           aiState.currentCombatAction === 'defend' ||
           (aiState.currentCombatAction === 'punch' && aiState.frameCounter - aiState.lastDecision < 10);
}

/**
 * Check if bot should jump for evasion
 */
function shouldJumpForEvasion(bot, player) {
    const distance = getDistance(bot, player);
    
    // Jump to avoid close punches
    if (player.punching && distance < 120) {
        return Math.random() < AI_SETTINGS.EVASION_SKILL;
    }
    
    // Jump to avoid projectiles
    const incomingProjectile = getIncomingProjectile(bot);
    if (incomingProjectile && incomingProjectile.y > bot.y - 50) {
        return Math.random() < AI_SETTINGS.EVASION_SKILL;
    }
    
    return false;
}

// Combat execution functions
function executePunch(bot, player) {
    bot.facing = player.x > bot.x ? 1 : -1;
    keys['l'] = true;
    
    setTimeout(() => {
        keys['l'] = false;
        aiState.comboCooldown = 30;
    }, 100);
}

function executeProjectile(bot, player) {
    bot.facing = player.x > bot.x ? 1 : -1;
    
    // Lead the target
    const leadTime = getDistance(bot, player) / PROJECTILE_SPEED;
    const predictedX = player.x + player.dx * leadTime * AI_SETTINGS.ACCURACY;
    bot.facing = predictedX > bot.x ? 1 : -1;
    
    keys['k'] = true;
    setTimeout(() => keys['k'] = false, 100);
}

function executeChargePunch(bot, player) {
    bot.facing = player.x > bot.x ? 1 : -1;
    
    if (!aiState.chargingAction) {
        aiState.chargingAction = 'punch';
        aiState.chargeStartFrame = aiState.frameCounter;
        keys['l'] = true;
    } else {
        const chargeTime = aiState.frameCounter - aiState.chargeStartFrame;
        const maxChargeTime = MAX_CHARGE_TIME * AI_SETTINGS.CHARGE_PATIENCE;
        
        if (chargeTime >= maxChargeTime || getDistance(bot, player) < 60) {
            keys['l'] = false;
            aiState.chargingAction = null;
        }
    }
}

function executeChargeProjectile(bot, player) {
    bot.facing = player.x > bot.x ? 1 : -1;
    
    if (!aiState.chargingAction) {
        aiState.chargingAction = 'projectile';
        aiState.chargeStartFrame = aiState.frameCounter;
        keys['k'] = true;
    } else {
        const chargeTime = aiState.frameCounter - aiState.chargeStartFrame;
        const maxChargeTime = MAX_CHARGE_TIME * AI_SETTINGS.CHARGE_PATIENCE;
        
        if (chargeTime >= maxChargeTime || player.dx === 0) {
            keys['k'] = false;
            aiState.chargingAction = null;
        }
    }
}

function executeDodge(bot, player) {
    // Quick movement while maintaining current target direction
    const preferredDirection = bot.targetX > bot.x ? 1 : -1;
    const dodgeDirection = Math.random() > 0.3 ? preferredDirection : -preferredDirection;
    
    if (dodgeDirection === 1) {
        keys['ArrowRight'] = true;
        keys['ArrowLeft'] = false;
    } else {
        keys['ArrowLeft'] = true;
        keys['ArrowRight'] = false;
    }
}

function executeDefend(bot) {
    keys['ArrowLeft'] = false;
    keys['ArrowRight'] = false;
}

function clearCombatKeys() {
    keys['k'] = false;
    keys['l'] = false;
    aiState.chargingAction = null;
    aiState.currentCombatAction = 'none';
}

// Utility functions
function getDistance(bot, player) {
    const dx = bot.x - player.x;
    const dy = bot.y - player.y;
    return Math.sqrt(dx * dx + dy * dy);
}

function calculateDangerLevel(bot, player, distance) {
    let danger = 0;
    
    if (distance < 100 && (player.punching || player.charging)) {
        danger += 0.8;
    }
    
    if (bot.knockbackMultiplier > 10) {
        danger += 0.7;
    }
    
    if (bot.x < 100 || bot.x > elements.canvas.width - 100) {
        danger += 0.4;
    }
    
    return Math.max(0, Math.min(1, danger));
}

function getIncomingProjectile(bot) {
    return projectiles.find(p => {
        if (p.owner === bot) return false;
        
        const willHit = (
            p.dx > 0 && p.x < bot.x && p.x + Math.abs(p.dx) * 30 > bot.x
        ) || (
            p.dx < 0 && p.x > bot.x && p.x + Math.abs(p.dx) * 30 < bot.x
        );
        
        const inVerticalRange = Math.abs(p.y - bot.y) < 40;
        return willHit && inVerticalRange;
    });
}

function hasLineOfSight(bot, player) {
    return Math.abs(bot.y - player.y) < 50;
}

function detectPlayerPatterns(player) {
    if (player.punching && !aiState.lastPlayerAction) {
        aiState.lastPlayerAction = 'punch';
    } else if (!player.punching && aiState.lastPlayerAction === 'punch') {
        aiState.lastPlayerAction = null;
    }
}

function updateAIState(bot, player) {
    if (aiState.comboCooldown > 0) {
        aiState.comboCooldown--;
    }
    
    if (bot.knockbackMultiplier > (aiState.lastKnockback || 0)) {
        aiState.lastDamageFrame = aiState.frameCounter;
        aiState.reactionDelay = Math.floor(REACTION_DELAY * (1 - AI_SETTINGS.REACTION_TIME));
    }
    aiState.lastKnockback = bot.knockbackMultiplier;
}

/**
 * Reset AI state when game restarts
 */
export function resetAI() {
    aiState = {
        frameCounter: 0,
        lastDecision: 0,
        currentAction: 'idle',
        currentCombatAction: 'none',
        targetPosition: null,
        chargingAction: null,
        chargeStartFrame: 0,
        reactionDelay: 0,
        lastPlayerAction: null,
        dangerLevel: 0,
        comboCooldown: 0,
        edgeAvoidance: false,
        lastDamageFrame: 0
    };
    
    // Clear all key states
    keys['ArrowLeft'] = false;
    keys['ArrowRight'] = false;
    keys['ArrowUp'] = false;
    keys['k'] = false;
    keys['l'] = false;
}

/**
 * Adjust AI difficulty settings
 */
export function setAIDifficulty(difficulty) {
    const settings = {
        easy: {
            AGGRESSION: 0.4,
            REACTION_TIME: 0.5,
            ACCURACY: 0.5,
            EVASION_SKILL: 0.5,
            COMBO_LIKELIHOOD: 0.3,
            CHARGE_PATIENCE: 0.4,
            STAGE_AWARENESS: 0.6
        },
        medium: {
            AGGRESSION: 0.7,
            REACTION_TIME: 0.8,
            ACCURACY: 0.75,
            EVASION_SKILL: 0.8,
            COMBO_LIKELIHOOD: 0.6,
            CHARGE_PATIENCE: 0.7,
            STAGE_AWARENESS: 0.9
        },
        hard: {
            AGGRESSION: 0.9,
            REACTION_TIME: 0.95,
            ACCURACY: 0.9,
            EVASION_SKILL: 0.95,
            COMBO_LIKELIHOOD: 0.8,
            CHARGE_PATIENCE: 0.9,
            STAGE_AWARENESS: 1.0
        }
    };
    
    if (settings[difficulty]) {
        Object.assign(AI_SETTINGS, settings[difficulty]);
        console.log(`AI difficulty set to: ${difficulty}`);
    }
}

// Backward compatibility - export updateBot as alias
export const updateBot = updateAI;