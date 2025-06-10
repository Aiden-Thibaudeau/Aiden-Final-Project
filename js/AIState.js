// State management and utility functions for AI

/**
 * Represents the current state of the game
 */
export class GameState {
    constructor(bot, player, platforms) {
        this.bot = bot;
        this.player = player;
        this.platforms = platforms;
        this.update();
    }    update() {
        const mainPlatform = this.platforms[0];
        this.distanceToPlayer = this.player.x - this.bot.x;
        this.absDistance = Math.abs(this.distanceToPlayer);
        this.verticalDistance = this.player.y - this.bot.y;
        this.absVerticalDistance = Math.abs(this.verticalDistance);
        
        // Critical recovery checks
        this.needsCriticalRecovery = 
            this.bot.x < mainPlatform.x || // Left of platform
            this.bot.x > mainPlatform.x + mainPlatform.width || // Right of platform
            this.bot.y > mainPlatform.y; // Below platform
        
        // Core state checks
        this.isOffPlatform = this.bot.x < mainPlatform.x - 150 || 
                            this.bot.x > mainPlatform.x + mainPlatform.width + 150 ||
                            this.bot.y > mainPlatform.y + 200;
        
        this.isNearEdge = isNearPlatformEdge(this.bot, this.platforms);
        this.isInDanger = this.isOffPlatform || this.isNearEdge;
        
        // Combat ranges
        this.isInCloseRange = this.absDistance < 100 && this.absVerticalDistance < 80;
        this.isInMidRange = this.absDistance < 300 && this.absVerticalDistance < 100;
        
        // Player state analysis
        this.playerIsCharging = this.player.charging;
        this.playerIsDashing = this.player.isDashing;
        this.playerIsAttacking = this.player.punching;
        this.playerIsVulnerable = !this.playerIsCharging && !this.playerIsDashing && !this.playerIsAttacking;
    }
}

/**
 * Evaluates and scores potential actions based on current state
 */
export function calculateUtility(action, state) {
    let score = 0;
    
    // Base scores for different action types
    const baseScores = {
        recover: 1000,    // Critical priority
        evade: 800,       // High priority
        attack: 600,      // Medium-high priority
        position: 400,    // Medium priority
        idle: 200         // Low priority
    };
    
    score += baseScores[action.type] || 0;
    
    // Survival modifiers
    if (state.isOffPlatform) {
        score += action.type === 'recover' ? 2000 : -500;
    }
    
    if (state.isNearEdge) {
        score += action.type === 'recover' ? 1000 : -200;
    }
    
    // Combat modifiers
    if (action.type === 'attack') {
        if (!state.playerIsVulnerable) score -= 300;
        if (state.bot.punchCooldown > 0 && action.name === 'punch') score -= 1000;
        if (state.bot.projectileCooldown > 0 && action.name === 'shoot') score -= 1000;
    }
    
    // Positioning modifiers
    if (action.type === 'position') {
        if (state.isInCloseRange && !state.playerIsVulnerable) score -= 200;
        if (state.absVerticalDistance > 100) score += 300;
    }
    
    // Resource management
    if (action.name === 'jump' && state.bot.jumpsLeft <= 1) {
        score -= 400; // Preserve last jump for recovery
    }
    
    return score;
}

/**
 * Generates a list of valid actions based on current state
 */
export function generateActions(state) {
    const actions = [];
    
    // Critical recovery action - highest priority of all
    if (state.needsCriticalRecovery) {
        actions.push({
            type: 'criticalRecover',
            name: 'emergencyJump',
            score: 10000, // Extremely high base score to ensure it's selected
            execute: (keys) => {
                const platformCenter = state.platforms[0].x + state.platforms[0].width / 2;
                // Always try to jump when in critical recovery
                if (state.bot.jumpsLeft > 0) {
                    keys['ArrowUp'] = true;
                }
                // Move toward platform center
                keys['ArrowRight'] = state.bot.x < platformCenter;
                keys['ArrowLeft'] = !keys['ArrowRight'];
            }
        });
        // Return immediately with only the critical recovery action
        return actions;
    }
    
    // Regular recovery actions (high priority but not critical)
    if (state.isOffPlatform || state.isNearEdge) {
        actions.push({
            type: 'recover',
            name: 'moveToCenter',
            score: 0,
            execute: (keys) => {
                const platformCenter = state.platforms[0].x + state.platforms[0].width / 2;
                keys['ArrowRight'] = state.bot.x < platformCenter;
                keys['ArrowLeft'] = !keys['ArrowRight'];
                if (state.bot.jumpsLeft > 0 && !state.bot.jumping) {
                    keys['ArrowUp'] = true;
                }
            }
        });
    }
    
    // Combat actions
    if (!state.isInDanger) {
        if (state.isInCloseRange && state.bot.punchCooldown <= 0) {
            actions.push({
                type: 'attack',
                name: 'punch',
                score: 0,
                execute: (keys) => {
                    keys['k'] = true;
                }
            });
        }
        
        if (state.isInMidRange && state.bot.projectileCooldown <= 0) {
            actions.push({
                type: 'attack',
                name: 'shoot',
                score: 0,
                execute: (keys) => {
                    keys['l'] = true;
                }
            });
        }
    }
    
    // Evasive actions
    if (state.playerIsCharging || state.playerIsDashing || 
        (state.playerIsAttacking && state.isInCloseRange)) {
        actions.push({
            type: 'evade',
            name: 'jumpAway',
            score: 0,
            execute: (keys) => {
                if (state.bot.grounded && state.bot.jumpsLeft > 0) {
                    keys['ArrowUp'] = true;
                    keys['ArrowRight'] = state.distanceToPlayer < 0;
                    keys['ArrowLeft'] = !keys['ArrowRight'];
                }
            }
        });
    }
    
    // Positioning actions
    if (!state.isInDanger && !state.isInCloseRange) {
        actions.push({
            type: 'position',
            name: 'approach',
            score: 0,
            execute: (keys) => {
                keys['ArrowRight'] = state.distanceToPlayer > 0;
                keys['ArrowLeft'] = !keys['ArrowRight'];
            }
        });
    }
    
    return actions;
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
