import { keys } from './input.js';
import {
    MAX_CHARGE_TIME,
    MIN_CHARGE_MULTIPLIER,
    MAX_CHARGE_MULTIPLIER,
    PUNCH_DURATION,
    PUNCH_COOLDOWN,
    KNOCKBACK_FORCE,
    PROJECTILE_SPEED,
    PROJECTILE_COOLDOWN,
    PROJECTILE_KNOCKBACK
} from './constants.js';

export const projectiles = [];
const collisionCache = new Map();

// Helper function for AABB collision detection
function checkCollision(rect1, rect2) {
    const cacheKey = `${rect1.x},${rect1.y},${rect2.x},${rect2.y}`;
    if (collisionCache.has(cacheKey)) {
        return collisionCache.get(cacheKey);
    }
    
    const collision = (
        rect1.x < rect2.x + rect2.width &&
        rect1.x + rect1.width > rect2.x &&
        rect1.y < rect2.y + rect2.height &&
        rect1.y + rect1.height > rect2.y
    );
    
    collisionCache.set(cacheKey, collision);
    if (collisionCache.size > 100) { // Prevent cache from growing too large
        collisionCache.clear();
    }
    
    return collision;
}

/**
 * Handle punch charging, punching, and punch collision/knockback
 */
export function handlePunching(attacker, defender, punchKey) {
    // Skip if not punching or charging
    if (!keys[punchKey] && !attacker.charging && !attacker.punching) {
        return;
    }

    if (keys[punchKey] && attacker.punchCooldown <= 0 && !attacker.punching) {
        if (!attacker.charging) {
            attacker.charging = true;
            attacker.chargeTime = 0;
        } else {
            attacker.chargeTime = Math.min(attacker.chargeTime + 1, MAX_CHARGE_TIME);
            const chargeProgress = attacker.chargeTime / MAX_CHARGE_TIME;
            attacker.chargeMultiplier = MIN_CHARGE_MULTIPLIER + 
                (MAX_CHARGE_MULTIPLIER - MIN_CHARGE_MULTIPLIER) * chargeProgress;
        }
    }

    if (!keys[punchKey] && attacker.charging && attacker.punchCooldown <= 0) {
        attacker.charging = false;
        attacker.punching = true;
        attacker.punchTimer = PUNCH_DURATION;
        attacker.punchCooldown = PUNCH_COOLDOWN;
    }

    if (attacker.punching) {
        attacker.punchTimer--;
        if (attacker.punchTimer <= 0) {
            attacker.punching = false;
            attacker.chargeMultiplier = 1;
        } else {
            const punchBox = {
                x: attacker.facing === 1 ? attacker.x + attacker.width * 2 : attacker.x - 60,
                y: attacker.y + (attacker.height * 2) / 4,
                width: 60,
                height: 30
            };

            const defenderBox = {
                x: defender.x,
                y: defender.y,
                width: defender.width * 2,
                height: defender.height * 2
            };

            if (checkCollision(punchBox, defenderBox)) {
                applyPunchEffect(attacker, defender);
            }
        }
    }

    if (attacker.punchCooldown > 0) {
        attacker.punchCooldown--;
    }
}

function checkPunchCollision(punchX, punchY, punchWidth, punchHeight, defender) {
    return (
        punchX < defender.x + defender.width * 2 &&
        punchX + punchWidth > defender.x &&
        punchY < defender.y + defender.height * 2 &&
        punchY + punchHeight > defender.y
    );
}

function applyPunchEffect(attacker, defender) {
    const knockDirection = attacker.facing;
    // Apply attacker's punch power and defender's weight
    const chargedKnockback = KNOCKBACK_FORCE * attacker.chargeMultiplier * attacker.punchPower / defender.weight;
    const chargeDamage = 0.3 * attacker.chargeMultiplier * attacker.punchPower;
    
    defender.knockbackDx = knockDirection * (chargedKnockback * defender.knockbackMultiplier);
    defender.dy = -10 * Math.sqrt(attacker.chargeMultiplier * attacker.punchPower);
    defender.knockbackMultiplier = Math.min(defender.knockbackMultiplier + chargeDamage, 15);
    defender.stretchFactor = 1.4;
    
    console.log('Punch hit! Defender knockbackMultiplier:', defender.knockbackMultiplier.toFixed(2));
}

/**
 * Handle projectile shooting and charging
 */
export function shootProjectile(player, key) {
    // Adjust cooldown based on projectile speed stat
    const adjustedCooldown = Math.round(PROJECTILE_COOLDOWN / player.projectileSpeed);
    
    if (keys[key] && player.projectileCooldown <= 0) {
        if (!player.chargingProjectile) {
            player.chargingProjectile = true;
            player.projectileChargeTime = 0;
            console.log('Player started charging projectile');
        } else {
            player.projectileChargeTime = Math.min(player.projectileChargeTime + 1, MAX_CHARGE_TIME);
            const chargeProgress = player.projectileChargeTime / MAX_CHARGE_TIME;
            player.projectileChargeMultiplier = MIN_CHARGE_MULTIPLIER + 
                (MAX_CHARGE_MULTIPLIER - MIN_CHARGE_MULTIPLIER) * chargeProgress;
        }
    }

    if (!keys[key] && player.chargingProjectile && player.projectileCooldown <= 0) {
        player.chargingProjectile = false;
        const dir = player.facing;
        // Apply player's projectile stats
        const chargedSpeed = PROJECTILE_SPEED * player.projectileChargeMultiplier * player.projectileSpeed;
        const chargedSize = Math.round(20 + (player.projectileChargeMultiplier - 1) * 15);

        projectiles.push({
            x: player.x + (dir === 1 ? player.width : -chargedSize),
            y: player.y + (player.height * 2) / 2 - chargedSize/2,
            width: chargedSize,
            height: chargedSize,
            dx: chargedSpeed * dir,
            owner: player,
            chargeMultiplier: player.projectileChargeMultiplier
        });

        console.log('Player fired projectile! Multiplier:', player.projectileChargeMultiplier.toFixed(2));
        
        player.projectileCooldown = adjustedCooldown;
        player.projectileChargeMultiplier = 1;
    }

    if (player.projectileCooldown > 0) {
        player.projectileCooldown--;
    }
}

/**
 * Update projectile positions and check for collisions
 */
export function updateProjectiles(player1, player2) {
    for (let i = projectiles.length - 1; i >= 0; i--) {
        const p = projectiles[i];
        p.x += p.dx;

        const target = p.owner === player1 ? player2 : player1;
        if (checkProjectileCollision(p, target)) {
            applyProjectileEffect(p, target);
            projectiles.splice(i, 1);
            continue;
        }

        if (p.x < -p.width || p.x > window.innerWidth + p.width) {
            console.log('Projectile removed (off screen)');
            projectiles.splice(i, 1);
        }
    }
}

function checkProjectileCollision(projectile, target) {
    return (
        projectile.x < target.x + target.width &&
        projectile.x + projectile.width > target.x &&
        projectile.y < target.y + target.height &&
        projectile.y + projectile.height > target.y
    );
}

function applyProjectileEffect(projectile, target) {
    const owner = projectile.owner;
    // Apply owner's projectile power and target's weight
    const chargedKnockback = PROJECTILE_KNOCKBACK * 
        (projectile.chargeMultiplier || 1) * 
        owner.projectilePower / 
        target.weight;
        
    const chargeDamage = 0.2 * 
        (projectile.chargeMultiplier || 1) * 
        owner.projectilePower;
    
    target.knockbackDx = Math.sign(projectile.dx) * (chargedKnockback * target.knockbackMultiplier);
    target.dy = -8 * Math.sqrt((projectile.chargeMultiplier || 1) * owner.projectilePower);
    target.knockbackMultiplier = Math.min(target.knockbackMultiplier + chargeDamage, 15);
    target.stretchFactor = 1.3;

    console.log('Projectile hit! Target knockbackMultiplier:', target.knockbackMultiplier.toFixed(2));
}