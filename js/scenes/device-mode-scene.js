// js/scenes/device-mode-scene.js
export default class DeviceModeScene extends Phaser.Scene {
    constructor() {
        super('DeviceModeScene');
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // 1. Background (Deep Sea yang sudah kamu suka, diputar vertikal)
        const bg = this.add.image(width / 2, height / 2, 'bgGameplay');
        bg.setAngle(-90);
        bg.setScale(1.8);
        bg.setDepth(-1);

        // 2. Judul
        this.add.text(width / 2, 100, 'PILIH MODE PERANGKAT', {
            font: 'bold 36px Arial',
            fill: '#00ffff',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5);

        // 3. Baca mode yang tersimpan (default: 'pc')
        const currentDevice = localStorage.getItem('evocell_device') || 'pc';

        // 4. Container untuk 3 tombol di tengah
        const container = this.add.container(width / 2, height / 2);

        // --- TOMBOL PC ---
        const pcBtn = this.add.image(-220, 0, 'pcIcon');
        pcBtn.setDisplaySize(180, 130);
        pcBtn.setInteractive({ useHandCursor: true });
        pcBtn.on('pointerdown', () => this.selectDevice('pc'));
        pcBtn.on('pointerover', () => pcBtn.setScale(1.1));
        pcBtn.on('pointerout', () => pcBtn.setScale(1));
        if (currentDevice === 'pc') pcBtn.setStrokeStyle(5, 0x00ffff); // Glow cyan
        container.add(pcBtn);

        // --- TOMBOL LAPTOP ---
        const laptopBtn = this.add.image(0, 0, 'laptopIcon');
        laptopBtn.setDisplaySize(180, 130);
        laptopBtn.setInteractive({ useHandCursor: true });
        laptopBtn.on('pointerdown', () => this.selectDevice('laptop'));
        laptopBtn.on('pointerover', () => laptopBtn.setScale(1.1));
        laptopBtn.on('pointerout', () => laptopBtn.setScale(1));
        if (currentDevice === 'laptop') laptopBtn.setStrokeStyle(5, 0x00ff00); // Glow hijau
        container.add(laptopBtn);

        // --- TOMBOL MOBILE ---
        const mobileBtn = this.add.image(220, 0, 'mobileIcon');
        mobileBtn.setDisplaySize(180, 130);
        mobileBtn.setInteractive({ useHandCursor: true });
        mobileBtn.on('pointerdown', () => this.selectDevice('mobile'));
        mobileBtn.on('pointerover', () => mobileBtn.setScale(1.1));
        mobileBtn.on('pointerout', () => mobileBtn.setScale(1));
        if (currentDevice === 'mobile') mobileBtn.setStrokeStyle(5, 0xffaa00); // Glow orange
        container.add(mobileBtn);

        // 5. Tombol Back (Kiri Atas)
        const backBtn = this.add.image(80, 60, 'btnBack');
        backBtn.setScale(0.4);
        backBtn.setInteractive({ useHandCursor: true });
        backBtn.on('pointerover', () => backBtn.setScale(0.45));
        backBtn.on('pointerout', () => backBtn.setScale(0.4));
        backBtn.on('pointerdown', () => this.scene.start('MenuScene'));
    }

    // Fungsi saat tombol device diklik
    selectDevice(device) {
        localStorage.setItem('evocell_device', device);
        console.log('Device mode changed to:', device);
        this.scene.restart(); // Refresh scene untuk update efek glow
    }
}