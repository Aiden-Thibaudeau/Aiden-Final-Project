import { CONTROLS } from './constants.js';

export class InputHandler {
  constructor() {
    this.keys = {
      '4': false,
      '6': false,
      '8': false,
      'a': false,
      'd': false,
      'w': false,
      'q': false,
      '7': false,
      'e': false,
      '9': false,
    };

    this.setupEventListeners();
  }

  setupEventListeners() {
    window.addEventListener('keydown', (e) => {
      if (e.key in this.keys) {
        this.keys[e.key] = true;
      }
    });

    window.addEventListener('keyup', (e) => {
      if (e.key in this.keys) {
        this.keys[e.key] = false;
      }
    });
  }

  isPressed(key) {
    return this.keys[key] || false;
  }

  getPlayer1Input() {
    return {
      left: this.isPressed(CONTROLS.PLAYER1.LEFT),
      right: this.isPressed(CONTROLS.PLAYER1.RIGHT),
      jump: this.isPressed(CONTROLS.PLAYER1.JUMP),
      punch: this.isPressed(CONTROLS.PLAYER1.PUNCH),
      projectile: this.isPressed(CONTROLS.PLAYER1.PROJECTILE)
    };
  }

  getPlayer2Input() {
    return {
      left: this.isPressed(CONTROLS.PLAYER2.LEFT),
      right: this.isPressed(CONTROLS.PLAYER2.RIGHT),
      jump: this.isPressed(CONTROLS.PLAYER2.JUMP),
      punch: this.isPressed(CONTROLS.PLAYER2.PUNCH),
      projectile: this.isPressed(CONTROLS.PLAYER2.PROJECTILE)
    };
  }

  reset() {
    for (const key in this.keys) {
      this.keys[key] = false;
    }
  }
}