// boot-scene.js - Load semua aset game
export default class BootScene extends Phaser.Scene {
    constructor() {
        super('BootScene');
    }
    
    preload() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        
        const loadingText = this.add.text(width/2, height/2 - 50, 'Memuat EvoCell...', {
            font: '28px Arial',
            fill: '#00ffff',
            stroke: '#000000',
            strokeThickness: 4
        });
        loadingText.setOrigin(0.5);
        
        const progressBox = this.add.graphics();
        progressBox.fillStyle(0x222222, 0.8);
        progressBox.fillRect(width/2 - 160, height/2 - 10, 320, 50);
        
        const progressBar = this.add.graphics();
        this.load.on('progress', (value) => {
            progressBar.clear();
            progressBar.fillStyle(0x00ff00, 1);
            progressBar.fillRect(width/2 - 150, height/2, 300 * value, 30);
        });
        
        // Load semua gambar
        this.load.image('bgMain', 'assets/images/main-menu-evocell/main-menu-evocell.png');
        this.load.image('logo', 'assets/images/main-menu-evocell/evocell-trans.png');
        this.load.image('introLogo', 'assets/images/main-menu-evocell/main-title-evocell.png');
        this.load.image('earth', 'assets/images/main-menu-evocell/earth.png');
        this.load.image('btnCampaign', 'assets/images/main-menu-evocell/campaign-btn.png');
        this.load.image('btnBack', 'assets/images/main-menu-evocell/back-btn.png');
        this.load.image('btnSettings', 'assets/images/main-menu-evocell/gear-setting.png');
        this.load.image('prokaryotic', 'assets/images/cell-prokaryotic/one-prokaryotic-cell.png');
        this.load.image('virus', 'assets/images/virus/one-virus-magenta.png');
        this.load.image('wbc', 'assets/images/white-blood-cell/one-white-blood-cell.png');
        this.load.image('bacteria', 'assets/images/bacteria/one-bacteria-green.png');
        this.load.image('bgGameplay', 'assets/images/scene-evocell/deep-sea.png');
        
        // ✅ BACKGROUND VIRUS - Pastikan path benar
        this.load.image('bgVirus', 'assets/images/scene-evocell/human-imune-system.png');
        this.load.image('bacteriaBatang', 'assets/images/bacteria/bacteria-batang.png');
this.load.image('bacteriaSpiral', 'assets/images/bacteria/bacteria-spiral.png');
this.load.image('bakteriRantai', 'assets/images/bacteria/bakteri-rantai.png');
this.load.image('bakteriBulat', 'assets/images/bacteria/bakteri-bulat.png');
        
        // Card & Button
        this.load.image('cardRock', 'assets/images/main-menu-evocell/card-rock.png');
        this.load.image('btnPlay', 'assets/images/main-menu-evocell/play-button.png');
        this.load.image('pause-btn', 'assets/images/main-menu-evocell/pause-btn.png');
        this.load.image('resume-btn', 'assets/images/main-menu-evocell/resume-btn.png');
        this.load.image('exit-btn', 'assets/images/main-menu-evocell/exit-btn.png');

        // ... kode yang sudah ada ...

// ✅ ICON DEVICE SELECTOR
this.load.image('pcIcon', 'assets/images/main-menu-evocell/pc-ikon.png');
this.load.image('laptopIcon', 'assets/images/main-menu-evocell/laptop-ikon.png');
this.load.image('mobileIcon', 'assets/images/main-menu-evocell/hp-ikon.png');

// ✅ ICON HUD KONTROL
this.load.image('wasdIcon', 'assets/images/main-menu-evocell/wasd-ikon.png');
this.load.image('cursorIcon', 'assets/images/main-menu-evocell/cursor-ikon.png');
this.load.image('autoLockIcon', 'assets/images/main-menu-evocell/auto-lock.png');
    }
    
    create() {
        this.scene.start('IntroScene');
    }
}