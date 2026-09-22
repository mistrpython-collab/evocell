// menu-scene.js - Main menu scene
export default class MenuScene extends Phaser.Scene {
    constructor() {
        super('MenuScene');
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        
        // Background (warna sementara, nanti ganti dengan gambar)
        this.add.rectangle(width/2, height/2, width, height, 0x0a0a0a);
        
        // Judul game
        const title = this.add.text(width/2, height/3, 'EvoCell', {
            font: '72px Arial',
            fill: '#00ffff',
            stroke: '#00ff00',
            strokeThickness: 6
        });
        title.setOrigin(0.5);
        
        // Animasi pulse untuk judul
        this.tweens.add({
            targets: title,
            scaleX: 1.05,
            scaleY: 1.05,
            duration: 1500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
        
        // Subtitle
        this.add.text(width/2, height/2 - 50, 'Survival Microscopic Game', {
            font: '24px Arial',
            fill: '#aaaaaa'
        }).setOrigin(0.5);
        
        // Play button
        const playButton = this.add.text(width/2, height/2 + 50, 'PLAY GAME', {
            font: '32px Arial',
            fill: '#ffffff',
            backgroundColor: '#00aa00',
            padding: { x: 30, y: 15 }
        });
        playButton.setOrigin(0.5);
        playButton.setInteractive({ useHandCursor: true });
        
        // Hover effect
        playButton.on('pointerover', () => {
            playButton.setStyle({ backgroundColor: '#00ff00' });
            playButton.setScale(1.1);
        });
        
        playButton.on('pointerout', () => {
            playButton.setStyle({ backgroundColor: '#00aa00' });
            playButton.setScale(1);
        });
        
        // Click event
        playButton.on('pointerdown', () => {
            this.scene.transition({
                target: 'RoleSelectScene',
                duration: 500
            });
        });
        
        // Footer text
        this.add.text(width/2, height - 50, 'v1.0.0 - EvoCell Project', {
            font: '14px Arial',
            fill: '#666666'
        }).setOrigin(0.5);
    }
}
