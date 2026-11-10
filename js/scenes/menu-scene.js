// menu-scene.js - Main menu dengan LOGO GAMBAR EvoCell
import { fullscreenManager } from '../utils/fullscreen.js';
import { getCurrentLang, createLanguageSwitch } from '../utils/translations.js';

// ✅ VARIABEL GLOBAL MUSIK
let isMusicOn = localStorage.getItem('evocell_music') !== 'false';
let bgmInstance = null;

export default class MenuScene extends Phaser.Scene {
    constructor() {
        super('MenuScene');
        this.selectedRole = 0;
        this.roles = ['prokaryotic', 'virus', 'wbc'];
        this.fullscreenBtn = null;
        this.guideBtn = null;
        this.musicToggleBtn = null;
        
        // ✅ NAMA KARAKTER - Indonesia & Inggris
        this.roleNamesID = ['Prokariotik', 'Virus', 'Sel Darah Putih'];
        this.roleNamesEN = ['Prokaryotic', 'Virus', 'White Blood Cell'];
    }

    preload() {
        this.load.spritesheet('prokaryoticAnim', 'assets/images/main-menu-evocell/prokariotikhighres.png', {
            frameWidth: 670,
            frameHeight: 680
        });
        this.load.spritesheet('virusAnim', 'assets/images/main-menu-evocell/virushighres.png', {
            frameWidth: 287,
            frameHeight: 257
        });
        this.load.spritesheet('wbcAnim', 'assets/images/main-menu-evocell/wbchighres.png', {
            frameWidth: 272,
            frameHeight: 263
        });
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        
        const lang = getCurrentLang();
        const roleNames = lang === 'id' ? this.roleNamesID : this.roleNamesEN;

        if (!this.anims.exists('prokaryoticIdle')) {
            this.anims.create({
                key: 'prokaryoticIdle',
                frames: this.anims.generateFrameNumbers('prokaryoticAnim', { start: 0, end: 1 }),
                frameRate: 2,
                repeat: -1
            });
        }
        if (!this.anims.exists('virusIdle')) {
            this.anims.create({
                key: 'virusIdle',
                frames: this.anims.generateFrameNumbers('virusAnim', { start: 0, end: 1 }),
                frameRate: 2,
                repeat: -1
            });
        }
        if (!this.anims.exists('wbcIdle')) {
            this.anims.create({
                key: 'wbcIdle',
                frames: this.anims.generateFrameNumbers('wbcAnim', { start: 0, end: 1 }),
                frameRate: 2,
                repeat: -1
            });
        }
        

        this.add.image(width/2, height/2, 'bgMain');
        const logo = this.add.image(width/2, height/4 - 30, 'logo');
        logo.setScale(0.3);

        this.roleText = this.add.text(width/2, 290, roleNames[this.selectedRole], {
            font: '28px Arial', fill: '#ffffff', stroke: '#000000', strokeThickness: 4
        }).setOrigin(0.5);

        this.characterSprite = this.add.sprite(width/2, height/2 + 60, this.roles[this.selectedRole]);
        this.characterSprite.setScale(6);
        
        this.updateCharacterSprite();

        const arrowLeft = this.add.text(width/2 - 180, height/2 + 80, '<', { 
            font: 'bold 64px Arial', fill: '#ffffff', stroke: '#000000', strokeThickness: 5 
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });
        arrowLeft.on('pointerdown', () => this.changeRole(-1));
        arrowLeft.on('pointerover', () => arrowLeft.setScale(1.2));
        arrowLeft.on('pointerout', () => arrowLeft.setScale(1));

        const arrowRight = this.add.text(width/2 + 180, height/2 + 80, '>', { 
            font: 'bold 64px Arial', fill: '#ffffff', stroke: '#000000', strokeThickness: 5 
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });
        arrowRight.on('pointerdown', () => this.changeRole(1));
        arrowRight.on('pointerover', () => arrowRight.setScale(1.2));
        arrowRight.on('pointerout', () => arrowRight.setScale(1));

        const campaignBtn = this.add.image(width/2, height - 120, 'btnCampaign');
        campaignBtn.setScale(0.43).setInteractive({ useHandCursor: true });
        campaignBtn.on('pointerover', () => campaignBtn.setScale(0.45));
        campaignBtn.on('pointerout', () => campaignBtn.setScale(0.43));
        campaignBtn.on('pointerdown', () => {
            this.scene.start('ModeSelectScene', { role: this.roles[this.selectedRole] });
        });

        const deviceModeText = lang === 'id' ? 'Mode Perangkat' : 'Device Mode';
        const deviceModeBtn = this.add.text(60, 60, '⚙️ ' + deviceModeText, {
            font: 'bold 24px Arial', fill: '#00ff00', stroke: '#00cc00', strokeThickness: 3, 
            backgroundColor: '#001a00', padding: { x: 20, y: 12 }
        }).setOrigin(0, 0.5).setInteractive({ useHandCursor: true });
        deviceModeBtn.on('pointerover', () => deviceModeBtn.setStyle({ fill: '#aaffaa', backgroundColor: '#003300' }));
        deviceModeBtn.on('pointerout', () => deviceModeBtn.setStyle({ fill: '#00ff00', backgroundColor: '#001a00' }));
        deviceModeBtn.on('pointerdown', () => this.scene.start('DeviceModeScene'));

        createLanguageSwitch(this, 120, 150);
        this.createFullscreenButton(width, height);
        this.createGuideButton(width, height);

        // ==========================================
        // ✅ SETUP MUSIK - TIDAK DIHENTIKAN SAAT NAVIGASI MENU
        // ==========================================
        
        // Buat instance musik hanya jika belum ada
        if (!bgmInstance && this.cache.audio.exists('mainMenuMusic')) {
            bgmInstance = this.sound.add('mainMenuMusic', { loop: true, volume: 0.5 });
            if (isMusicOn) {
                bgmInstance.play();
            }
        }

        // Tombol Toggle Musik
        this.musicToggleBtn = this.add.text(50, height - 50, isMusicOn ? '🔊' : '🔇', { 
            fontSize: '48px' 
        })
        .setOrigin(0.5)
        .setDepth(1000)
        .setInteractive({ useHandCursor: true });

        this.musicToggleBtn.on('pointerdown', () => {
            isMusicOn = !isMusicOn;
            this.musicToggleBtn.setText(isMusicOn ? '🔊' : '🔇');
            
            if (bgmInstance) {
                if (isMusicOn) {
                    if (!bgmInstance.isPlaying) bgmInstance.play();
                    else bgmInstance.resume();
                } else {
                    bgmInstance.pause();
                }
            }
            localStorage.setItem('evocell_music', isMusicOn.toString());
        });

        this.musicToggleBtn.on('pointerover', () => this.musicToggleBtn.setScale(1.2));
        this.musicToggleBtn.on('pointerout', () => this.musicToggleBtn.setScale(1));

        // Fallback: Unlock audio
        this.input.once('pointerdown', () => {
            if (bgmInstance && !bgmInstance.isPlaying && isMusicOn) {
                bgmInstance.play();
            }
        });
    }

    updateCharacterSprite() {
        const role = this.roles[this.selectedRole];
        if (role === 'prokaryotic') {
            this.characterSprite.setTexture('prokaryoticAnim');
            this.characterSprite.setScale(0.35);
            this.characterSprite.setOrigin(0.5, 0.5);
            this.characterSprite.play('prokaryoticIdle');
        } else if (role === 'virus') {
            this.characterSprite.setTexture('virusAnim');
            this.characterSprite.setScale(0.9);
            this.characterSprite.setOrigin(0.5, 0.5);
            this.characterSprite.play('virusIdle');
        } else if (role === 'wbc') {
            this.characterSprite.setTexture('wbcAnim');
            this.characterSprite.setScale(0.85);
            this.characterSprite.setOrigin(0.5, 0.5);
            this.characterSprite.play('wbcIdle');
        } else {
            this.characterSprite.stop();
            this.characterSprite.setTexture(role);
            this.characterSprite.setScale(6);
            this.characterSprite.setOrigin(0.5, 0.5);
        }
    }

    createGuideButton(width, height) {
        const guideBtn = this.add.text(width / 2 + 500, height - 60, '📖 Panduan/Guides', {
            font: 'bold 20px Arial', fill: '#ffff00', stroke: '#000000', strokeThickness: 3,
            backgroundColor: '#333300', padding: { x: 15, y: 10 }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        guideBtn.on('pointerover', () => { guideBtn.setStyle({ fill: '#ffffff', backgroundColor: '#555500' }); guideBtn.setScale(1.05); });
        guideBtn.on('pointerout', () => { guideBtn.setStyle({ fill: '#ffff00', backgroundColor: '#333300' }); guideBtn.setScale(1); });
        guideBtn.on('pointerdown', () => {
            const currentLang = getCurrentLang();
            if (window.openGuide) window.openGuide(currentLang);
        });
        this.guideBtn = guideBtn;
    }

    createFullscreenButton(width, height) {
        if (!fullscreenManager.supportsFullscreen) return;
        this.fullscreenBtn = this.add.text(width - 60, 60, '', { 
            font: 'bold 28px Arial', fill: '#00ff00', stroke: '#00cc00', strokeThickness: 3, 
            backgroundColor: '#001a00', padding: { x: 12, y: 8 } 
        });
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
        const lang = getCurrentLang();
        const roleNames = lang === 'id' ? this.roleNamesID : this.roleNamesEN;
        
        this.selectedRole += direction;
        if (this.selectedRole < 0) this.selectedRole = this.roles.length - 1;
        if (this.selectedRole >= this.roles.length) this.selectedRole = 0;
        
        this.updateCharacterSprite();
        this.roleText.setText(roleNames[this.selectedRole]);
        
        const s = this.characterSprite.scaleX;
        this.tweens.add({ 
            targets: this.characterSprite, scaleX: s * 0.85, scaleY: s * 0.85, 
            duration: 100, yoyo: true, ease: 'Back.easeOut' 
        });
    }

    // ✅ SHUTDOWN: JANGAN HENTIKAN MUSIK - biarkan terus berputar saat navigasi menu
    shutdown() {
        // Musik TIDAK dihentikan di sini agar tetap looping saat:
        // MenuScene → DeviceModeScene → kembali ke MenuScene
        // Musik hanya berhenti saat masuk scene game (WBCGame, VirusGame, dll)
        // yang sudah ada kode this.sound.stopByKey('mainMenuMusic') di create() mereka
    }
}