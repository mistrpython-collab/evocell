// js/scenes/device-mode-scene.js
export default class DeviceModeScene extends Phaser.Scene {
    constructor() {
        super('DeviceModeScene');
    }

    create() {
        console.log('=== DeviceModeScene START ===');
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // 1. Background
        const bg = this.add.image(width / 2, height / 2, 'bgMain');
        bg.setDisplaySize(width, height);
        bg.setDepth(-1);

        // 2. Overlay gelap
        const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.3);
        overlay.setDepth(0);

        // 3. Judul
        this.add.text(width / 2, 90, 'PILIH MODE PERANGKAT', {
            font: 'bold 48px Arial',
            fill: '#00ffff',
            stroke: '#000000',
            strokeThickness: 6
        }).setOrigin(0.5).setDepth(10);

        // 4. Subtitle
        this.add.text(width / 2, 140, 'Pilih sesuai perangkat yang kamu gunakan', {
            font: '20px Arial',
            fill: '#cccccc',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5).setDepth(10);

        // 5. LOGIKA AUTO-DETECT
        let savedDevice = localStorage.getItem('evocell_device');
        
        if (!savedDevice) {
            // Jika belum pernah pilih, jalankan auto-detect!
            savedDevice = this.autoDetectDevice();
            console.log('🤖 Auto-detected device:', savedDevice);
        } else {
            console.log('💾 Loaded saved device:', savedDevice);
        }

        this.currentDevice = savedDevice;

        // 6. Data card
        const cardData = [
            { key: 'pc', x: width/2 - 260, y: height/2 + 20, icon: 'pcIcon' },
            { key: 'laptop', x: width/2, y: height/2 + 20, icon: 'laptopIcon' },
            { key: 'mobile', x: width/2 + 260, y: height/2 + 20, icon: 'mobileIcon' }
        ];

        // 7. Buat card
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
                this.tweens.add({ targets: cardBg, displayWidth: 242, displayHeight: 220, duration: 150, ease: 'Power2' });
                this.tweens.add({ targets: icon, displayWidth: 198, displayHeight: 154, duration: 150, ease: 'Power2' });
            });

            cardBg.on('pointerout', () => {
                this.tweens.add({ targets: cardBg, displayWidth: 220, displayHeight: 200, duration: 150, ease: 'Power2' });
                this.tweens.add({ targets: icon, displayWidth: 180, displayHeight: 140, duration: 150, ease: 'Power2' });
            });

            // Klik card
            cardBg.on('pointerdown', () => {
                console.log('Manual selection:', data.key);
                this.selectDevice(data.key);
            });

            this.cards[data.key] = { bg: cardBg, icon: icon };
        });

        // 8. Apply highlight ke device yang terdetek/tersimpan
        if (this.currentDevice) {
            this.applyYellowHighlight(this.currentDevice);
        }

        // 9. Tombol Back
        const backBtn = this.add.image(80, 60, 'btnBack');
        backBtn.setScale(0.4);
        backBtn.setDepth(1000);
        backBtn.setInteractive({ useHandCursor: true });
        backBtn.on('pointerdown', () => this.scene.start('MenuScene'));
        backBtn.on('pointerover', () => backBtn.setScale(0.45));
        backBtn.on('pointerout', () => backBtn.setScale(0.4));

        console.log('=== DeviceModeScene READY ===');
    }

    // ✅ FUNGSI AUTO-DETECT DEVICE
    autoDetectDevice() {
        const ua = navigator.userAgent;
        const isMobileUA = /Android|iPhone|iPad|iPod|Mobile|Tablet/i.test(ua);
        const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        
        // Deteksi Mobile/Tablet
        // Jika user agent mobile ATAU (punya touch screen DAN layar kecil < 1024px)
        if (isMobileUA || (hasTouch && window.innerWidth < 1024)) {
            return 'mobile';
        }

        // Deteksi Desktop (PC/Laptop)
        // Default ke 'laptop' (Auto-aim) karena lebih aman untuk game kasual.
        // User yang punya mouse bisa manual pilih 'PC' nanti.
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
            card.bg.setTint(0xffff00); // Hanya cardRock yang kuning
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
                displayWidth: 250, displayHeight: 230,
                duration: 150, yoyo: true, ease: 'Power2'
            });
            this.tweens.add({
                targets: card.icon,
                displayWidth: 210, displayHeight: 165,
                duration: 150, yoyo: true, ease: 'Power2'
            });
        }
    }
}