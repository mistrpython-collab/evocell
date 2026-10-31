// device-mode-scene.js - Pilih Mode Perangkat
import { fullscreenManager } from '../utils/fullscreen.js';
import { getLang } from '../utils/translations.js';

export default class DeviceModeScene extends Phaser.Scene {
    constructor() {
        super('DeviceModeScene');
        this.fullscreenBtn = null;
    }

    create() {
        console.log('=== DeviceModeScene START ===');
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // Background
        const bg = this.add.image(width / 2, height / 2, 'bgMain');
        bg.setDisplaySize(width, height);
        bg.setDepth(-1);

        // Overlay gelap
        const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.3);
        overlay.setDepth(0);

        // Judul
        this.add.text(width / 2, 90, getLang('selectDeviceTitle'), {
            font: 'bold 48px Arial',
            fill: '#00ffff',
            stroke: '#000000',
            strokeThickness: 6
        }).setOrigin(0.5).setDepth(10);

        // Subtitle
        this.add.text(width / 2, 140, getLang('selectDeviceSubtitle'), {
            font: '20px Arial',
            fill: '#cccccc',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5).setDepth(10);

        // State: auto-detect atau load dari localStorage
        let savedDevice = localStorage.getItem('evocell_device');
        
        if (!savedDevice) {
            savedDevice = this.autoDetectDevice();
            console.log(' Auto-detected device:', savedDevice);
        } else {
            console.log('💾 Loaded saved device:', savedDevice);
        }

        this.currentDevice = savedDevice;

        // Data card
        const cardData = [
            { key: 'pc', x: width/2 - 260, y: height/2 + 20, icon: 'pcIcon' },
            { key: 'laptop', x: width/2, y: height/2 + 20, icon: 'laptopIcon' },
            { key: 'mobile', x: width/2 + 260, y: height/2 + 20, icon: 'mobileIcon' }
        ];

        // Buat card
        this.cards = {};
        cardData.forEach(data => {
            const cardBg = this.add.image(data.x, data.y, 'cardRock');
            cardBg.setDisplaySize(220, 200);
            cardBg.setDepth(2);

            const icon = this.add.image(data.x, data.y - 10, data.icon);
            icon.setDisplaySize(180, 140);
            icon.setDepth(3);

            const hitArea = new Phaser.Geom.Rectangle(data.x - 110, data.y - 100, 220, 200);
            cardBg.setInteractive({ hitArea: hitArea, useHandCursor: true });

            // Hover effect
            cardBg.on('pointerover', () => {
                this.tweens.add({
                    targets: cardBg,
                    displayWidth: 242,
                    displayHeight: 220,
                    duration: 150,
                    ease: 'Power2'
                });
                this.tweens.add({
                    targets: icon,
                    displayWidth: 198,
                    displayHeight: 154,
                    duration: 150,
                    ease: 'Power2'
                });
            });

            cardBg.on('pointerout', () => {
                this.tweens.add({
                    targets: cardBg,
                    displayWidth: 220,
                    displayHeight: 200,
                    duration: 150,
                    ease: 'Power2'
                });
                this.tweens.add({
                    targets: icon,
                    displayWidth: 180,
                    displayHeight: 140,
                    duration: 150,
                    ease: 'Power2'
                });
            });

            // Klik card
            cardBg.on('pointerdown', () => {
                console.log('Manual selection:', data.key);
                this.selectDevice(data.key);
            });

            this.cards[data.key] = { bg: cardBg, icon: icon };
        });

        // Apply highlight ke device yang terdetek/tersimpan
        if (this.currentDevice) {
            this.applyYellowHighlight(this.currentDevice);
        }

        // Tombol Back (Kiri Atas)
        const backBtn = this.add.image(80, 60, 'btnBack');
        backBtn.setScale(0.4);
        backBtn.setDepth(1000);
        backBtn.setInteractive({ useHandCursor: true });
        backBtn.on('pointerdown', () => this.scene.start('MenuScene'));
        backBtn.on('pointerover', () => backBtn.setScale(0.45));
        backBtn.on('pointerout', () => backBtn.setScale(0.4));

        // ✅ TOMBOL FULLSCREEN (Kanan Atas)
        this.createFullscreenButton(width, height);

        console.log('=== DeviceModeScene READY ===');
    }

    // Fungsi membuat tombol Fullscreen
    createFullscreenButton(width, height) {
        if (!fullscreenManager.supportsFullscreen) return;

        const btnX = width - 60;
        const btnY = 60;

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

        this.fullscreenBtn.on('pointerover', () => {
            this.fullscreenBtn.setStyle({ fill: '#aaffaa', backgroundColor: '#003300' });
        });
        this.fullscreenBtn.on('pointerout', () => {
            this.fullscreenBtn.setStyle({ fill: '#00ff00', backgroundColor: '#001a00' });
        });

        this.fullscreenBtn.on('pointerdown', () => {
            fullscreenManager.toggleFullscreen();
        });

        this.updateFullscreenButtonIcon();
        
        window.addEventListener('fullscreenchange', () => this.updateFullscreenButtonIcon());
        window.addEventListener('webkitfullscreenchange', () => this.updateFullscreenButtonIcon());
    }

    updateFullscreenButtonIcon() {
        if (!this.fullscreenBtn) return;

        const isFullscreen = fullscreenManager.getStatus();

        if (isFullscreen) {
            this.fullscreenBtn.setText('✕');
            this.fullscreenBtn.setStyle({
                fill: '#ff4444',
                stroke: '#cc0000',
                backgroundColor: '#330000'
            });
        } else {
            this.fullscreenBtn.setText('⛶');
            this.fullscreenBtn.setStyle({
                fill: '#00ff00',
                stroke: '#00cc00',
                backgroundColor: '#001a00'
            });
        }
    }

    // Auto-detect device
    autoDetectDevice() {
        const ua = navigator.userAgent;
        const isMobileUA = /Android|iPhone|iPad|iPod|Mobile|Tablet/i.test(ua);
        const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        
        if (isMobileUA || (hasTouch && window.innerWidth < 1024)) {
            return 'mobile';
        }

        return 'laptop';
    }

    // Apply highlight kuning
    applyYellowHighlight(deviceKey) {
        Object.values(this.cards).forEach(card => {
            card.bg.clearTint();
            card.icon.clearTint();
        });

        const card = this.cards[deviceKey];
        if (card) {
            card.bg.setTint(0xffff00);
            console.log('Highlight applied to:', deviceKey);
        }
    }

    // Saat user klik manual
    selectDevice(device) {
        this.currentDevice = device;
        localStorage.setItem('evocell_device', device);
        
        this.applyYellowHighlight(device);

        // Animasi bounce
        const card = this.cards[device];
        if (card) {
            this.tweens.add({
                targets: card.bg,
                displayWidth: 250,
                displayHeight: 230,
                duration: 150,
                yoyo: true,
                ease: 'Power2'
            });
            this.tweens.add({
                targets: card.icon,
                displayWidth: 210,
                displayHeight: 165,
                duration: 150,
                yoyo: true,
                ease: 'Power2'
            });
        }
    }
}