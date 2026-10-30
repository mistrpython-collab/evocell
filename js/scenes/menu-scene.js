// menu-scene.js - Main menu dengan LOGO GAMBAR EvoCell
import { fullscreenManager } from '../utils/fullscreen.js'; // Import fullscreen

export default class MenuScene extends Phaser.Scene {
    constructor() {
        super('MenuScene');
        this.selectedRole = 0;
        this.roles = ['prokaryotic', 'virus', 'wbc'];
        this.roleNames = ['Prokaryotic', 'Virus', 'Sel Darah Putih'];
        this.fullscreenBtn = null; // Variabel untuk tombol fullscreen
    }

    create() {
        console.log('MenuScene dibuat - merender...');

        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // 1. Background gambar
        this.add.image(width/2, height/2, 'bgMain');

        // 2. LOGO GAMBAR EVOCELL
        const logo = this.add.image(width/2, height/4-30, 'logo');
        logo.setScale(0.3);

        // 3. Teks nama role
        this.roleText = this.add.text(width/2, 290, this.roleNames[this.selectedRole], {
            font: '28px Arial',
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4
        });
        this.roleText.setOrigin(0.5);

        // 4. Karakter di tengah
        this.characterSprite = this.add.sprite(width/2, height/2+60, this.roles[this.selectedRole]);
        this.characterSprite.setScale(6);

        // 5. Panah Kiri
        const arrowLeft = this.add.text(width/2-180, height/2+80, '<', {
            font: 'bold 64px Arial',
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 5
        });
        arrowLeft.setOrigin(0.5);
        arrowLeft.setInteractive({ useHandCursor: true });
        arrowLeft.on('pointerdown', () => this.changeRole(-1));
        arrowLeft.on('pointerover', () => arrowLeft.setScale(1.2));
        arrowLeft.on('pointerout', () => arrowLeft.setScale(1));

        // 6. Panah Kanan
        const arrowRight = this.add.text(width/2+180, height/2+80, '>', {
            font: 'bold 64px Arial',
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 5
        });
        arrowRight.setOrigin(0.5);
        arrowRight.setInteractive({ useHandCursor: true });
        arrowRight.on('pointerdown', () => this.changeRole(1));
        arrowRight.on('pointerover', () => arrowRight.setScale(1.2));
        arrowRight.on('pointerout', () => arrowRight.setScale(1));

        // 7. Tombol Campaign (Tengah Bawah)
        const campaignBtn = this.add.image(width/2, height-120, 'btnCampaign');
        campaignBtn.setScale(0.43);
        campaignBtn.setInteractive({ useHandCursor: true });
        campaignBtn.on('pointerover', () => campaignBtn.setScale(0.45));
        campaignBtn.on('pointerout', () => campaignBtn.setScale(0.43));
        campaignBtn.on('pointerdown', () => {
            console.log('Campaign clicked - role:', this.roles[this.selectedRole]);
            this.scene.start('ModeSelectScene', { role: this.roles[this.selectedRole] });
        });

        // 8. Tombol Device Mode (Kiri Atas - Hijau)
        const deviceModeBtn = this.add.text(60, 60, '⚙️ Device Mode', {
            font: 'bold 24px Arial',
            fill: '#00ff00',
            stroke: '#00cc00',
            strokeThickness: 3,
            backgroundColor: '#001a00',
            padding: { x: 20, y: 12 }
        });
        deviceModeBtn.setOrigin(0, 0.5);
        deviceModeBtn.setInteractive({ useHandCursor: true });
        deviceModeBtn.on('pointerover', () => deviceModeBtn.setStyle({ fill: '#aaffaa', backgroundColor: '#003300' }));
        deviceModeBtn.on('pointerout', () => deviceModeBtn.setStyle({ fill: '#00ff00', backgroundColor: '#001a00' }));
        deviceModeBtn.on('pointerdown', () => this.scene.start('DeviceModeScene'));

        // 9. Tombol Fullscreen (Kanan Atas - Hijau)
        this.createFullscreenButton(width, height);

        console.log('MenuScene create completed');
    }

    // Fungsi membuat tombol Fullscreen
    createFullscreenButton(width, height) {
        if (!fullscreenManager.supportsFullscreen) return;

        const btnX = width - 60; // Pojok kanan
        const btnY = 60;         // Atas

        this.fullscreenBtn = this.add.text(btnX, btnY, '⛶', {
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
            this.fullscreenBtn.setStyle({ fill: '#aaffaa', backgroundColor: '#003300' });
        });
        this.fullscreenBtn.on('pointerout', () => {
            this.fullscreenBtn.setStyle({ fill: '#00ff00', backgroundColor: '#001a00' });
        });

        // Klik untuk toggle
        this.fullscreenBtn.on('pointerdown', () => {
            fullscreenManager.toggleFullscreen();
        });

        // Update icon saat status berubah
        this.updateFullscreenButtonIcon();
        
        // Listener untuk update icon otomatis
        window.addEventListener('fullscreenchange', () => this.updateFullscreenButtonIcon());
        window.addEventListener('webkitfullscreenchange', () => this.updateFullscreenButtonIcon());
    }

    // Update icon tombol (⛶ atau ✕)
    updateFullscreenButtonIcon() {
        if (!this.fullscreenBtn) return;

        const isFullscreen = fullscreenManager.getStatus();

        if (isFullscreen) {
            this.fullscreenBtn.setText('✕');
            this.fullscreenBtn.setStyle({
                fill: '#ff4444', // Merah saat fullscreen (untuk exit)
                stroke: '#cc0000',
                backgroundColor: '#330000'
            });
        } else {
            this.fullscreenBtn.setText('⛶');
            this.fullscreenBtn.setStyle({
                fill: '#00ff00', // Hijau saat normal
                stroke: '#00cc00',
                backgroundColor: '#001a00'
            });
        }
    }

    // Fungsi ganti karakter
    changeRole(direction) {
        this.selectedRole += direction;
        if (this.selectedRole < 0) this.selectedRole = this.roles.length - 1;
        if (this.selectedRole >= this.roles.length) this.selectedRole = 0;

        this.characterSprite.setTexture(this.roles[this.selectedRole]);
        this.roleText.setText(this.roleNames[this.selectedRole]);

        this.tweens.add({
            targets: this.characterSprite,
            scaleX: 3.3,
            scaleY: 3.3,
            duration: 100,
            yoyo: true,
            ease: 'Back.easeOut'
        });
    }
}