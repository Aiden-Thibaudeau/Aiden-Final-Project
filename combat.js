import { 
  PUNCH_DURATION, PUNCH_COOLDOWN, KNOCKBACK_FORCE, 
  PROJECTILE_SPEED, PROJECTILE_COOLDOWN, PROJECTILE_KNOCKBACK,
  MAX_CHARGE_TIME, MIN_CHARGE_MULTIPLIER, MAX_CHARGE_MULTIPLIER 
} from './constants.js';
import { keys } from './input.js';

export const projectiles = [];

export function handlePunching(attacker, defender, punchKey) {
  if (keys[punchKey] && attacker.punchCooldown <= 0 && !attacker.punching) {
    if (!attacker.charging) {
      attacker.charging = true;
      attacker.chargeTime = 0;
    } else {
      attacker.chargeTime = Math.min(attacker.chargeTime + 1, MAX_CHARGE_TIME);
    }
    
    const chargeProgress = attacker.chargeTime / MAX_CHARGE_TIME;
    attacker.chargeMultiplier = MIN_CHARGE_MULTIPLIER + 
      (MAX_CHARGE_MULTIPLIER - MIN_CHARGE_MULTIPLIER) * chargeProgress;
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
        const chargedKnockback = KNOCKBACK_FORCE * attacker.chargeMultiplier;
        const chargeDamage = 0.3 * attacker.chargeMultiplier;
        
        defender.knockbackDx = knockDirection * (chargedKnockback * defender.knockbackMultiplier);
        defender.dy = -10 * Math.sqrt(attacker.chargeMultiplier);
        defender.knockbackMultiplier = Math.min(defender.knockbackMultiplier + chargeDamage, 11);
        defender.stretchFactor = 1.4;
      }
    }
  }

  if (attacker.punchCooldown > 0) {
    attacker.punchCooldown--;
  }
}

export function shootProjectile(player, key) {
  if (keys[key] && player.projectileCooldown <= 0) {
    if (!player.chargingProjectile) {
      player.chargingProjectile = true;
      player.projectileChargeTime = 0;
    } else {
      player.projectileChargeTime = Math.min(player.projectileChargeTime + 1, MAX_CHARGE_TIME);
    }
    
    const chargeProgress = player.projectileChargeTime / MAX_CHARGE_TIME;
    player.projectileChargeMultiplier = MIN_CHARGE_MULTIPLIER + 
      (MAX_CHARGE_MULTIPLIER - MIN_CHARGE_MULTIPLIER) * chargeProgress;
  }
  
  if (!keys[key] && player.chargingProjectile && player.projectileCooldown <= 0) {
    player.chargingProjectile = false;
    const dir = player.facing;
    
    const chargedSpeed = PROJECTILE_SPEED * player.projectileChargeMultiplier;
    const chargedSize = Math.round(20 + (player.projectileChargeMultiplier - 1) * 15);
    
    projectiles.push({
      x: player.x + (dir === 1 ? player.width : -chargedSize),
      y: player.y + player.height / 2 - chargedSize/2,
      width: chargedSize,
      height: chargedSize,
      dx: chargedSpeed * dir,
      owner: player,
      chargeMultiplier: player.projectileChargeMultiplier
    });
    
    player.projectileCooldown = PROJECTILE_COOLDOWN;
    player.projectileChargeMultiplier = 1;
  }

  if (player.projectileCooldown > 0) {
    player.projectileCooldown--;
  }
}

export function updateProjectiles(player1, player2) {
  for (let i = projectiles.length - 1; i >= 0; i--) {
    const p = projectiles[i];
    p.x += p.dx;

    const target = p.owner === player1 ? player2 : player1;
    if (
      p.x < target.x + target.width &&
      p.x + p.width > target.x &&
      p.y < target.y + target.height &&
      p.y + p.height > target.y
    ) {
      const chargedKnockback = PROJECTILE_KNOCKBACK * (p.chargeMultiplier || 1);
      const chargeDamage = 0.2 * (p.chargeMultiplier || 1);
      
      target.knockbackDx = Math.sign(p.dx) * (chargedKnockback * target.knockbackMultiplier);
      target.dy = -8 * Math.sqrt(p.chargeMultiplier || 1);
      target.knockbackMultiplier = Math.min(target.knockbackMultiplier + chargeDamage, 11);
      target.stretchFactor = 1.3;

      projectiles.splice(i, 1);
      continue;
    }    

    if (p.x < 0 || p.x > window.innerWidth) {
      projectiles.splice(i, 1);
    }
  }
}