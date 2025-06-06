import { characterStats, stageLayouts } from './constants.js';

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
    gameUI: document.getElementById('gameUI'),
    stageOptions: document.querySelectorAll('.stage-option')
};

// Player colors and their corresponding image names
const colorToImageMap = {
    '#FF6347': 'red',      // Red
    '#4682B4': 'blue',     // Blue
    '#32CD32': 'green',    // Green
    '#FFD700': 'yellow',   // Yellow
    '#8A2BE2': 'purple'    // Purple
};

// Player colors and stage selection
export let player1SelectedColor = '#FF6347';
export let player2SelectedColor = '#4682B4';
export let selectedStage = 'classic';

/**
 * Set up color selection for a player
 */
export function setupColorSelection(playerColorOptions, playerPreview, playerNumber) {
    // Clear existing content and set up as character grid
    playerColorOptions.innerHTML = '';
    playerColorOptions.className = 'character-grid';
    
    Object.keys(colorToImageMap).forEach(color => {
        const characterOption = document.createElement('div');
        characterOption.className = 'character-option';
        characterOption.dataset.color = color;
        
        // Create character image
        const characterImg = document.createElement('img');
        const imageName = colorToImageMap[color];
        characterImg.src = `assets/player${playerNumber}${imageName}.png`;
        characterImg.alt = `Player ${playerNumber} ${imageName}`;
        characterImg.className = 'character-image';
        
        // Create character name
        const characterName = document.createElement('div');
        characterName.className = 'character-name';
        characterName.textContent = getCharacterName(color);
        
        characterOption.appendChild(characterImg);
        characterOption.appendChild(characterName);
        
        // Set initial selection
        if ((playerNumber === 1 && color === player1SelectedColor) || 
            (playerNumber === 2 && color === player2SelectedColor)) {
            characterOption.classList.add('selected');
            updatePreview(color, playerNumber);
            updateStatsDisplay(color, playerNumber);
        }

        // Add click handler
        characterOption.addEventListener('click', () => {
            playerColorOptions.querySelectorAll('.character-option').forEach(opt => {
                opt.classList.remove('selected');
            });
            characterOption.classList.add('selected');

            if (playerNumber === 1) {
                player1SelectedColor = color;
            } else {
                player2SelectedColor = color;
            }
            
            updatePreview(color, playerNumber);
            updateStatsDisplay(color, playerNumber);
            
            // Add selection sound effect (you can add this)
            playSelectionSound();
        });

        // Add hover effects
        characterOption.addEventListener('mouseenter', () => {
            if (!characterOption.classList.contains('selected')) {
                characterOption.classList.add('hover');
            }
        });

        characterOption.addEventListener('mouseleave', () => {
            characterOption.classList.remove('hover');
        });

        playerColorOptions.appendChild(characterOption);
    });
}

function updatePreview(color, playerNumber) {
    const preview = document.getElementById(`player${playerNumber}Preview`);
    const imageName = colorToImageMap[color];
    
    // Clear existing content
    preview.innerHTML = '';
    
    // Create preview image
    const previewImg = document.createElement('img');
    previewImg.src = `assets/player${playerNumber}${imageName}.png`;
    previewImg.alt = `Player ${playerNumber} Preview`;
    previewImg.className = 'preview-image';
    
    // Create character title
    const title = document.createElement('div');
    title.className = 'preview-title';
    title.textContent = `Player ${playerNumber}`;
    
    // Create character name
    const name = document.createElement('div');
    name.className = 'preview-character-name';
    name.textContent = getCharacterName(color);
    
    preview.appendChild(title);
    preview.appendChild(previewImg);
    preview.appendChild(name);
}

function getCharacterName(color) {
    const characterNames = {
        '#FF6347': 'Balanced Fighter',    // Red
        '#4682B4': 'Heavy Tank',          // Blue
        '#32CD32': 'Speed Demon',         // Green
        '#FFD700': 'Sniper',             // Yellow
        '#8A2BE2': 'Tech Master'         // Purple
    };
    return characterNames[color] || 'Unknown';
}

function updateStatsDisplay(color, playerNumber) {
    const stats = characterStats[color];
    if (!stats) return;

    let container = document.getElementById(`player${playerNumber}Stats`);
    if (!container) {
        // Create stats container if it doesn't exist
        const preview = document.getElementById(`player${playerNumber}Preview`);
        const statsDiv = document.createElement('div');
        statsDiv.id = `player${playerNumber}Stats`;
        statsDiv.className = 'stats-container';
        preview.parentNode.appendChild(statsDiv);
        container = statsDiv;
    }

    const characterName = getCharacterName(color);

    container.innerHTML = `
        <div class="stats-header">Character Stats</div>
        <div class="stat-row">
            <span class="stat-label">Speed:</span>
            <div class="stat-bar">
                ${getStatBar(stats.speed, 7, 13)}
                <span class="stat-value">${stats.speed}</span>
            </div>
        </div>
        <div class="stat-row">
            <span class="stat-label">Projectile Power:</span>
            <div class="stat-bar">
                ${getStatBar(stats.projectilePower, 0.7, 1.5)}
                <span class="stat-value">${stats.projectilePower.toFixed(1)}</span>
            </div>
        </div>
        <div class="stat-row">
            <span class="stat-label">Punch Power:</span>
            <div class="stat-bar">
                ${getStatBar(stats.punchPower, 0.7, 2.0)}
                <span class="stat-value">${stats.punchPower.toFixed(1)}</span>
            </div>
        </div>
        <div class="stat-row">
            <span class="stat-label">Max Jumps:</span>
            <div class="stat-bar">
                <span class="jump-count">${'⬆'.repeat(stats.maxJumps)}</span>
                <span class="stat-value">${stats.maxJumps}</span>
            </div>
        </div>
    `;
}

function getStatBar(value, min, max) {
    const normalized = Math.max(0, Math.min(1, (value - min) / (max - min))); // Clamp to 0-1
    const bars = 5;
    const filledBars = Math.round(normalized * bars);
    
    let result = '<div class="stat-bars">';
    for (let i = 0; i < bars; i++) {
        if (i < filledBars) {
            result += '<span class="stat-bar-filled">■</span>';
        } else {
            result += '<span class="stat-bar-empty">□</span>';
        }
    }
    result += '</div>';
    return result;
}

function playSelectionSound() {
    // Placeholder for selection sound - you can implement this
    // const audio = new Audio('assets/select.wav');
    // audio.play().catch(() => {}); // Ignore errors if audio fails
}

/**
 * Update the stock (lives) display for a player
 */
export function updateStockDisplay(player, isPlayer1) {
    const containerId = isPlayer1 ? 'player1Stock' : 'player2Stock';
    const stockContainer = document.getElementById(containerId);

    stockContainer.innerHTML = '';
    for (let i = 0; i < player.stocks; i++) {
        const heart = document.createElement('img');
        heart.src = 'assets/hearts.png';
        heart.alt = 'Heart';
        heart.className = 'stock-heart';
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
    setupStageSelection();

    elements.canvas.width = window.innerWidth;
    elements.canvas.height = window.innerHeight;
    
    // Initially hide game UI and show character select
    elements.characterSelectScreen.style.display = 'flex';
    elements.gameUI.style.display = 'none';
    elements.restartBtn.style.display = 'none';
    
    // Add background animation
    animateBackground();
}

/**
 * Set up stage selection
 */
function setupStageSelection() {
    // Draw initial previews
    elements.stageOptions.forEach(option => {
        const canvas = option.querySelector('.stage-preview');
        const stageName = option.dataset.stage;
        if (canvas && stageName) {
            drawStagePreview(canvas, stageName);
        }
    });

    // Set up click handlers
    elements.stageOptions.forEach(option => {
        option.addEventListener('click', () => {
            // Remove selected class from all options
            elements.stageOptions.forEach(opt => opt.classList.remove('selected'));
            // Add selected class to clicked option
            option.classList.add('selected');
            // Update selected stage
            selectedStage = option.dataset.stage;
            console.log('Selected stage:', selectedStage);
        });
    });
}

/**
 * Add animated background to character select
 */
function animateBackground() {
    const canvas = elements.canvas;
    if (!canvas) return; // Guard against canvas not being ready
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return; // Guard against context not being available
    
    // Create floating particles for background
    const particles = [];
    for (let i = 0; i < 50; i++) {
        particles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            size: Math.random() * 3 + 1,
            speedX: (Math.random() - 0.5) * 2,
            speedY: (Math.random() - 0.5) * 2,
            opacity: Math.random() * 0.5 + 0.2
        });
    }
    
    function updateParticles() {
        if (!canvas || !ctx || elements.characterSelectScreen.style.display === 'none') return;
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw gradient background
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, '#1a1a2e');
        gradient.addColorStop(0.5, '#16213e');
        gradient.addColorStop(1, '#0f1419');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Update and draw particles
        particles.forEach(particle => {
            particle.x += particle.speedX;
            particle.y += particle.speedY;
            
            // Wrap around screen
            if (particle.x < 0) particle.x = canvas.width;
            if (particle.x > canvas.width) particle.x = 0;
            if (particle.y < 0) particle.y = canvas.height;
            if (particle.y > canvas.height) particle.y = 0;
            
            // Draw particle
            ctx.save();
            ctx.globalAlpha = particle.opacity;
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        });
        
        requestAnimationFrame(updateParticles);
    }
    
    updateParticles();
}

/**
 * Draw platforms preview for a stage
 */
function drawStagePreview(canvas, stageName) {
    const ctx = canvas.getContext('2d');
    const layout = stageLayouts[stageName];
    const width = canvas.width;
    const height = canvas.height;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Draw background gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, '#1a1a2e');
    gradient.addColorStop(0.5, '#16213e');
    gradient.addColorStop(1, '#0f1419');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Add subtle grid effect
    ctx.strokeStyle = 'rgba(74, 74, 138, 0.1)';
    ctx.lineWidth = 0.5;
    for (let i = 0; i < width; i += 10) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, height);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(width, i);
        ctx.stroke();
    }
    
    // Draw platforms with glow effect
    layout.platforms.forEach(platform => {
        const x = platform.x * width;
        const y = platform.y * height;
        const w = platform.width * width;
        const h = platform.height * (height / 5); // Scale height for preview
        
        // Platform glow
        ctx.shadowColor = '#8470FF';
        ctx.shadowBlur = 10;
        
        // Platform gradient
        const platformGradient = ctx.createLinearGradient(0, y, 0, y + h);
        platformGradient.addColorStop(0, '#4A4A8A');
        platformGradient.addColorStop(0.7, '#2E2E5E');
        platformGradient.addColorStop(1, '#1A1A2E');
        
        ctx.fillStyle = platformGradient;
        ctx.fillRect(x, y, w, h);
        
        // Platform border
        ctx.shadowBlur = 0;
        ctx.strokeStyle = '#8470FF';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, w, h);
    });
    
    // Draw spawn points with glow effect
    const player1Spawn = layout.spawns.player1;
    const player2Spawn = layout.spawns.player2;
    
    // Helper function for drawing spawn points
    const drawSpawnPoint = (x, y, color) => {
        ctx.shadowColor = color;
        ctx.shadowBlur = 8;
        ctx.fillStyle = color;
        
        // Draw main circle
        ctx.beginPath();
        ctx.arc(x * width, y * height, 3, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw outer ring
        ctx.strokeStyle = color;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(x * width, y * height, 5, 0, Math.PI * 2);
        ctx.stroke();
    };
    
    // Draw spawn points
    drawSpawnPoint(player1Spawn.x, player1Spawn.y, '#FF6347'); // Player 1 (red)
    drawSpawnPoint(player2Spawn.x, player2Spawn.y, '#4682B4'); // Player 2 (blue)
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

/**
 * Get the canvas rendering context
 * @returns {CanvasRenderingContext2D}
 */
export function getContext() {
    const canvas = elements.canvas;
    return canvas ? canvas.getContext('2d') : null;
}