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

/**
 * Initialize keyboard event listeners
 */
export function initializeControls(player1, player2) {
    window.addEventListener('keydown', (e) => {
        if (e.key in keys) {
            keys[e.key] = true;
        }

        if (e.key === 'w' && player1.jumpsLeft > 0) {
            player1.dy = -player1.jumpStrength;
            player1.jumping = true;
            player1.grounded = false;
            player1.jumpsLeft--;
            player1.stretchFactor = 1.3;
            console.log('Player 1 jumped with strength:', player1.jumpStrength);
        }
        if (e.key === 'ArrowUp' && player2.jumpsLeft > 0) {
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
            keys[e.key] = false;
        }
    });
}

/**
 * Reset all key states to false
 */
export function resetKeyStates() {
    Object.keys(keys).forEach(key => {
        keys[key] = false;
    });
}