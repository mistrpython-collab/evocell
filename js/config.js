// config.js - Konfigurasi game Phaser
import BootScene from './scenes/boot-scene.js';
import IntroScene from './scenes/intro-scene.js';
import MenuScene from './scenes/menu-scene.js';

const config = {
    type: Phaser.AUTO,
    width: 1280,
    height: 720,
    backgroundColor: '#000000',
    parent: 'game-container',
    scene: [
        BootScene,
        IntroScene,
        MenuScene
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

export default config;