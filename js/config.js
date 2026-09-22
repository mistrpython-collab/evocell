// config.js - Konfigurasi game Phaser
import BootScene from './scenes/boot-scene.js';
import MenuScene from './scenes/menu-scene.js';
import RoleSelectScene from './scenes/role-select-scene.js';
import ModeSelectScene from './scenes/mode-select-scene.js';

const config = {
    type: Phaser.AUTO,
    width: 1280,
    height: 720,
    backgroundColor: '#000000',
    parent: 'game-container',
    scene: [
        BootScene,
        MenuScene,
        RoleSelectScene,
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

export default config;
