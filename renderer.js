import { GAME_CONFIG } from './constants.js';

export class Renderer {
  constructor(canvas, ctx) {
    this.canvas = canvas;
    this.ctx = ctx;
  }

  clearScreen() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  drawPlatform(platform) {
    this.ctx.fillStyle = GAME_CONFIG.PLATFORM_COLOR;
    this.ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
  }

  drawPlayer(player, baseColor, platform) {
    const color = this.getDarkenedColor(baseColor, player.knockbackMultiplier);
    this.ctx.fillStyle = color;
    
    // Calculate animated dimensions and position
    const animatedWidth = player.width * (player.grounded ? player.squishFactor : 1/player.stretchFactor);
    const animatedHeight = player.height * (player.grounded ? 1/player.squishFactor : player.stretchFactor);
    
    const animatedX = player.x + (player.width - animatedWidth) / 2;
    const animatedY = player.y + (player.height - animatedHeight) + (player.floatOffset || 0);
    
    // Add subtle rotation when in air
    if (!player.grounded && Math.abs(player.dx) > 2) {
      this.ctx.save();
      this.ctx.translate(animatedX + animatedWidth/2, animatedY + animatedHeight/2);
      this.ctx.rotate(player.dx * 0.02);
      this.ctx.fillRect(-animatedWidth/2, -animatedHeight/2, animatedWidth, animatedHeight);
      this.ctx.restore();
    } else {
      this.ctx.fillRect(animatedX, animatedY, animatedWidth, animatedHeight);
    }
    
    // Draw shadow when jumping
    if (!player.grounded) {
      const shadowY = platform.y + 5;
      const shadowAlpha = Math.max(0.1, 0.3 - (player.y - platform.y) / 200);
      const shadowWidth = animatedWidth * (0.8 - (player.y - platform.y) / 400);
      
      this.ctx.fillStyle = `rgba(0, 0, 0, ${shadowAlpha})`;
      this.ctx.fillRect(
        player.x + (player.width - shadowWidth) / 2, 
        shadowY, 
        shadowWidth, 
        8
      );
    }
  }

  drawPunch(player, color) {
    if (!player.punching && !player.charging) return;

    const punchWidth = 60;
    const punchHeight = 30;
    const punchX = player.facing === 1 ? player.x + player.width : player.x - punchWidth;
    const punchY = player.y + player.height / 4;

    if (player.punching) {
      const alpha = 0.3 + (player.chargeMultiplier - 1) * 0.4;
      this.ctx.fillStyle = color;
      this.ctx.globalAlpha = alpha;
      this.ctx.fillRect(punchX, punchY, punchWidth, punchHeight);
      this.ctx.globalAlpha = 1;
    } else if (player.charging) {
      this.drawChargingPunch(player, color, punchX, punchY, punchWidth, punchHeight);
    }
  }

  drawChargingPunch(player, color, punchX, punchY, punchWidth, punchHeight) {
    const chargeProgress = player.chargeTime / GAME_CONFIG.MAX_CHARGE_TIME;
    const chargeAlpha = 0.2 + chargeProgress * 0.6;
    const pulse = Math.sin(player.chargeTime * 0.3) * 0.2 + 0.8;
    
    this.ctx.fillStyle = color;
    this.ctx.globalAlpha = chargeAlpha * pulse;
    this.ctx.fillRect(punchX, punchY, punchWidth, punchHeight);
    
    // Draw charge bar
    const barWidth = 60;
    const barHeight = 8;
    const barX = player.x + (player.width - barWidth) / 2;
    const barY = player.y - 20;
    
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    this.ctx.fillRect(barX, barY, barWidth, barHeight);
    
    this.ctx.fillStyle = `rgba(255, ${255 - chargeProgress * 255}, 0, 0.8)`;
    this.ctx.fillRect(barX, barY, barWidth * chargeProgress, barHeight);
    
    this.ctx.globalAlpha = 1;
  }

  drawProjectileCharging(player) {
    if (!player.chargingProjectile) return;
    
    const chargeProgress = player.projectileChargeTime / GAME_CONFIG.MAX_CHARGE_TIME;
    const dir = player.facing;
    const chargedSize = Math.round(20 + (player.projectileChargeMultiplier - 1) * 15);
    const projectileX = player.x + (dir === 1 ? player.width + 10 : -chargedSize - 10);
    const projectileY = player.y + player.height / 2 - chargedSize/2;
    
    const pulse = Math.sin(player.projectileChargeTime * 0.4) * 0.3 + 0.7;
    const intensity = Math.round(255 * chargeProgress);
    
    this.ctx.fillStyle = `rgba(255, ${255 - intensity * 0.5}, 0, ${0.3 + chargeProgress * 0.5})`;
    this.ctx.globalAlpha = pulse;
    this.ctx.fillRect(projectileX, projectileY, chargedSize, chargedSize);
    
    // Draw charge bar
    const barWidth = 40;
    const barHeight = 6;
    const barX = projectileX + (chargedSize - barWidth) / 2;
    const barY = projectileY - 15;
    
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    this.ctx.fillRect(barX, barY, barWidth, barHeight);
    
    this.ctx.fillStyle = `rgba(255, ${255 - chargeProgress * 255}, 0, 0.8)`;
    this.ctx.fillRect(barX, barY, barWidth * chargeProgress, barHeight);
    
    this.ctx.globalAlpha = 1;
  }

  drawProjectiles(projectiles) {
    projectiles.forEach(p => {
      const charge = p.chargeMultiplier || 1;
      const intensity = Math.round(255 * Math.min(charge / GAME_CONFIG.MAX_CHARGE_MULTIPLIER, 1));
      this.ctx.fillStyle = `rgb(255, ${255 - intensity * 0.5}, 0)`;
      
      if (charge > 1.5) {
        this.ctx.shadowColor = this.ctx.fillStyle;
        this.ctx.shadowBlur = 10;
      }
      
      this.ctx.fillRect(p.x, p.y, p.width, p.height);
      this.ctx.shadowBlur = 0;
    });
  }

  drawWinnerText(winner) {
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.ctx.fillStyle = winner === 'player1' ? GAME_CONFIG.PLAYER1_COLOR : GAME_CONFIG.PLAYER2_COLOR;
    this.ctx.font = '60px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(`${winner === 'player1' ? 'Red' : 'Blue'} Wins!`, this.canvas.width / 2, this.canvas.height / 2 - 60);
  }

  getDarkenedColor(baseColor, multiplier) {
    const maxMultiplier = 10;
    const factor = Math.min(multiplier / maxMultiplier, 1);

    const base = {
      '#FF6347': [255, 99, 71],
      '#4682B4': [70, 130, 180],
    };

    const [r, g, b] = base[baseColor];
    const darken = 1 - factor * 0.7;

    return `rgb(${r * darken}, ${g * darken}, ${b * darken})`;
  }
}