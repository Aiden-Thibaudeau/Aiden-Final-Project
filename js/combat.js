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
export const particles = [];
const collisionCache = new Map();

// Particle system for visual effects
class Particle {
    constructor(x, y, options = {}) {
        this.x = x;
        this.y = y;
        this.vx = options.vx || (Math.random() - 0.5) * 10;
        this.vy = options.vy || (Math.random() - 0.5) * 10;
        this.life = options.life || 30;
        this.maxLife = this.life;
        this.size = options.size || Math.random() * 8 + 4;
        this.color = options.color || '#ffffff';
        this.type = options.type || 'spark';
        this.gravity = options.gravity || 0.3;
        this.friction = options.friction || 0.98;
        this.fadeRate = options.fadeRate || 1;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        
        if (this.type === 'spark' || this.type === 'impact') {
            this.vy += this.gravity;
            this.vx *= this.friction;
            this.vy *= this.friction;

        }
        
        this.life -= this.fadeRate;
        this.size *= 0.98;
        
        return this.life > 0 && this.size > 0.5;
    }

    draw(ctx) {
        const alpha = Math.max(0, this.life / this.maxLife);
        ctx.save();
        ctx.globalAlpha = alpha;
        
        if (this.type === 'spark') {
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
            
            // Add glow effect
            ctx.shadowBlur = 20;
            ctx.shadowColor = this.color;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size * 0.5, 0, Math.PI * 2);
            ctx.fill();
        } else if (this.type === 'impact') {
            // Ring explosion effect
            ctx.strokeStyle = this.color;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.stroke();
        } else if (this.type === 'trail') {
            // Trail effect for projectiles
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.ellipse(this.x, this.y, this.size, this.size * 0.6, 0, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.restore();
    }
}

// Create punch impact particles
function createPunchImpact(x, y, direction, chargeMultiplier) {
    const particleCount = Math.floor(8 + chargeMultiplier * 12);
    const colors = ['#ff6b6b', '#ffa500', '#ffff00', '#ffffff'];
    
    // Impact ring
    particles.push(new Particle(x, y, {
        type: 'impact',
        color: '#ff4444',
        size: 20 * chargeMultiplier,
        life: 15,
        vx: 0,
        vy: 0,
        gravity: 0,
        fadeRate: 1.5
    }));
    
    // Spark particles
    for (let i = 0; i < particleCount; i++) {
        const angle = (Math.PI * 2 * i) / particleCount + (Math.random() - 0.5) * 0.5;
        const speed = 3 + Math.random() * 7 * chargeMultiplier;
        
        particles.push(new Particle(x, y, {
            type: 'spark',
            color: colors[Math.floor(Math.random() * colors.length)],
            vx: Math.cos(angle) * speed + direction * 2,
            vy: Math.sin(angle) * speed - 2,
            size: 2 + Math.random() * 6,
            life: 20 + Math.random() * 20,
            gravity: 0.4,
            friction: 0.95
        }));
    }
}

// Create charging effect particles
function createChargeEffect(player, isProjectile = false) {
    const centerX = player.x + player.width;
    const centerY = player.y + player.height;
    const chargeMultiplier = isProjectile ? player.projectileChargeMultiplier : player.chargeMultiplier;
    
    // Create orbital particles
    for (let i = 0; i < 3; i++) {
        const radius = 30 + chargeMultiplier * 20;
        const particle = new Particle(centerX, centerY, {
            type: 'charge',
            color: isProjectile ? '#00ccff' : '#ffaa00',
            size: 4 + chargeMultiplier * 3,
            life: 60,
            gravity: 0,
            fadeRate: 0.5
        });
        
        particle.centerX = centerX;
        particle.centerY = centerY;
        particle.radius = radius;
        particle.angle = (Math.PI * 2 * i) / 3;
        
        particles.push(particle);
    }
    
    // Add energy buildup effect
    if (chargeMultiplier > 1.5) {
        particles.push(new Particle(centerX, centerY, {
            type: 'charge',
            color: isProjectile ? '#ffffff' : '#ff6600',
            size: 8 + chargeMultiplier * 2,
            life: 30,
            gravity: 0,
            fadeRate: 1
        }));
    }
}

// Create projectile trail particles
function createProjectileTrail(projectile) {
    const trailColor = projectile.chargeMultiplier > 1.5 ? '#00aaff' : '#0088cc';
    
    particles.push(new Particle(
        projectile.x + projectile.width / 2 - projectile.dx * 0.5,
        projectile.y + projectile.height / 2,
        {
            type: 'trail',
            color: trailColor,
            vx: -projectile.dx * 0.3 + (Math.random() - 0.5) * 2,
            vy: (Math.random() - 0.5) * 3,
            size: 3 + projectile.chargeMultiplier * 2,
            life: 15,
            gravity: 0.1,
            friction: 0.96,
            fadeRate: 1.2
        }
    ));
}

// Create projectile impact particles
function createProjectileImpact(x, y, projectile) {
    const particleCount = Math.floor(6 + projectile.chargeMultiplier * 8);
    const colors = ['#00ccff', '#0099cc', '#ffffff', '#88ddff'];
    
    // Impact burst
    particles.push(new Particle(x, y, {
        type: 'impact',
        color: '#00aaff',
        size: 15 * projectile.chargeMultiplier,
        life: 12,
        vx: 0,
        vy: 0,
        gravity: 0,
        fadeRate: 1.5
    }));
    
    // Splash particles
    for (let i = 0; i < particleCount; i++) {
        const angle = (Math.PI * 2 * i) / particleCount + (Math.random() - 0.5) * 0.4;
        const speed = 2 + Math.random() * 5 * projectile.chargeMultiplier;
        
        particles.push(new Particle(x, y, {
            type: 'spark',
            color: colors[Math.floor(Math.random() * colors.length)],
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed - 1,
            size: 1 + Math.random() * 4,
            life: 15 + Math.random() * 15,
            gravity: 0.3,
            friction: 0.97
        }));
    }
}

// Update and clean up particles
export function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        if (!particles[i].update()) {
            particles.splice(i, 1);
        }
    }
}

// Render all particles
export function renderParticles(ctx) {
    particles.forEach(particle => particle.draw(ctx));
}

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
            
            // Create charging effect particles every few frames
            if (attacker.chargeTime % 8 === 0) {
                createChargeEffect(attacker, false);
            }
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
                
                // Create impact particles
                const impactX = attacker.facing === 1 ? 
                    Math.min(punchBox.x + punchBox.width, defender.x + defender.width) :
                    Math.max(punchBox.x, defender.x);
                const impactY = defender.y + defender.height;
                
                createPunchImpact(impactX, impactY, attacker.facing, attacker.chargeMultiplier);
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
            
            // Create charging effect particles every few frames
            if (player.projectileChargeTime % 6 === 0) {
                createChargeEffect(player, true);
            }
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

        // Create trail particles
        if (Math.random() < 0.7) {
            createProjectileTrail(p);
        }

        const target = p.owner === player1 ? player2 : player1;
        if (checkProjectileCollision(p, target)) {
            applyProjectileEffect(p, target);
            
            // Create impact particles
            createProjectileImpact(
                p.x + p.width / 2,
                p.y + p.height / 2,
                p
            );
            
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