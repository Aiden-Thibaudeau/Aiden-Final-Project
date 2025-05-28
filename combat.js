import { GAME_CONFIG } from './constants.js';

export class CombatSystem {
  constructor() {
    this.projectiles = [];
  }

  handlePunching(attacker, defender, punchPressed) {
    // Handle charging
    if (punchPressed && attacker.punchCooldown <= 0 && !attacker.punching) {
      if (!attacker.charging) {
        attacker.charging = true;
        attacker.chargeTime = 0;
      } else {
        attacker.chargeTime = Math.min(attacker.chargeTime + 1, GAME_CONFIG.MAX_CHARGE_TIME);
      }
      
      const chargeProgress = attacker.chargeTime / GAME_CONFIG.MAX_CHARGE_TIME;
      attacker.chargeMultiplier = GAME_CONFIG.MIN_CHARGE_MULTIPLIER + 
        (GAME_CONFIG.MAX_CHARGE_MULTIPLIER - GAME_CONFIG.MIN_CHARGE_MULTIPLIER) * chargeProgress;
    }
    
    // Release punch when key is released
    if (!punchPressed && attacker.charging && attacker.punchCooldown <= 0) {
      attacker.charging = false;
      attacker.punching = true;
      attacker.punchTimer = GAME_CONFIG.PUNCH_DURATION;
      attacker.punchCooldown = GAME_CONFIG.PUNCH_COOLDOWN;
    }

    if (attacker.punching) {
      attacker.punchTimer--;
      if (attacker.punchTimer <= 0) {
        attacker.punching = false;
        attacker.chargeMultiplier = 1;
      } else {
        this.checkPunchHit(attacker, defender);
      }
    }

    if (attacker.punchCooldown > 0) {
      attacker.punchCooldown--;
    }
  }

  checkPunchHit(attacker, defender) {
    const punchWidth = 60;
    const punchHeight = 30;
    const punchX = attacker.facing === 1 ? attacker.x + attacker.width : attacker.x - punchWidth;
    const punchY = attacker.y + attacker.height / 4;

    if (
      punchX < defender.x + defender.width &&
      punchX + punchWidth > defender.x &&
      punchY < defender.y + defender.height &&
      punchY + punchHeight > defender.y
    ) {
      const knockDirection = attacker.facing;
      const chargedKnockback = GAME_CONFIG.KNOCKBACK_FORCE * attacker.chargeMultiplier;
      const chargeDamage = 0.3 * attacker.chargeMultiplier;
      
      defender.knockbackDx = knockDirection * (chargedKnockback * defender.knockbackMultiplier);
      defender.dy = -10 * Math.sqrt(attacker.chargeMultiplier);
      defender.knockbackMultiplier = Math.min(defender.knockbackMultiplier + chargeDamage, 11);
      defender.stretchFactor = 1.4;
    }
  }

  handleProjectile(player, projectilePressed) {
    // Handle projectile charging
    if (projectilePressed && player.projectileCooldown <= 0) {
      if (!player.chargingProjectile) {
        player.chargingProjectile = true;
        player.projectileChargeTime = 0;
      } else {
        player.projectileChargeTime = Math.min(player.projectileChargeTime + 1, GAME_CONFIG.MAX_CHARGE_TIME);
      }
      
      const chargeProgress = player.projectileChargeTime / GAME_CONFIG.MAX_CHARGE_TIME;
      player.projectileChargeMultiplier = GAME_CONFIG.MIN_CHARGE_MULTIPLIER + 
        (GAME_CONFIG.MAX_CHARGE_MULTIPLIER - GAME_CONFIG.MIN_CHARGE_MULTIPLIER) * chargeProgress;
    }
    
    // Release projectile when key is released
    if (!projectilePressed && player.chargingProjectile && player.projectileCooldown <= 0) {
      player.chargingProjectile = false;
      this.createProjectile(player);
      player.projectileCooldown = GAME_CONFIG.PROJECTILE_COOLDOWN;
      player.projectileChargeMultiplier = 1;
    }

    if (player.projectileCooldown > 0) {
      player.projectileCooldown--;
    }
  }

  createProjectile(player) {
    const dir = player.facing;
    const chargedSpeed = GAME_CONFIG.PROJECTILE_SPEED * player.projectileChargeMultiplier;
    const chargedSize = Math.round(20 + (player.projectileChargeMultiplier - 1) * 15);
    
    this.projectiles.push({
      x: player.x + (dir === 1 ? player.width : -chargedSize),
      y: player.y + player.height / 2 - chargedSize/2,
      width: chargedSize,
      height: chargedSize,
      dx: chargedSpeed * dir,
      owner: player,
      chargeMultiplier: player.projectileChargeMultiplier
    });
  }

  updateProjectiles(player1, player2, canvas) {
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.x += p.dx;

      const target = p.owner === player1 ? player2 : player1;
      
      // Check collision with target
      if (
        p.x < target.x + target.width &&
        p.x + p.width > target.x &&
        p.y < target.y + target.height &&
        p.y + p.height > target.y
      ) {
        const chargedKnockback = GAME_CONFIG.PROJECTILE_KNOCKBACK * (p.chargeMultiplier || 1);
        const chargeDamage = 0.2 * (p.chargeMultiplier || 1);
        
        target.knockbackDx = Math.sign(p.dx) * (chargedKnockback * target.knockbackMultiplier);
        target.dy = -8 * Math.sqrt(p.chargeMultiplier || 1);
        target.knockbackMultiplier = Math.min(target.knockbackMultiplier + chargeDamage, 11);
        target.stretchFactor = 1.3;

        this.projectiles.splice(i, 1);
        continue;
      }    

      // Remove projectiles that go off screen
      if (p.x < 0 || p.x > canvas.width) {
        this.projectiles.splice(i, 1);
      }
    }
  }

  reset() {
    this.projectiles = [];
  }
}