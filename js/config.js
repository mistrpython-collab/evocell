// config.js - Konfigurasi game Phaser
import BootScene from './scenes/boot-scene.js';
import MenuScene from './scenes/menu-scene.js';
import ModeSelectScene from './scenes/mode-select-scene.js';

console.log('Loading config...');

const config = {
    type: Phaser.AUTO,
    width: 1280,
    height: 720,
    backgroundColor: '#0a0a0a', // Background gelap
    parent: 'game-container',
    scene: [
        BootScene,
        MenuScene,        // Langsung ke MenuScene (IntroScene dihapus)
        ModeSelectScene
    ],
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    }
};

console.log('Config loaded');

export default config;