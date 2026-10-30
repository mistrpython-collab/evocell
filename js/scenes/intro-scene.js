// intro-scene.js - Pakai logo dengan virus & bakteri
import { fullscreenManager } from '../utils/fullscreen.js'; // ✅ Import fullscreen

export default class IntroScene extends Phaser.Scene {

    constructor() {
        super('IntroScene');
        this.fullscreenBtn = null; // ✅ Variabel untuk tombol fullscreen
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // Background hitam
        this.add.rectangle(width/2, height/2, width, height, 0x000000);

        // Earth di tengah
        const earth = this.add.image(width/2, height/2, 'earth');
        earth.setScale(0.5);

        // LOGO INTRO (ada virus & bakteri di sekeliling)
        const logo = this.add.image(width/2, height/2, 'introLogo');
        logo.setScale(0.85);
        logo.setAlpha(0);

        // Animasi logo fade in
        this.tweens.add({
            targets: logo,
            alpha: 1,
            duration: 1500,
            ease: 'Power2'
        });

        // Animasi Earth zoom in
        this.tweens.add({
            targets: earth,
            scale: 0.95,
            duration: 6000,
            ease: 'Sine.easeInOut'
        });

        // Setelah 6 detik, pindah ke MenuScene
        this.time.delayedCall(6000, () => {
            this.scene.start('MenuScene');
        });

        // ✅ TAMBAHKAN TOMBOL FULLSCREEN (Kanan Atas)
        this.createFullscreenButton(width, height);
    }

    // ✅ Fungsi membuat tombol Fullscreen
    createFullscreenButton(width, height) {
        if (!fullscreenManager.supportsFullscreen) return;

        const btnX = width - 60; // Pojok kanan
        const btnY = 60;         // Atas

        this.fullscreenBtn = this.add.text(btnX, btnY, '', {
            font: 'bold 28px Arial',
            fill: '#00ff00',
            stroke: '#00cc00',
            strokeThickness: 3,
            backgroundColor: '#001a00',
            padding: { x: 12, y: 8 }
        });
        this.fullscreenBtn.setOrigin(0.5);
        this.fullscreenBtn.setDepth(1000);
        this.fullscreenBtn.setInteractive({ useHandCursor: true });

        // Hover effect
        this.fullscreenBtn.on('pointerover', () => {
            this.fullscreenBtn.setStyle({ 
                fill: '#aaffaa', 
                backgroundColor: '#003300' 
            });
        });

        this.fullscreenBtn.on('pointerout', () => {
            this.fullscreenBtn.setStyle({ 
                fill: '#00ff00', 
                backgroundColor: '#001a00' 
            });
        });

        // Klik untuk toggle fullscreen
        this.fullscreenBtn.on('pointerdown', () => {
            fullscreenManager.toggleFullscreen();
        });

        // Update icon saat status berubah
        this.updateFullscreenButtonIcon();
        
        // Listener untuk update icon otomatis
        window.addEventListener('fullscreenchange', () => this.updateFullscreenButtonIcon());
        window.addEventListener('webkitfullscreenchange', () => this.updateFullscreenButtonIcon());
    }

    // ✅ Update icon tombol (⛶ atau ✕)
    updateFullscreenButtonIcon() {
        if (!this.fullscreenBtn) return;

        const isFullscreen = fullscreenManager.getStatus();

        if (isFullscreen) {
            this.fullscreenBtn.setText('✕');
            this.fullscreenBtn.setStyle({
                fill: '#ff4444',        // Merah saat fullscreen (untuk exit)
                stroke: '#cc0000',
                backgroundColor: '#330000'
            });
        } else {
            this.fullscreenBtn.setText('⛶');
            this.fullscreenBtn.setStyle({
                fill: '#00ff00',        // Hijau saat normal
                stroke: '#00cc00',
                backgroundColor: '#001a00'
            });
        }
    }
}