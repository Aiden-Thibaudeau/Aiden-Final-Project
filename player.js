import { GAME_CONFIG } from './constants.js';

export class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = 50;
    this.height = 50;
    this.speed = GAME_CONFIG.PLAYER_SPEED;
    this.dx = 0;
    this.dy = 0;
    this.jumping = false;
    this.grounded = false;
    this.jumpsLeft = GAME_CONFIG.MAX_JUMPS;
    this.punching = false;
    this.punchTimer = 0;
    this.punchCooldown = 0;
    this.facing = 1;
    this.knockbackDx = 0;
    this.stocks = 3;
    this.projectileCooldown = 0;
    this.knockbackMultiplier = 1;
    
    // Charging properties
    this.charging = false;
    this.chargeTime = 0;
    this.chargeMultiplier = 1;
    
    // Projectile charging properties
    this.chargingProjectile = false;
    this.projectileChargeTime = 0;
    this.projectileChargeMultiplier = 1;
    
    // Animation properties
    this.animationFrame = 0;
    this.squishFactor = 1;
    this.stretchFactor = 1;
    this.floatOffset = 0;
  }

  move(leftPressed, rightPressed, canvas) {
    let moveDx = 0;
    if (leftPressed) {
      moveDx = -this.speed;
      this.facing = -1;
    } else if (rightPressed) {
      moveDx = this.speed;
      this.facing = 1;
    }
    
    this.dx = moveDx + this.knockbackDx;
    this.x += this.dx;
    
    // Boundary checking
    if (this.x < 0) this.x = 0;
    if (this.x + this.width > canvas.width) this.x = canvas.width - this.width;

    this.knockbackDx *= 0.8;
    if (Math.abs(this.knockbackDx) < 0.1) this.knockbackDx = 0;
  }

  jump() {
    if (this.jumpsLeft > 0) {
      this.dy = -GAME_CONFIG.JUMP_STRENGTH;
      this.jumping = true;
      this.grounded = false;
      this.jumpsLeft--;
      this.stretchFactor = 1.3; // Add jump stretch effect
    }
  }

  applyGravity(platform) {
    const wasGrounded = this.grounded;
    this.dy += GAME_CONFIG.GRAVITY;
    const nextY = this.y + this.dy;

    const onPlatform = (
      this.dy > 0 &&
      this.y + this.height <= platform.y &&
      nextY + this.height >= platform.y &&
      this.x + this.width > platform.x &&
      this.x < platform.x + platform.width
    );

    if (onPlatform) {
      this.dy = 0;
      this.y = platform.y - this.height;
      this.grounded = true;
      this.jumping = false;
      this.jumpsLeft = GAME_CONFIG.MAX_JUMPS;
      
      // Add landing squish effect if just landed
      if (!wasGrounded && this.dy > 8) {
        this.squishFactor = 0.7;
      } else if (!wasGrounded) {
        this.squishFactor = 0.85;
      }
    } else {
      this.grounded = false;
    }

    this.y += this.dy;
  }

  updateAnimation() {
    this.animationFrame++;
    
    // Handle stretch effect (jumping/rising)
    if (this.dy < 0 && !this.grounded) {
      this.stretchFactor = Math.max(this.stretchFactor - 0.02, 1.1);
    } else if (this.dy > 5 && !this.grounded) {
      this.stretchFactor = Math.min(this.stretchFactor + 0.03, 1.2);
    } else {
      if (this.stretchFactor > 1) {
        this.stretchFactor = Math.max(this.stretchFactor - 0.05, 1);
      } else if (this.stretchFactor < 1) {
        this.stretchFactor = Math.min(this.stretchFactor + 0.05, 1);
      }
    }
    
    // Handle squish effect (landing)
    if (this.grounded && this.squishFactor < 1) {
      this.squishFactor = Math.min(this.squishFactor + 0.08, 1);
    } else if (this.squishFactor > 1) {
      this.squishFactor = Math.max(this.squishFactor - 0.08, 1);
    }
    
    // Add subtle floating animation when airborne
    if (!this.grounded && Math.abs(this.dy) < 3) {
      const floatOffset = Math.sin(this.animationFrame * 0.2) * 2;
      this.floatOffset = floatOffset;
    } else {
      this.floatOffset = 0;
    }
  }

  checkFallOff(canvas, spawnX) {
    if (this.y > canvas.height) {
      if (this.stocks > 1) {
        this.stocks--;
        this.respawn(spawnX);
      } else {
        this.stocks = 0;
      }
      return true;
    }
    return false;
  }

  respawn(spawnX) {
    this.x = spawnX;
    this.y = 0; // Will be set properly by platform collision
    this.dy = 0;
    this.jumping = false;
    this.grounded = true;
    this.jumpsLeft = GAME_CONFIG.MAX_JUMPS;
    this.knockbackMultiplier = 1;
    this.squishFactor = 1;
    this.stretchFactor = 1;
    this.floatOffset = 0;
  }

  reset(spawnX, spawnY) {
    this.x = spawnX;
    this.y = spawnY;
    this.dx = 0;
    this.dy = 0;
    this.jumping = false;
    this.grounded = true;
    this.jumpsLeft = GAME_CONFIG.MAX_JUMPS;
    this.stocks = 3;
    this.knockbackMultiplier = 1;
    this.charging = false;
    this.chargeTime = 0;
    this.chargeMultiplier = 1;
    this.chargingProjectile = false;
    this.projectileChargeTime = 0;
    this.projectileChargeMultiplier = 1;
    this.animationFrame = 0;
    this.squishFactor = 1;
    this.stretchFactor = 1;
    this.floatOffset = 0;
  }
}