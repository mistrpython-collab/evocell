// js/main.js
import config from './config.js';
import { fullscreenManager } from './utils/fullscreen.js'; // Import fullscreen manager

console.log('Starting EvoCell game...');
console.log('Fullscreen supported:', fullscreenManager.supportsFullscreen);

// Inisialisasi Game Phaser
const game = new Phaser.Game(config);