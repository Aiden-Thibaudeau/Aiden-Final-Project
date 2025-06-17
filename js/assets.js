import { colorNames } from './constants.js';

let imagesLoaded = 0;
const totalImages = 11;
let allImagesLoaded = false;

export const backgroundImage = new Image();
export const player1Images = {};
export const player2Images = {};

/**
 * Loads all game images including background and player sprites
 */
export function loadImages() {
    console.log('Loading images...');
    backgroundImage.onload = () => {
        imagesLoaded++;
        checkAllImagesLoaded();
    };
    backgroundImage.onerror = () => {
        console.error('Failed to load background image');
        imagesLoaded++;
        checkAllImagesLoaded();
    };

    // Load all player 1 images
    Object.entries(colorNames).forEach(([colorCode, colorName]) => {
        const img = new Image();
        img.onload = () => {
            imagesLoaded++;
            checkAllImagesLoaded();
        };
        img.onerror = () => {
            console.error(`Failed to load player1${colorName}.png`);
            imagesLoaded++;
            checkAllImagesLoaded();
        };        img.src = `assets/Player1${colorName}.png`;
        player1Images[colorCode] = img;
    });

    // Load all player 2 images
    Object.entries(colorNames).forEach(([colorCode, colorName]) => {
        const img = new Image();
        img.onload = () => {
            imagesLoaded++;
            checkAllImagesLoaded();
        };
        img.onerror = () => {
            console.error(`Failed to load Player2${colorName}.png`);
            imagesLoaded++;
            checkAllImagesLoaded();
        };
        img.src = `assets/Player2${colorName}.png`;
        player2Images[colorCode] = img;
    });

    backgroundImage.src = 'assets/Background.jpg';
}

/**
 * Checks if all images have finished loading
 */
function checkAllImagesLoaded() {
    if (imagesLoaded >= totalImages) {
        allImagesLoaded = true;
        console.log('All images loaded successfully');
    }
}

/**
 * Gets the appropriate player image based on the player object
 */
export function getPlayerImage(player, player1, player2) {
    if (player === player1) {
        return player1Images[player.color] || null;
    } else if (player === player2) {
        return player2Images[player.color] || null;
    }
    return null;
}