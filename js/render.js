import { backgroundImage, getPlayerImage } from './assets.js';
import { MAX_CHARGE_TIME, MAX_CHARGE_MULTIPLIER } from './constants.js';
import { setRestartButtonBounds } from './input.js';
import { isBot } from './ui.js';

/**
 * Draw the game background
 */
export function drawBackground(ctx) {
    if (backgroundImage.complete && backgroundImage.naturalWidth > 0) {
        ctx.drawImage(backgroundImage, 0, 0, ctx.canvas.width, ctx.canvas.height);
    } else {
        const gradient = ctx.createLinearGradient(0, 0, 0, ctx.canvas.height);
        gradient.addColorStop(0, '#87CEEB');
        gradient.addColorStop(1, '#98FB98');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    }
}

// Cache for platform gradients
let platformGradients = null;

/**
 * Draw all platforms
 */
export function drawPlatforms(ctx, platforms) {
    platforms.forEach(platform => {
        drawPlatform(ctx, platform);
    });
}

/**
 * Draw a single platform
 */
export function drawPlatform(ctx, platform) {
    const { x, y, width, height } = platform;
    
    // Create gradients for this platform
    const gradients = {
        main: createPlatformMainGradient(ctx, y, height),
        surface: createPlatformSurfaceGradient(ctx, y, height)
    };
    
    ctx.save();
    
    // Main platform body
    ctx.fillStyle = gradients.main;
    ctx.fillRect(x, y, width, height);
    
    // Surface
    ctx.fillStyle = gradients.surface;
    ctx.fillRect(x, y, width, height * 0.2);
    
    // Platform effects
    drawPlatformEffects(ctx, x, y, width, height);
    
    ctx.restore();
}

function createPlatformMainGradient(ctx, y, height) {
    const gradient = ctx.createLinearGradient(0, y, 0, y + height);
    gradient.addColorStop(0, '#2C1810');
    gradient.addColorStop(0.3, '#1A1A2E');
    gradient.addColorStop(0.7, '#16213E');
    gradient.addColorStop(1, '#0F0F23');
    return gradient;
}

function createPlatformSurfaceGradient(ctx, y, height) {
    const gradient = ctx.createLinearGradient(0, y, 0, y + height * 0.2);
    gradient.addColorStop(0, '#4A4A8A');
    gradient.addColorStop(0.5, '#2E2E5E');
    gradient.addColorStop(1, '#1A1A2E');
    return gradient;
}

function drawPlatformEffects(ctx, x, y, width, height) {
    // Simplified platform effects
    ctx.strokeStyle = '#8470FF';
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.7;
    
    // Reduced number of energy lines
    for (let i = 1; i < 3; i++) {
        const lineY = y + height * 0.3 + (i * height * 0.3);
        ctx.beginPath();
        ctx.moveTo(x + 10, lineY);
        ctx.lineTo(x + width - 10, lineY);
        ctx.stroke();
    }
    
    ctx.globalAlpha = 1;
}

/**
 * Draw a player with optimized transformations
 */
export function drawPlayer(ctx, player, player1, player2) {
    const scale = player.grounded ? player.squishFactor : 1 / player.stretchFactor;
    const verticalScale = player.grounded ? 1 / player.squishFactor : player.stretchFactor;
    
    const width = player.width * 1.5 * scale;
    const height = player.height * 1.5 * verticalScale;
    const x = player.x + (player.width * 2 - width) / 2;
    const y = player.y + (player.height * 2 - height) + (player.floatOffset || 0);
    
    ctx.save();
    
    // Batch transformations
    if (player.facing === -1) {
        ctx.translate(x + width, y);
        ctx.scale(-1, 1);
    } else {
        ctx.translate(x, y);
    }
    
    const currentPlayerImage = getPlayerImage(player, player1, player2);
    
    if (!player.grounded && Math.abs(player.dx) > 2) {
        ctx.rotate(player.dx * 0.02);
    }
    
    if (currentPlayerImage?.complete && currentPlayerImage.naturalWidth > 0) {
        ctx.drawImage(currentPlayerImage, 0, 0, width, height);
    } else {
        ctx.fillStyle = player.color;
        ctx.fillRect(0, 0, width, height);
    }
    
    ctx.restore();
}

// Cache for projectile gradients
const projectileGradients = new Map();

/**
 * Draw all active projectiles with optimized rendering
 */
export function drawProjectiles(ctx, projectiles) {
    ctx.save();
    
    projectiles.forEach(p => {
        const charge = p.chargeMultiplier || 1;
        const intensity = Math.min(charge / MAX_CHARGE_MULTIPLIER, 1);
        
        // Use cached gradient
        let gradient = projectileGradients.get(intensity);
        if (!gradient) {
            gradient = `rgb(255, ${Math.round(255 - intensity * 127)}, 0)`;
            projectileGradients.set(intensity, gradient);
        }
        
        ctx.fillStyle = gradient;
        if (charge > 1.5) {
            ctx.shadowBlur = 10;
            ctx.shadowColor = gradient;
        }
        
        ctx.fillRect(p.x, p.y, p.width, p.height);
        ctx.shadowBlur = 0;
    });
    
    ctx.restore();
}

/**
 * Draw punch effects
 */
export function drawPunch(ctx, player, color) {
    if (!player.punching && !player.charging) return;

    const punchWidth = 60;
    const punchHeight = 30;
    const punchX = player.facing === 1 ? player.x + player.width * 2 - 10 : player.x - punchWidth + 10;
    const punchY = player.y + (player.height * 2) / 2;

    if (player.punching) {
        const alpha = 0.3 + (player.chargeMultiplier - 1) * 0.4;
        ctx.fillStyle = color;
        ctx.globalAlpha = alpha;
        ctx.fillRect(punchX, punchY, punchWidth, punchHeight);
        ctx.globalAlpha = 1;
    } else if (player.charging) {
        const chargeProgress = player.chargeTime / MAX_CHARGE_TIME;
        const chargeAlpha = 0.2 + chargeProgress * 0.6;
        const pulse = Math.sin(player.chargeTime * 0.3) * 0.2 + 0.8;

        ctx.fillStyle = color;
        ctx.globalAlpha = chargeAlpha * pulse;
        ctx.fillRect(punchX, punchY, punchWidth, punchHeight);

        drawChargeBar(ctx, player, punchX, punchY, chargeProgress);
        ctx.globalAlpha = 1;
    }
}

/**
 * Draw projectile charging effects
 */
export function drawProjectileCharging(ctx, player) {
    if (!player.chargingProjectile) return;
    
    const chargeProgress = player.projectileChargeTime / MAX_CHARGE_TIME;
    const dir = player.facing;
    const chargedSize = Math.round(20 + (player.projectileChargeMultiplier - 1) * 15);
    
    const projectileX = dir === 1 ? player.x + player.width * 2 + 10 : player.x - chargedSize - 10;
    const projectileY = player.y + player.height * 2 / 2 - chargedSize/2;
    
    const pulse = Math.sin(player.projectileChargeTime * 0.4) * 0.3 + 0.7;
    
    const intensity = Math.round(255 * chargeProgress);
    ctx.fillStyle = `rgba(255, ${255 - intensity * 0.5}, 0, ${0.3 + chargeProgress * 0.5})`;
    ctx.globalAlpha = pulse;
    ctx.fillRect(projectileX, projectileY, chargedSize, chargedSize);
    
    drawChargeBar(ctx, player, projectileX, projectileY, chargeProgress, 40, 6);
    
    ctx.globalAlpha = 1;
}

/**
 * Draw game over screen
 */
export function drawWinnerText(ctx, player1) {
    // Semi-transparent overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    
    // Winner text with glow effect
    ctx.textAlign = 'center';
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 48px Arial';
    ctx.shadowColor = '#4ecdc4';
    ctx.shadowBlur = 20;
    
    const winner = player1.stocks > 0 ? 'Player 1' : (isBot ? 'Bot' : 'Player 2');
    ctx.fillText(`${winner} Wins!`, ctx.canvas.width / 2, ctx.canvas.height / 3);
    ctx.shadowBlur = 0;
    
    // Draw restart button
    const buttonWidth = 200;
    const buttonHeight = 50;
    const buttonX = (ctx.canvas.width - buttonWidth) / 2;
    const buttonY = ctx.canvas.height / 2;
    
    // Button background with gradient
    const gradient = ctx.createLinearGradient(buttonX, buttonY, buttonX, buttonY + buttonHeight);
    gradient.addColorStop(0, '#4A4A8A');
    gradient.addColorStop(1, '#2E2E5E');
    
    ctx.fillStyle = gradient;
    ctx.strokeStyle = '#8470FF';
    ctx.lineWidth = 2;
    
    // Draw button with rounded corners
    ctx.beginPath();
    ctx.roundRect(buttonX, buttonY, buttonWidth, buttonHeight, 10);
    ctx.fill();
    ctx.stroke();
    
    // Button text
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Restart Game', ctx.canvas.width / 2, buttonY + buttonHeight/2 + 8);

    // Store button coordinates for click detection
    const bounds = { buttonX, buttonY, buttonWidth, buttonHeight };
    setRestartButtonBounds(bounds);
}

function drawChargeBar(ctx, player, x, y, progress, width = 60, height = 8) {
    const barX = x + (width - width) / 2;
    const barY = y - 15;
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(barX, barY, width, height);
    
    ctx.fillStyle = `rgba(255, ${255 - progress * 255}, 0, 0.8)`;
    ctx.fillRect(barX, barY, width * progress, height);
}

export function darkenColor(baseColor, multiplier) {
    const maxMultiplier = 10;
    const factor = Math.min(multiplier / maxMultiplier, 1);

    let hex = baseColor.startsWith('#') ? baseColor.slice(1) : baseColor;
    if (hex.length === 3) {
        hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
    }
    
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    const darken = 1 - factor * 0.7;

    return `rgb(${Math.round(r * darken)}, ${Math.round(g * darken)}, ${Math.round(b * darken)})`;
}