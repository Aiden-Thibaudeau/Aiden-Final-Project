// Map of key states
export const keys = {
    'ArrowLeft': false,
    'ArrowRight': false,
    'ArrowUp': false,
    'a': false,
    'd': false,
    'w': false,
    'r': false,
    'k': false,
    't': false,
    'l': false
};

import { restartGame } from './main.js';
import { isBot } from './ui.js';

// Track restart button coordinates
let restartButtonBounds = null;

// List of Player 2's keys
const player2Keys = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'k', 'l'];

/**
 * Initialize keyboard event listeners
 */
export function initializeControls(player1, player2) {
    window.addEventListener('keydown', (e) => {
        if (e.key in keys) {
            // Only allow player 2 keys if not in bot mode
            if (!isBot || !player2Keys.includes(e.key)) {
                keys[e.key] = true;
            }
        }

        // Handle Player 1 jumping
        if (e.key === 'w' && player1.jumpsLeft > 0) {
            player1.dy = -player1.jumpStrength;
            player1.jumping = true;
            player1.grounded = false;
            player1.jumpsLeft--;
            player1.stretchFactor = 1.3;
            console.log('Player 1 jumped with strength:', player1.jumpStrength);
        }
        
        // Only allow player 2 jumping if not in bot mode
        if (e.key === 'ArrowUp' && !isBot && player2.jumpsLeft > 0) {
            player2.dy = -player2.jumpStrength;
            player2.jumping = true;
            player2.grounded = false;
            player2.jumpsLeft--;
            player2.stretchFactor = 1.3;
            console.log('Player 2 jumped with strength:', player2.jumpStrength);
        }
    });

    window.addEventListener('keyup', (e) => {
        if (e.key in keys) {
            // Only allow player 2 keys if not in bot mode
            if (!isBot || !player2Keys.includes(e.key)) {
                keys[e.key] = false;
            }
        }
    });

    // Add canvas click handler for restart button
    document.getElementById('gameCanvas').addEventListener('click', (e) => {
        const rect = e.target.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        if (isInsideButton(x, y)) {
            restartGame();
        }
    });
}

/**
 * Function to make bot jump - called directly from bot logic
 */
export function makeBotJump(bot) {
    if (bot.jumpsLeft > 0) {
        bot.dy = -bot.jumpStrength;
        bot.jumping = true;
        bot.grounded = false;
        bot.jumpsLeft--;
        bot.stretchFactor = 1.3;
        console.log('Bot jumped with strength:', bot.jumpStrength);
    }
}

/**
 * Reset all key states to false
 */
export function resetKeyStates() {
    for (let key in keys) {
        // When resetting, respect bot mode for Player 2 controls
        if (!isBot || !player2Keys.includes(key)) {
            keys[key] = false;
        }
    }
}

// Check if a point is inside the restart button
function isInsideButton(x, y) {
    if (!restartButtonBounds) return false;
    return (
        x >= restartButtonBounds.buttonX &&
        x <= restartButtonBounds.buttonX + restartButtonBounds.buttonWidth &&
        y >= restartButtonBounds.buttonY &&
        y <= restartButtonBounds.buttonY + restartButtonBounds.buttonHeight
    );
}

export function setRestartButtonBounds(bounds) {
    restartButtonBounds = bounds;
}