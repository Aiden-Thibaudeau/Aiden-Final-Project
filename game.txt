import { GAME_CONFIG } from './constants.js';
import { Player } from './player.js';
import { CombatSystem } from './combat.js';
import { Renderer } from './renderer.js';
import { InputHandler } from './input.js';
import { UIManager } from './ui.js';

export class Game {
  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');
    this.gameOver = false;
    
    // Set canvas size
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    
    // Create platform
    this.platform = {
      x: this.canvas.width / 4,
      y: this.canvas.height / 2,
      width: this.canvas.width / 2,
      height: 100,
    };
    
    // Initialize systems
    this.inputHandler = new InputHandler();
    this.combatSystem = new CombatSystem();
    this.renderer = new Renderer(this.canvas, this.ctx);
    this.uiManager = new UIManager();
    
    // Create players
    this.player1 = new Player(
      this.platform.x + this.platform.width / 7,
      this.platform.y - 50
    );
    this.player2 = new Player(
      this.platform.x + this.platform.width - 100,
      this.platform.y - 50
    );
    
    // Initialize UI
    this.uiManager.updateStockDisplay(this.player1, 'player1');
    this.uiManager.updateStockDisplay(this.player2, 'player2');
    
    // Setup restart button
    this.uiManager.onRestartClick(() => this.restart());
    
    // Start game loop
    this.gameLoop();
  }

  update() {
    if (this.gameOver) return;

    const p1Input = this.inputHandler.getPlayer1Input();
    const p2Input = this.inputHandler.getPlayer2Input();
    
    // Handle jumping
    if (p1Input.jump) this.player1.jump();
    if (p2Input.jump) this.player2.jump();
    
    // Move players
    this.player1.move(p1Input.left, p1Input.right, this.canvas);
    this.player2.move(p2Input.left, p2Input.right, this.canvas);
    
    // Apply physics
    this.player1.applyGravity(this.platform);
    this.player2.applyGravity(this.platform);
    
    // Update animations
    this.player1.updateAnimation();
    this.player2.updateAnimation();
    
    // Apply friction
    this.player1.dx *= 0.95;
    this.player2.dx *= 0.95;
    
    // Check for falling off
    if (this.player1.checkFallOff(this.canvas, this.platform.x + this.platform.width / 7)) {
      this.uiManager.updateStockDisplay(this.player1, 'player1');
    }
    if (this.player2.checkFallOff(this.canvas, this.platform.x + this.platform.width - 100)) {
      this.uiManager.updateStockDisplay(this.player2, 'player2');
    }
    
    // Handle combat
    this.combatSystem.handlePunching(this.player1, this.player2, p1Input.punch);
    this.combatSystem.handlePunching(this.player2, this.player1, p2Input.punch);
    
    this.combatSystem.handleProjectile(this.player1, p1Input.projectile);
    this.combatSystem.handleProjectile(this.player2, p2Input.projectile);
    
    this.combatSystem.updateProjectiles(this.player1, this.player2, this.canvas);
    
    // Check for game over
    if (this.player1.stocks <= 0 || this.player2.stocks <= 0) {
      this.gameOver = true;
      this.uiManager.showRestartButton();
    }
  }

  render() {
    this.renderer.clearScreen();
    this.renderer.drawPlatform(this.platform);
    
    this.renderer.drawPlayer(this.player1, GAME_CONFIG.PLAYER1_COLOR, this.platform);
    this.renderer.drawPlayer(this.player2, GAME_CONFIG.PLAYER2_COLOR, this.platform);
    
    this.renderer.drawPunch(this.player1, GAME_CONFIG.PUNCH_COLOR_P1);
    this.renderer.drawPunch(this.player2, GAME_CONFIG.PUNCH_COLOR_P2);
    
    this.renderer.drawProjectileCharging(this.player1);
    this.renderer.drawProjectileCharging(this.player2);
    
    this.renderer.drawProjectiles(this.combatSystem.projectiles);
    
    // Update UI displays
    this.uiManager.updatePercentDisplay(this.player1, 'player1');
    this.uiManager.updatePercentDisplay(this.player2, 'player2');
    
    if (this.gameOver) {
      const winner = this.player1.stocks <= 0 ? 'player2' : 'player1';
      this.renderer.drawWinnerText(winner);
    }
  }

  gameLoop() {
    this.update();
    this.render();
    
    if (!this.gameOver) {
      requestAnimationFrame(() => this.gameLoop());
    }
  }

  restart() {
    this.gameOver = false;
    this.uiManager.hideRestartButton();
    
    // Reset players
    this.player1.reset(
      this.platform.x + this.platform.width / 7,
      this.platform.y - this.player1.height
    );
    this.player2.reset(
      this.platform.x + this.platform.width - 100,
      this.platform.y - this.player2.height
    );
    
    // Reset systems
    this.combatSystem.reset();
    this.inputHandler.reset();
    
    // Update UI
    this.uiManager.updateStockDisplay(this.player1, 'player1');
    this.uiManager.updateStockDisplay(this.player2, 'player2');
    
    // Restart game loop
    this.gameLoop();
  }
}