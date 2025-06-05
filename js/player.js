import { PLAYER_SPEED, MAX_JUMPS, GRAVITY, characterStats, colorNames } from './constants.js';
import { keys } from './input.js';

/**
 * Creates a new player object with default properties
 */
export function createPlayer(x, y) {
    const player = {
        x,
        y,
        width: 50,
        height: 50,
        speed: PLAYER_SPEED,
        jumpStrength: 20,
        maxJumps: MAX_JUMPS,
        dx: 0,
        dy: 0,
        jumping: false,
        grounded: false,
        jumpsLeft: MAX_JUMPS,
        punching: false,
        punchTimer: 0,
        punchCooldown: 0,
        facing: 1,
        knockbackDx: 0,
        stocks: 3,
        projectileCooldown: 0,
        knockbackMultiplier: 1,
        charging: false,
        chargeTime: 0,
        chargeMultiplier: 1,
        chargingProjectile: false,
        projectileChargeTime: 0,
        projectileChargeMultiplier: 1,
        animationFrame: 0,
        squishFactor: 1,
        stretchFactor: 1,
        color: null,
        // Stats modifiers
        punchPower: 1.0,
        punchSpeed: 1.0,
        projectileSpeed: 1.0,
        projectilePower: 1.0,
        weight: 1.0
    };
    console.log('Created player at x:', x, 'y:', y);
    return player;
}

/**
 * Apply color-specific stats to a player
 */
export function applyColorStats(player, color) {
    // Save the color
    player.color = color;
    
    // Get stats for this color
    const stats = characterStats[color];
    if (stats) {
        player.speed = stats.speed;
        player.jumpStrength = stats.jumpStrength;
        player.maxJumps = stats.maxJumps;
        player.jumpsLeft = stats.maxJumps;
        player.punchPower = stats.punchPower;
        player.punchSpeed = stats.punchSpeed;
        player.projectileSpeed = stats.projectileSpeed;
        player.projectilePower = stats.projectilePower;
        player.weight = stats.weight;
        console.log(`Applied ${colorNames[color]} stats to player`);
    }
}

/**
 * Update player animation state
 */
export function updatePlayerAnimation(player) {
    player.animationFrame++;
    
    if (player.dy < 0 && !player.grounded) {
        player.stretchFactor = Math.max(player.stretchFactor - 0.02, 1.1);
    } else if (player.dy > 5 && !player.grounded) {
        player.stretchFactor = Math.min(player.stretchFactor + 0.03, 1.2);
    } else {
        if (player.stretchFactor > 1) {
            player.stretchFactor = Math.max(player.stretchFactor - 0.05, 1);
        } else if (player.stretchFactor < 1) {
            player.stretchFactor = Math.min(player.stretchFactor + 0.05, 1);
        }
    }
    
    if (player.grounded && player.squishFactor < 1) {
        player.squishFactor = Math.min(player.squishFactor + 0.08, 1);
    } else if (player.squishFactor > 1) {
        player.squishFactor = Math.max(player.squishFactor - 0.08, 1);
    }
    
    if (!player.grounded && Math.abs(player.dy) < 3) {
        player.floatOffset = Math.sin(player.animationFrame * 0.2) * 2;
    } else {
        player.floatOffset = 0;
    }
}

/**
 * Move player based on input
 */
export function movePlayer(player, leftKey, rightKey) {
    let moveDx = 0;
    if (keys[leftKey]) {
        moveDx = -player.speed;
        player.facing = -1;
    } else if (keys[rightKey]) {
        moveDx = player.speed;
        player.facing = 1;
    }
    player.dx = moveDx + player.knockbackDx;
    player.x += player.dx;

    player.knockbackDx *= 0.8;
    if (Math.abs(player.knockbackDx) < 0.1) {
        player.knockbackDx = 0;
    }
}

/**
 * Apply gravity and handle platform collision
 */
export function applyGravity(player, platform) {
    const wasGrounded = player.grounded;
    player.dy += GRAVITY;
    const nextY = player.y + player.dy;

    const playerRenderHeight = player.height * 2;

    const onPlatform = (
        player.dy > 0 &&
        player.y + playerRenderHeight <= platform.y &&
        nextY + playerRenderHeight >= platform.y &&
        player.x + player.width > platform.x &&
        player.x < platform.x + platform.width
    );

    if (onPlatform) {
        player.dy = 0;
        player.y = platform.y - playerRenderHeight;
        player.grounded = true;
        player.jumping = false;
        player.jumpsLeft = player.maxJumps; // Use player-specific maxJumps
        
        if (!wasGrounded && player.dy > 8) {
            player.squishFactor = 0.7;
        } else if (!wasGrounded) {
            player.squishFactor = 0.85;
        }
    } else {
        player.grounded = false;
    }

    player.y += player.dy;
}

/**
 * Reset player state
 */
export function resetPlayer(player, spawnX, spawnY) {
    const color = player.color; // Remember the color
    const stats = characterStats[color]; // Get the stats
    
    if (player.stocks === 3) {
        player.x = spawnX;
        player.y = 110;
    } else {
        player.x = 700; 
        player.y = 110;
    }
    player.dx = 0;
    player.knockbackDx = 0;
    player.dy = 0;
    player.jumping = false;
    player.grounded = true;
    player.jumpsLeft = stats ? stats.maxJumps : MAX_JUMPS;
    player.knockbackMultiplier = 1;
    player.charging = false;
    player.chargeTime = 0;
    player.chargeMultiplier = 1;
    player.chargingProjectile = false;
    player.projectileChargeTime = 0;
    player.projectileChargeMultiplier = 1;
    player.animationFrame = 0;
    player.squishFactor = 1;
    player.stretchFactor = 1;
    player.floatOffset = 0;
    player.punchCooldown = 0;
    player.projectileCooldown = 0;
    player.punching = false;
    player.charging = false;
    player.chargingProjectile = false;

    // Reapply stats
    if (stats) {
        player.speed = stats.speed;
        player.jumpStrength = stats.jumpStrength;
        player.maxJumps = stats.maxJumps;
        player.jumpsLeft = stats.maxJumps;
        player.punchPower = stats.punchPower;
        player.punchSpeed = stats.punchSpeed;
        player.projectileSpeed = stats.projectileSpeed;
        player.projectilePower = stats.projectilePower;
        player.weight = stats.weight;
    }

    console.log('Reset player to x:', player.x, 'y:', player.y, 'stocks:', player.stocks);
}