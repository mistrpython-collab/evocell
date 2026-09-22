// boot-scene.js - Scene untuk loading assets
export default class BootScene extends Phaser.Scene {
    constructor() {
        super('BootScene');
    }

    preload() {
        // Loading text
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        
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
        
        // Load assets - nanti sesuaikan dengan path yang benar
        // Untuk sementara kita load dulu tanpa gambar
        // Nanti setelah ada file gambar, uncomment baris berikut:
        
        // this.load.image('bgMain', 'assets/images/ui/background.png');
        // this.load.image('logo', 'assets/images/ui/logo.png');
        // this.load.image('prokaryotic', 'assets/images/characters/prokaryotic.png');
    }

    create() {
        // Transition ke Menu Scene
        this.scene.start('MenuScene');
    }
}
