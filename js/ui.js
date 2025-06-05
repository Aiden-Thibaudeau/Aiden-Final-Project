import { characterStats } from './constants.js';

/**
 * DOM elements
 */
export const elements = {
    canvas: document.getElementById('gameCanvas'),
    characterSelectScreen: document.getElementById('characterSelectScreen'),
    player1ColorOptions: document.getElementById('player1ColorOptions'),
    player2ColorOptions: document.getElementById('player2ColorOptions'),
    player1Preview: document.getElementById('player1Preview'),
    player2Preview: document.getElementById('player2Preview'),
    startGameBtn: document.getElementById('startGameBtn'),
    restartBtn: document.getElementById('restartBtn'),
    gameUI: document.getElementById('gameUI')
};

export const ctx = elements.canvas.getContext('2d');

// Player colors
export let player1SelectedColor = '#FF6347';
export let player2SelectedColor = '#4682B4';

/**
 * Set up color selection for a player
 */
export function setupColorSelection(playerColorOptions, playerPreview, playerNumber) {
    playerColorOptions.querySelectorAll('.color-box').forEach(box => {
        const color = box.dataset.color;
        box.style.backgroundColor = color;

        if ((playerNumber === 1 && color === player1SelectedColor) || 
            (playerNumber === 2 && color === player2SelectedColor)) {
            box.classList.add('selected');
            updateStatsDisplay(color, playerNumber);
        }

        box.addEventListener('click', () => {
            playerColorOptions.querySelectorAll('.color-box').forEach(b => b.classList.remove('selected'));
            box.classList.add('selected');

            if (playerNumber === 1) {
                player1SelectedColor = color;
                player1Preview.style.backgroundColor = color;
                console.log('Player 1 selected color:', color);
                updateStatsDisplay(color, 1);
            } else {
                player2SelectedColor = color;
                player2Preview.style.backgroundColor = color;
                console.log('Player 2 selected color:', color);
                updateStatsDisplay(color, 2);
            }
        });
    });
}

function updateStatsDisplay(color, playerNumber) {
    const stats = characterStats[color];
    if (!stats) return;

    const container = document.getElementById(`player${playerNumber}Stats`);
    if (!container) {
        // Create stats container if it doesn't exist
        const preview = document.getElementById(`player${playerNumber}Preview`);
        const statsDiv = document.createElement('div');
        statsDiv.id = `player${playerNumber}Stats`;
        statsDiv.style.color = 'white';
        statsDiv.style.marginTop = '10px';
        statsDiv.style.fontSize = '14px';
        statsDiv.style.textAlign = 'left';
        preview.parentNode.insertBefore(statsDiv, preview.nextSibling);
    }

    // Update stats display
    const statsContainer = document.getElementById(`player${playerNumber}Stats`);
    statsContainer.innerHTML = `
        <div style="margin: 5px 0;">
            <strong>Speed:</strong> ${getStatBar(stats.speed, 6, 10)}
        </div>
        <div style="margin: 5px 0;">
            <strong>Power:</strong> ${getStatBar(stats.punchPower, 0.8, 1.5)}
        </div>
        <div style="margin: 5px 0;">
            <strong>Weight:</strong> ${getStatBar(stats.weight, 0.8, 1.3)}
        </div>
        <div style="margin: 5px 0;">
            <strong>Jumps:</strong> ${stats.maxJumps}
        </div>
    `;
}

function getStatBar(value, min, max) {
    const normalized = (value - min) / (max - min); // Convert to 0-1 range
    const bars = 5;
    const filledBars = Math.round(normalized * bars);
    
    let result = '';
    for (let i = 0; i < bars; i++) {
        if (i < filledBars) {
            result += '■';
        } else {
            result += '□';
        }
    }
    return result;
}

/**
 * Update the stock (lives) display for a player
 */
export function updateStockDisplay(player, isPlayer1) {
    const containerId = isPlayer1 ? 'player1Stock' : 'player2Stock';
    const stockContainer = document.getElementById(containerId);

    stockContainer.innerHTML = '';
    for (let i = 0; i < player.stocks; i++) {        const heart = document.createElement('img');
        heart.src = 'assets/hearts.png';
        heart.alt = 'Heart';
        stockContainer.appendChild(heart);
    }
}

/**
 * Update the damage percentage display for a player
 */
export function updatePercentDisplay(player, isPlayer1) {
    const percentId = isPlayer1 ? 'player1Percent' : 'player2Percent';
    const percentContainer = document.getElementById(percentId);

    percentContainer.textContent = `${Math.round((player.knockbackMultiplier - 1) * 10)}%`;
}

/**
 * Initialize the UI
 */
export function initializeUI() {
    setupColorSelection(elements.player1ColorOptions, elements.player1Preview, 1);
    setupColorSelection(elements.player2ColorOptions, elements.player2Preview, 2);

    elements.canvas.width = window.innerWidth;
    elements.canvas.height = window.innerHeight;
    
    // Initially hide game UI and show character select
    elements.characterSelectScreen.style.display = 'flex';
    elements.gameUI.style.display = 'none';
    elements.restartBtn.style.display = 'none';
}

/**
 * Show game UI and hide character select
 */
export function showGameUI() {
    elements.characterSelectScreen.style.display = 'none';
    elements.gameUI.style.display = 'block';
}

/**
 * Show/hide restart button
 */
export function toggleRestartButton(show) {
    elements.restartBtn.style.display = show ? 'block' : 'none';
}