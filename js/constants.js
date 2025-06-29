// Game physics
export const GRAVITY = 1.5;
export const JUMP_STRENGTH = 20;
export const PLAYER_SPEED = 8;
export const MAX_JUMPS = 2;

// Combat constants
export const PUNCH_DURATION = 10;
export const PUNCH_COOLDOWN = 20;
export const KNOCKBACK_FORCE = 15;
export const PROJECTILE_SPEED = 12;
export const PROJECTILE_COOLDOWN = 20;
export const PROJECTILE_KNOCKBACK = 10;

// Charging mechanics
export const MAX_CHARGE_TIME = 90; // 1.5 seconds at 60fps
export const MIN_CHARGE_MULTIPLIER = 1.0;
export const MAX_CHARGE_MULTIPLIER = 2.5;

// Stage boundaries
export const HORIZONTAL_BOUNDARY_OFFSET = 150; // Pixels off screen before losing a stock

// Color mappings for player sprites
export const colorNames = {
    '#FF6347': 'red',    // Tomato red
    '#4682B4': 'blue',   // Steel blue
    '#32CD32': 'green',  // Lime green
    '#FFD700': 'yellow',   // yellow
    '#8A2BE2': 'purple'  // Blue violet
};

// Character stats for each color variant
export const characterStats = {
    '#FF6347': { // Red - Balanced fighter
        speed: 10,
        jumpStrength: 20,
        maxJumps: 2,
        punchPower: 1,
        punchSpeed: 1.0,
        projectileSpeed: 1.0,
        projectilePower: 1.0,
        weight: 1.0
    },
    '#4682B4': { // Blue - Heavy hitter
        speed: 7,
        jumpStrength: 16,
        maxJumps: 2,
        punchPower: 2,
        punchSpeed: 0.7,
        projectileSpeed: 0.8,
        projectilePower: 1.4,
        weight: 1.4
    },
    '#32CD32': { // Green - Fast and agile
        speed: 13,
        jumpStrength: 24,
        maxJumps: 2,
        punchPower: 0.7,
        punchSpeed: 1.5,
        projectileSpeed: 1.5,
        projectilePower: 0.7,
        weight: 0.7
    },
    '#FFD700': { // Yellow - Projectile specialist
        speed: 10,
        jumpStrength: 20,
        maxJumps: 2,
        punchPower: 0.8,
        punchSpeed: 1.0,
        projectileSpeed: 1.4,
        projectilePower: 1.7,
        weight: 0.9
    },
    '#8A2BE2': { // Purple - Technical fighter
        speed: 9,
        jumpStrength: 21,
        maxJumps: 2,
        punchPower: 1.1,
        punchSpeed: 1.1,
        projectileSpeed: 1.4,
        projectilePower: 1,
        weight: 1.0
    }
};

// Stage configurations
export const stageLayouts = {
    classic: {
        platforms: [
            { x: 0.25, y: 0.5, width: 0.5, height: 100 }
        ],
        spawns: {
            player1: { x: 0.3, y: 0.3 },  // 30% from left, 30% from top
            player2: { x: 0.7, y: 0.3 }   // 70% from left, 30% from top
        }
    },
    floating: {
        platforms: [
            { x: 0.25, y: 0.5, width: 0.5, height: 100 },
            { x: 0.1, y: 0.3, width: 0.2, height: 100 },
            { x: 0.7, y: 0.3, width: 0.2, height: 100 }
        ],
        spawns: {
            player1: { x: 0.2, y: 0.15 },
            player2: { x: 0.8, y: 0.15 }
        }
    },
    challenge: {
        platforms: [
            { x: 0.35, y: 0.5, width: 0.3, height: 100 },
            { x: 0.1, y: 0.35, width: 0.15, height: 100 },
            { x: 0.75, y: 0.35, width: 0.15, height: 100 }
        ],
        spawns: {
            player1: { x: 0.15, y: 0.2 },
            player2: { x: 0.85, y: 0.2 }
        }
    }
};