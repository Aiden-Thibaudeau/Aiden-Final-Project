// Enhanced combat system
import { keys } from './input.js';

// Combat configuration
const COMBAT_CONFIG = {
    CLOSE_RANGE: 80,          // Range for melee attacks
    PROJECTILE_RANGE: 250,    // Range for projectile attacks
    DANGER_RANGE: 100,        // Range to consider danger
    EVASION_JUMP_RANGE: 60,  // Range to consider jump evasion
    COMBO_WINDOW: 500        // Time window for combos (ms)
};

// Combat state tracking
const combatState = {
    lastAttackTime: 0,
    lastHitTime: 0,
    consecutiveHits: 0,
    isEvading: false,
    lastEvasionTime: 0
};

/**
 * Check if bot is in immediate danger
 */
export function isInDanger(bot, player) {
    const distance = Math.abs(player.x - bot.x);
    const verticalDistance = Math.abs(player.y - bot.y);
    
    return (distance < COMBAT_CONFIG.DANGER_RANGE && 
            verticalDistance < 50 &&
            (player.punching || player.isDashing || player.charging));
}

/**
 * Execute evasive maneuvers
 */
export function executeEvasion(bot, player, platforms) {
    const currentTime = Date.now();
    const distance = player.x - bot.x;
    const absDistance = Math.abs(distance);
    
    // Mark as evading
    combatState.isEvading = true;
    combatState.lastEvasionTime = currentTime;
    
    // Move away from player
    if (distance > 0) {
        keys.ArrowLeft = true;
    } else {
        keys.ArrowRight = true;
    }
    
    // Jump if too close or projectile incoming
    if (absDistance < COMBAT_CONFIG.EVASION_JUMP_RANGE && 
        bot.grounded && bot.jumpsLeft > 0) {
        keys.ArrowUp = true;
    }
}

/**
 * Execute close combat attacks
 */
export function executeCloseCombat(bot, player, platforms) {
    const currentTime = Date.now();
    const distance = player.x - bot.x;
    const absDistance = Math.abs(distance);
    
    // Face the player
    if (distance > 0) {
        keys.ArrowRight = true;
    } else {
        keys.ArrowLeft = true;
    }
    
    // Attack if in range
    if (absDistance < COMBAT_CONFIG.CLOSE_RANGE && 
        bot.punchCooldown <= 0) {
        keys.k = true;
        combatState.lastAttackTime = currentTime;
    }
    
    // Jump attack if advantageous
    if (player.y < bot.y && bot.grounded && bot.jumpsLeft > 0) {
        keys.ArrowUp = true;
    }
}

/**
 * Execute ranged combat
 */
export function executeRangedCombat(bot, player, platforms) {
    const distance = player.x - bot.x;
    const absDistance = Math.abs(distance);
    
    // Maintain optimal distance
    if (absDistance < COMBAT_CONFIG.CLOSE_RANGE + 50) {
        // Back away
        if (distance > 0) {
            keys.ArrowLeft = true;
        } else {
            keys.ArrowRight = true;
        }
    } else if (absDistance > COMBAT_CONFIG.PROJECTILE_RANGE - 50) {
        // Move closer
        if (distance > 0) {
            keys.ArrowRight = true;
        } else {
            keys.ArrowLeft = true;
        }
    }
    
    // Shoot if cooldown is ready
    if (bot.projectileCooldown <= 0 && 
        absDistance < COMBAT_CONFIG.PROJECTILE_RANGE) {
        keys.l = true;
    }
}

export { combatState, COMBAT_CONFIG };