import { keys } from './input.js';

// Behavior Tree Status Enum
const Status = {
    SUCCESS: 'SUCCESS',
    FAILURE: 'FAILURE',
    RUNNING: 'RUNNING'
};

// Base Node class for behavior tree
class BTNode {
    tick(blackboard) {
        throw new Error('tick() not implemented');
    }
}

// Selector node - succeeds if ANY child succeeds (OR logic)
class Selector extends BTNode {
    constructor(children) {
        super();
        this.children = children;
    }

    tick(blackboard) {
        for (const child of this.children) {
            const status = child.tick(blackboard);
            if (status !== Status.FAILURE) {
                return status;
            }
        }
        return Status.FAILURE;
    }
}

// Sequence node - succeeds if ALL children succeed (AND logic)
class Sequence extends BTNode {
    constructor(children) {
        super();
        this.children = children;
    }

    tick(blackboard) {
        for (const child of this.children) {
            const status = child.tick(blackboard);
            if (status !== Status.SUCCESS) {
                return status;
            }
        }
        return Status.SUCCESS;
    }
}

// Recovery Action Nodes
class CheckCriticalOffPlatform extends BTNode {
    tick(blackboard) {
        const { bot, mainPlatform } = blackboard;
        const platformCenter = mainPlatform.x + mainPlatform.width / 2;
        const horizontalDistance = Math.abs(bot.x - platformCenter);
        const verticalDistance = bot.y - mainPlatform.y;
        
        // Critical if far horizontally OR falling below platform
        const isCritical = horizontalDistance > mainPlatform.width / 2 + 50 || 
                          verticalDistance > 100;
        
        return isCritical ? Status.SUCCESS : Status.FAILURE;
    }
}

class SmartRecoveryMovement extends BTNode {
    tick(blackboard) {
        const { bot, mainPlatform } = blackboard;
        const platformCenter = mainPlatform.x + mainPlatform.width / 2;
        const horizontalDistance = bot.x - platformCenter;
        
        // More aggressive movement when far from platform
        const distanceRatio = Math.abs(horizontalDistance) / (mainPlatform.width / 2 + 100);
        const moveThreshold = Math.max(10, 50 - distanceRatio * 30);
        
        if (Math.abs(horizontalDistance) > moveThreshold) {
            if (horizontalDistance < 0) {
                keys['ArrowRight'] = true;
            } else {
                keys['ArrowLeft'] = true;
            }
        }
        
        return Status.SUCCESS;
    }
}

class SmartRecoveryJump extends BTNode {
    tick(blackboard) {
        const { bot, mainPlatform } = blackboard;
        const platformCenter = mainPlatform.x + mainPlatform.width / 2;
        const horizontalDistance = Math.abs(bot.x - platformCenter);
        const verticalDistance = bot.y - mainPlatform.y;
        
        if (!bot.jumpsLeft) return Status.FAILURE;
        
        // Jump conditions for recovery
        const shouldJump = 
            // Falling fast and have room below
            (bot.dy > 5 && verticalDistance < 200) ||
            // Below platform level with horizontal momentum toward platform
            (verticalDistance > 20 && horizontalDistance > 30 && 
             ((bot.x < platformCenter && bot.dx > 0) || (bot.x > platformCenter && bot.dx < 0))) ||
            // Emergency jump when very far
            (horizontalDistance > 150 && verticalDistance > 0) ||
            // Jump when approaching platform from below
            (verticalDistance > 50 && horizontalDistance < 100);
        
        if (shouldJump) {
            bot.dy = -bot.jumpStrength;
            bot.jumping = true;
            bot.grounded = false;
            bot.jumpsLeft--;
            bot.stretchFactor = 1.3;
            return Status.SUCCESS;
        }
        
        return Status.FAILURE;
    }
}

// Combat Action Nodes
class CheckPlayerInRange extends BTNode {
    tick(blackboard) {
        const { bot, player } = blackboard;
        const horizontalDistance = player.x - bot.x;
        const verticalDistance = Math.abs(player.y - bot.y);
        
        // Store distances for other nodes
        blackboard.horizontalDistance = horizontalDistance;
        blackboard.verticalDistance = verticalDistance;
        blackboard.distanceToPlayer = Math.abs(horizontalDistance);
        
        // Player is in range if reasonably close (expanded from original)
        const inRange = blackboard.distanceToPlayer < 400 && verticalDistance < 120;
        
        return inRange ? Status.SUCCESS : Status.FAILURE;
    }
}

class PerformMeleeAttack extends BTNode {
    tick(blackboard) {
        const { bot, distanceToPlayer, verticalDistance } = blackboard;
        
        // Melee attack if close enough and cooldown ready
        if (distanceToPlayer < 80 && verticalDistance < 60 && bot.punchCooldown <= 0) {
            keys['k'] = true;
            return Status.SUCCESS;
        }
        
        return Status.FAILURE;
    }
}

class PerformRangedAttack extends BTNode {
    tick(blackboard) {
        const { bot, distanceToPlayer, verticalDistance } = blackboard;
        
        // Ranged attack for medium distances
        if (distanceToPlayer >= 80 && distanceToPlayer < 350 && 
            verticalDistance < 100 && bot.projectileCooldown <= 0) {
            keys['l'] = true;
            return Status.SUCCESS;
        }
        
        return Status.FAILURE;
    }
}

class CombatMovement extends BTNode {
    tick(blackboard) {
        const { bot, player, horizontalDistance, distanceToPlayer } = blackboard;
        const optimalDistance = 120; // Preferred fighting distance
        
        // Move to maintain optimal combat distance
        if (distanceToPlayer > optimalDistance + 30) {
            // Too far - move closer
            keys['ArrowLeft'] = horizontalDistance < 0;
            keys['ArrowRight'] = horizontalDistance > 0;
        } else if (distanceToPlayer < optimalDistance - 30) {
            // Too close - back away
            keys['ArrowLeft'] = horizontalDistance > 0;
            keys['ArrowRight'] = horizontalDistance < 0;
        } else {
            // Good distance - slight movement to stay aggressive
            if (Math.random() < 0.3) { // 30% chance for unpredictable movement
                keys['ArrowLeft'] = horizontalDistance > 0;
                keys['ArrowRight'] = horizontalDistance < 0;
            }
        }
        
        return Status.SUCCESS;
    }
}

class CombatJump extends BTNode {
    tick(blackboard) {
        const { bot, player, verticalDistance } = blackboard;
        
        if (!bot.jumpsLeft) return Status.FAILURE;
        
        // Jump in combat situations
        const shouldJump = 
            // Player is above us
            (player.y < bot.y - 40 && verticalDistance > 50) ||
            // Evasive jump (random chance when close)
            (blackboard.distanceToPlayer < 100 && Math.random() < 0.1) ||
            // Jump to attack from above
            (blackboard.distanceToPlayer < 150 && player.y > bot.y + 20 && Math.random() < 0.2);
        
        if (shouldJump) {
            bot.dy = -bot.jumpStrength;
            bot.jumping = true;
            bot.grounded = false;
            bot.jumpsLeft--;
            bot.stretchFactor = 1.3;
            return Status.SUCCESS;
        }
        
        return Status.FAILURE;
    }
}

// Positioning Action Nodes
class CheckNeedRepositioning extends BTNode {
    tick(blackboard) {
        const { bot, mainPlatform } = blackboard;
        const platformCenter = mainPlatform.x + mainPlatform.width / 2;
        const distanceFromCenter = Math.abs(bot.x - platformCenter);
        
        // Need repositioning if too far from platform center
        return distanceFromCenter > mainPlatform.width / 2 + 20 ? Status.SUCCESS : Status.FAILURE;
    }
}

class ReturnToPlatformCenter extends BTNode {
    tick(blackboard) {
        const { bot, mainPlatform } = blackboard;
        const platformCenter = mainPlatform.x + mainPlatform.width / 2;
        const horizontalDistance = bot.x - platformCenter;
        
        if (Math.abs(horizontalDistance) > 20) {
            keys['ArrowLeft'] = horizontalDistance > 0;
            keys['ArrowRight'] = horizontalDistance < 0;
        }
        
        return Status.SUCCESS;
    }
}

// Build the refined behavior tree
const behaviorTree = new Selector([
    // Priority 1: Critical Recovery (when far off platform)
    new Sequence([
        new CheckCriticalOffPlatform(),
        new Selector([
            new Sequence([
                new SmartRecoveryMovement(),
                new SmartRecoveryJump()
            ]),
            new SmartRecoveryMovement() // Fallback to just movement
        ])
    ]),
    
    // Priority 2: Combat (when player is in range)
    new Sequence([
        new CheckPlayerInRange(),
        new Selector([
            // Try melee first
            new PerformMeleeAttack(),
            // Then ranged
            new PerformRangedAttack(),
            // Always do combat movement and potentially jump
            new Sequence([
                new CombatMovement(),
                new CombatJump() // This can fail without affecting the sequence
            ]),
            // Fallback to just combat movement
            new CombatMovement()
        ])
    ]),
    
    // Priority 3: Platform positioning (default behavior)
    new Sequence([
        new CheckNeedRepositioning(),
        new ReturnToPlatformCenter()
    ])
]);

/**
 * Updates bot behavior based on game state
 * @param {Object} bot - The bot player object
 * @param {Object} player - The human player object
 * @param {Object} platforms - Array of platforms
 */
export function updateBot(bot, player, platforms) {
    // Reset controls
    keys['ArrowLeft'] = false;
    keys['ArrowRight'] = false;
    keys['ArrowUp'] = false;
    keys['k'] = false;
    keys['l'] = false;

    // Create blackboard for sharing data between nodes
    const blackboard = {
        bot,
        player,
        mainPlatform: platforms[0],
        horizontalDistance: 0,
        verticalDistance: 0,
        distanceToPlayer: 0
    };

    // Execute behavior tree
    behaviorTree.tick(blackboard);
}