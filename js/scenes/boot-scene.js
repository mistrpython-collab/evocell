// boot-scene.js - Scene untuk loading semua assets game
export default class BootScene extends Phaser.Scene {
    constructor() {
        super('BootScene');
    }

    preload() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        
        // Loading text
        const loadingText = this.add.text(width/2, height/2 - 50, 'Loading EvoCell...', {
            font: '28px Arial',
            fill: '#00ffff',
            stroke: '#000000',
            strokeThickness: 4
        });
        loadingText.setOrigin(0.5);
        
        // Progress bar background
        const progressBox = this.add.graphics();
        progressBox.fillStyle(0x222222, 0.8);
        progressBox.fillRect(width/2 - 160, height/2 - 10, 320, 50);
        
        // Progress bar
        const progressBar = this.add.graphics();
        
        // Update progress
        this.load.on('progress', (value) => {
            progressBar.clear();
            progressBar.fillStyle(0x00ff00, 1);
            progressBar.fillRect(width/2 - 150, height/2, 300 * value, 30);
        });
        
        // === LOAD SEMUA GAMBAR ===
        
        // Background & UI Menu
        this.load.image('bgMain', 'assets/images/main-menu-evocell/main-menu-evocell.png');
        this.load.image('logo', 'assets/images/main-menu-evocell/main-title-evocell.png');
        this.load.image('earth', 'assets/images/main-menu-evocell/earth.png');
        
        // Buttons
        this.load.image('btnCampaign', 'assets/images/main-menu-evocell/campaign-btn.png');
        this.load.image('btnBack', 'assets/images/main-menu-evocell/back-btn.png');
        this.load.image('btnSettings', 'assets/images/main-menu-evocell/gear-setting.png');
        
        // Characters (3 role)
        this.load.image('prokaryotic', 'assets/images/cell-prokaryotic/prokaryotic-cell.png');
        this.load.image('virus', 'assets/images/virus/virus.png');
        this.load.image('wbc', 'assets/images/white-blood-cell/white-blood-cell.png');
        
        // Bacteria (untuk gameplay nanti)
        this.load.image('bacteria', 'assets/images/bacteria/bacteria-green.png');
    }

    create() {
        // Setelah loading selesai, langsung ke Intro Scene
        this.scene.start('IntroScene');
    }
}