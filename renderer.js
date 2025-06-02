import { MAX_CHARGE_TIME, MAX_CHARGE_MULTIPLIER } from './constants.js';

export function getDarkenedColor(baseColor, multiplier) {
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

export function drawPlayer(ctx, player, platform) {
  const color = getDarkenedColor(player.color, player.knockbackMultiplier);
  ctx.fillStyle = color;
  
  const animatedWidth = player.width * (player.grounded ? player.squishFactor : 1/player.stretchFactor);
  const animatedHeight = player.height * (player.grounded ? 1/player.squishFactor : player.stretchFactor);
  
  const animatedX = player.x + (player.width - animatedWidth) / 2;
  const animatedY = player.y + (player.height - animatedHeight) + (player.floatOffset || 0);
  
  if (!player.grounded && Math.abs(player.dx) > 2) {
    ctx.save();
    ctx.translate(animatedX + animatedWidth/2, animatedY + animatedHeight/2);
    ctx.rotate(player.dx * 0.02);
    ctx.fillRect(-animatedWidth/2, -animatedHeight/2, animatedWidth, animatedHeight);
    ctx.restore();
  } else {
    ctx.fillRect(animatedX, animatedY, animatedWidth, animatedHeight);
  }
  
  if (!player.grounded) {
    const shadowY = platform.y + 5;
    const shadowAlpha = Math.max(0.1, 0.3 - (player.y - platform.y) / 200);
    const shadowWidth = animatedWidth * (0.8 - (player.y - platform.y) / 400);
    
    ctx.fillStyle = `rgba(0, 0, 0, ${shadowAlpha})`;
    ctx.fillRect(
      player.x + (player.width - shadowWidth) / 2, 
      shadowY, 
      shadowWidth, 
      8
    );
  }
}

export function drawPlatform(ctx, platform) {
  ctx.fillStyle = '#8B4513';
  ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
}

export function drawPunch(ctx, player, color) {
  if (!player.punching && !player.charging) return;

  const punchWidth = 60;
  const punchHeight = 30;
  const punchX = player.facing === 1 ? player.x + player.width : player.x - punchWidth;
  const punchY = player.y + player.height / 4;

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
    
    const barWidth = 60;
    const barHeight = 8;
    const barX = player.x + (player.width - barWidth) / 2;
    const barY = player.y - 20;
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(barX, barY, barWidth, barHeight);
    
    ctx.fillStyle = `rgba(255, ${255 - chargeProgress * 255}, 0, 0.8)`;
    ctx.fillRect(barX, barY, barWidth * chargeProgress, barHeight);
    
    ctx.globalAlpha = 1;
  }
}

export function drawProjectileCharging(ctx, player) {
  if (!player.chargingProjectile) return;
  
  const chargeProgress = player.projectileChargeTime / MAX_CHARGE_TIME;
  const dir = player.facing;
  const chargedSize = Math.round(20 + (player.projectileChargeMultiplier - 1) * 15);
  const projectileX = player.x + (dir === 1 ? player.width + 10 : -chargedSize - 10);
  const projectileY = player.y + player.height / 2 - chargedSize/2;
  
  const pulse = Math.sin(player.projectileChargeTime * 0.4) * 0.3 + 0.7;
  const intensity = Math.round(255 * chargeProgress);
  
  ctx.fillStyle = `rgba(255, ${255 - intensity * 0.5}, 0, ${0.3 + chargeProgress * 0.5})`;
  ctx.globalAlpha = pulse;
  ctx.fillRect(projectileX, projectileY, chargedSize, chargedSize);
  
  const barWidth = 40;
  const barHeight = 6;
  const barX = projectileX + (chargedSize - barWidth) / 2;
  const barY = projectileY - 15;
  
  ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
  ctx.fillRect(barX, barY, barWidth, barHeight);
  
  ctx.fillStyle = `rgba(255, ${255 - chargeProgress * 255}, 0, 0.8)`;
  ctx.fillRect(barX, barY, barWidth * chargeProgress, barHeight);
  
  ctx.globalAlpha = 1;
}

export function drawProjectiles(ctx, projectiles) {
  projectiles.forEach(p => {
    const charge = p.chargeMultiplier || 1;
    const intensity = Math.round(255 * Math.min(charge / MAX_CHARGE_MULTIPLIER, 1));
    ctx.fillStyle = `rgb(255, ${255 - intensity * 0.5}, 0)`;
    
    if (charge > 1.5) {
      ctx.shadowColor = ctx.fillStyle;
      ctx.shadowBlur = 10;
    }
    
    ctx.fillRect(p.x, p.y, p.width, p.height);
    ctx.shadowBlur = 0;
  });
}

export function drawWinnerText(ctx, canvas, player1) {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = player1.stocks <= 0 ? '#4682B4' : '#FF6347';
  ctx.font = '60px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(`${player1.stocks <= 0 ? 'Player 2' : 'Player 1'} Wins!`, canvas.width / 2, canvas.height / 2 - 60);
}