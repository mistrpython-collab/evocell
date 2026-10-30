// js/main.js
import config from './config.js';
import { fullscreenManager } from './utils/fullscreen.js';
import { orientationChecker } from './utils/orientation.js';

console.log('Starting EvoCell game...');
console.log('Fullscreen supported:', fullscreenManager.supportsFullscreen);

// Error handling untuk game
window.addEventListener('error', (e) => {
    console.error('Game Error:', e.error);
});

// Cek apakah Phaser sudah load
if (typeof Phaser === 'undefined') {
    console.error('Phaser not loaded! Check your internet connection or ad blocker.');
    const errorMsg = document.getElementById('error-message');
    if (errorMsg) {
        errorMsg.style.display = 'block';
        errorMsg.innerHTML = '<strong>Phaser failed to load!</strong><br>' +
            'Please disable ad blocker and refresh.';
    }
} else {
    // Mulai monitoring orientasi
    orientationChecker.startMonitoring();

    // Inisialisasi Game Phaser
    const game = new Phaser.Game(config);
    
    // Log saat game ready
    game.events.once('ready', () => {
        console.log('EvoCell game ready!');
        
        // Hide loading screen
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            loadingScreen.style.display = 'none';
        }
    });
}