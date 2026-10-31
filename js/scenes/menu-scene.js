// menu-scene.js - Main menu dengan LOGO GAMBAR EvoCell
import { fullscreenManager } from '../utils/fullscreen.js';
import { getCurrentLang, createLanguageSwitch } from '../utils/translations.js';

export default class MenuScene extends Phaser.Scene {
    constructor() {
        super('MenuScene');
        this.selectedRole = 0;
        this.roles = ['prokaryotic', 'virus', 'wbc'];
        const lang = getCurrentLang();
        this.roleNames = lang === 'id' ? ['Prokariotik', 'Virus', 'Sel Darah Putih'] : ['Prokaryotic', 'Virus', 'White Blood Cell'];
        this.fullscreenBtn = null;
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        this.add.image(width/2, height/2, 'bgMain');
        const logo = this.add.image(width/2, height/4-30, 'logo');
        logo.setScale(0.3);

        this.roleText = this.add.text(width/2, 290, this.roleNames[this.selectedRole], {
            font: '28px Arial', fill: '#ffffff', stroke: '#000000', strokeThickness: 4
        }).setOrigin(0.5);

        this.characterSprite = this.add.sprite(width/2, height/2+60, this.roles[this.selectedRole]);
        this.characterSprite.setScale(6);

        const arrowLeft = this.add.text(width/2-180, height/2+80, '<', { font: 'bold 64px Arial', fill: '#ffffff', stroke: '#000000', strokeThickness: 5 }).setOrigin(0.5);
        arrowLeft.setInteractive({ useHandCursor: true });
        arrowLeft.on('pointerdown', () => this.changeRole(-1));
        arrowLeft.on('pointerover', () => arrowLeft.setScale(1.2));
        arrowLeft.on('pointerout', () => arrowLeft.setScale(1));

        const arrowRight = this.add.text(width/2+180, height/2+80, '>', { font: 'bold 64px Arial', fill: '#ffffff', stroke: '#000000', strokeThickness: 5 }).setOrigin(0.5);
        arrowRight.setInteractive({ useHandCursor: true });
        arrowRight.on('pointerdown', () => this.changeRole(1));
        arrowRight.on('pointerover', () => arrowRight.setScale(1.2));
        arrowRight.on('pointerout', () => arrowRight.setScale(1));

        const campaignBtn = this.add.image(width/2, height-120, 'btnCampaign');
        campaignBtn.setScale(0.43);
        campaignBtn.setInteractive({ useHandCursor: true });
        campaignBtn.on('pointerover', () => campaignBtn.setScale(0.45));
        campaignBtn.on('pointerout', () => campaignBtn.setScale(0.43));
        campaignBtn.on('pointerdown', () => {
            this.scene.start('ModeSelectScene', { role: this.roles[this.selectedRole] });
        });

        const deviceModeBtn = this.add.text(60, 60, '⚙️ ' + (getCurrentLang() === 'id' ? 'Mode Perangkat' : 'Device Mode'), {
            font: 'bold 24px Arial', fill: '#00ff00', stroke: '#00cc00', strokeThickness: 3, backgroundColor: '#001a00', padding: { x: 20, y: 12 }
        }).setOrigin(0, 0.5);
        deviceModeBtn.setInteractive({ useHandCursor: true });
        deviceModeBtn.on('pointerover', () => deviceModeBtn.setStyle({ fill: '#aaffaa', backgroundColor: '#003300' }));
        deviceModeBtn.on('pointerout', () => deviceModeBtn.setStyle({ fill: '#00ff00', backgroundColor: '#001a00' }));
        deviceModeBtn.on('pointerdown', () => this.scene.start('DeviceModeScene'));

        createLanguageSwitch(this, 120, 150);
        this.createFullscreenButton(width, height);
    }

    createFullscreenButton(width, height) {
        if (!fullscreenManager.supportsFullscreen) return;
        this.fullscreenBtn = this.add.text(width - 60, 60, '⛶', { font: 'bold 28px Arial', fill: '#00ff00', stroke: '#00cc00', strokeThickness: 3, backgroundColor: '#001a00', padding: { x: 12, y: 8 } });
        this.fullscreenBtn.setOrigin(0.5).setDepth(1000).setInteractive({ useHandCursor: true });
        this.fullscreenBtn.on('pointerover', () => this.fullscreenBtn.setStyle({ fill: '#aaffaa', backgroundColor: '#003300' }));
        this.fullscreenBtn.on('pointerout', () => this.fullscreenBtn.setStyle({ fill: '#00ff00', backgroundColor: '#001a00' }));
        this.fullscreenBtn.on('pointerdown', () => fullscreenManager.toggleFullscreen());
        this.updateFullscreenButtonIcon();
        window.addEventListener('fullscreenchange', () => this.updateFullscreenButtonIcon());
        window.addEventListener('webkitfullscreenchange', () => this.updateFullscreenButtonIcon());
    }

    updateFullscreenButtonIcon() {
        if (!this.fullscreenBtn) return;
        const isFullscreen = fullscreenManager.getStatus();
        this.fullscreenBtn.setText(isFullscreen ? '✕' : '⛶');
        this.fullscreenBtn.setStyle({
            fill: isFullscreen ? '#ff4444' : '#00ff00',
            stroke: isFullscreen ? '#cc0000' : '#00cc00',
            backgroundColor: isFullscreen ? '#330000' : '#001a00'
        });
    }

    changeRole(direction) {
        this.selectedRole += direction;
        if (this.selectedRole < 0) this.selectedRole = this.roles.length - 1;
        if (this.selectedRole >= this.roles.length) this.selectedRole = 0;
        this.characterSprite.setTexture(this.roles[this.selectedRole]);
        this.roleText.setText(this.roleNames[this.selectedRole]);
        this.tweens.add({ targets: this.characterSprite, scaleX: 3.3, scaleY: 3.3, duration: 100, yoyo: true, ease: 'Back.easeOut' });
    }
}