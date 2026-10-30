// js/scenes/cell-dodger-scene.js
import { fullscreenManager } from '../utils/fullscreen.js'; // ✅ TAMBAHAN 1: Import

export default class CellDodgerScene extends Phaser.Scene {
    constructor() {
        super("CellDodgerScene");
        this.fullscreenBtn = null; // ✅ TAMBAHAN 2: Variabel
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // 1. Background Vertikal Full Screen
        const bg = this.add.image(width / 2, height / 2, "bgGameplay");
        bg.setAngle(-90);
        bg.setScale(1.8);
        bg.setDepth(-1);

        // 2. Player di bawah tengah
        this.player = this.physics.add.sprite(width / 2, height - 100, "prokaryotic");
        this.player.setScale(2);
        this.player.setCollideWorldBounds(true);

        // 3. ✅ DAFTAR 5 JENIS BAKTERI (termasuk original hijau)
        this.bacteriaTypes = [
            'bacteria',          // Hijau original (yang lama)
            'bacteriaBatang',    // Ungu, bentuk batang
            'bacteriaSpiral',    // Biru, bentuk spiral
            'bakteriRantai',     // Orange, bentuk rantai
            'bakteriBulat'       // Hijau-kuning, bentuk bulat
        ];

        // 4. Grup Rintangan
        this.obstacles = this.physics.add.group();

        // 5. Spawn Rintangan setiap 800ms
        this.spawnEvent = this.time.addEvent({
            delay: 800,
            callback: this.spawnObstacle,
            callbackScope: this,
            loop: true
        });

        // 6. Kontrol 4 Arah
        this.cursors = this.input.keyboard.createCursorKeys();
        this.keys = this.input.keyboard.addKeys({
            up: Phaser.Input.Keyboard.KeyCodes.W,
            down: Phaser.Input.Keyboard.KeyCodes.S,
            left: Phaser.Input.Keyboard.KeyCodes.A,
            right: Phaser.Input.Keyboard.KeyCodes.D
        });

        // 7. Instruksi
        this.add.text(width / 2, height - 40, "Gunakan WASD atau Panah untuk bergerak!", {
            font: "18px Arial",
            fill: "#ffffff",
            stroke: "#000000",
            strokeThickness: 3
        }).setOrigin(0.5);

        // 8. Tombol Pause
        this.createPauseButton();

        // 9. Pause Menu
        this.createPauseMenu();

        // 10. Cek Tabrakan
        this.physics.add.collider(this.player, this.obstacles, this.hitObstacle, null, this);

        this.isPaused = false;
        this.score = 0;
        this.difficultyTimer = 0;

        // ✅ TAMBAHAN 3: Panggil fungsi buat tombol fullscreen
        this.createFullscreenButton(width, height);
    }

    createPauseButton() {
        const width = this.cameras.main.width;
        this.pauseBtn = this.add.image(width - 60, 60, "pause-btn");
        this.pauseBtn.setScale(0.5);
        this.pauseBtn.setDepth(100);
        this.pauseBtn.setInteractive({ useHandCursor: true });
        this.pauseBtn.on("pointerover", () => this.pauseBtn.setScale(0.6));
        this.pauseBtn.on("pointerout", () => this.pauseBtn.setScale(0.5));
        this.pauseBtn.on("pointerdown", () => this.togglePause());
    }

    createPauseMenu() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        this.pauseMenu = this.add.container(0, 0).setDepth(500).setVisible(false);

        const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.75);
        this.pauseMenu.add(overlay);

        const cardRock = this.add.image(width / 2, height / 2, "cardRock");
        cardRock.setDisplaySize(520, 400);
        this.pauseMenu.add(cardRock);

        this.resumeBtn = this.add.image(width / 2, height / 2 - 50, "resume-btn");
        this.resumeBtn.setDisplaySize(280, 80);
        this.resumeBtn.setInteractive({ useHandCursor: true });
        this.resumeBtn.on("pointerover", () => this.resumeBtn.setDisplaySize(300, 86));
        this.resumeBtn.on("pointerout", () => this.resumeBtn.setDisplaySize(280, 80));
        this.resumeBtn.on("pointerdown", () => this.togglePause());
        this.pauseMenu.add(this.resumeBtn);

        this.exitBtn = this.add.image(width / 2, height / 2 + 60, "exit-btn");
        this.exitBtn.setDisplaySize(280, 80);
        this.exitBtn.setInteractive({ useHandCursor: true });
        this.exitBtn.on("pointerover", () => this.exitBtn.setDisplaySize(300, 86));
        this.exitBtn.on("pointerout", () => this.exitBtn.setDisplaySize(280, 80));
        this.exitBtn.on("pointerdown", () => {
            this.scene.start("MenuScene");
        });
        this.pauseMenu.add(this.exitBtn);
    }

    update() {
        if (this.isPaused) return;

        const speed = 300;
        let velocityX = 0;
        let velocityY = 0;

        if (this.cursors.left.isDown || this.keys.left.isDown) {
            velocityX = -speed;
        } else if (this.cursors.right.isDown || this.keys.right.isDown) {
            velocityX = speed;
        }

        if (this.cursors.up.isDown || this.keys.up.isDown) {
            velocityY = -speed;
        } else if (this.cursors.down.isDown || this.keys.down.isDown) {
            velocityY = speed;
        }

        this.player.setVelocity(velocityX, velocityY);

        this.difficultyTimer++;
        if (this.difficultyTimer % 600 === 0) {
            this.spawnEvent.delay = Math.max(300, this.spawnEvent.delay - 100);
        }
    }

    spawnObstacle() {
        const width = this.cameras.main.width;
        const x = Phaser.Math.Between(50, width - 50);
        
        const randomIndex = Phaser.Math.Between(0, this.bacteriaTypes.length - 1);
        const bacteriaKey = this.bacteriaTypes[randomIndex];
        
        const obstacle = this.obstacles.create(x, -50, bacteriaKey);
        
        // ✅ SCALE LEBIH KECIL - Semua bakteri seukuran
        if (bacteriaKey === 'bakteriBulat') {
            obstacle.setScale(0.04); // Paling kecil
        } else if (bacteriaKey === 'bakteriRantai') {
            obstacle.setScale(0.05);
        } else if (bacteriaKey === 'bacteriaSpiral') {
            obstacle.setScale(0.05);
        } else if (bacteriaKey === 'bacteriaBatang') {
            obstacle.setScale(0.04);
        } else {
            obstacle.setScale(0.8); // bacteria (original hijau) - ukurannya sudah pas
        }
        
        const fallSpeed = Phaser.Math.Between(150, 300);
        const horizontalDirection = Phaser.Math.Between(0, 1) ? 1 : -1;
        const horizontalSpeed = Phaser.Math.Between(50, 150);
        
        obstacle.setVelocity(horizontalDirection * horizontalSpeed, fallSpeed);
        obstacle.setAngle(Phaser.Math.Between(0, 360));
        
        obstacle.checkWorldBounds = true;
        obstacle.outOfBoundsKill = true;
    }

    hitObstacle(player, obstacle) {
        this.physics.pause();
        this.spawnEvent.paused = true;
        player.setTint(0xff0000);
        
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        this.add.text(width / 2, height / 2 - 50, "GAME OVER", {
            font: "bold 64px Arial",
            fill: "#ff0000",
            stroke: "#000000",
            strokeThickness: 8
        }).setOrigin(0.5);

        this.add.text(width / 2, height / 2 + 50, "Klik untuk Kembali ke Menu", {
            font: "24px Arial",
            fill: "#00ff00",
            stroke: "#000000",
            strokeThickness: 3
        }).setOrigin(0.5);

        this.input.once("pointerdown", () => {
            this.scene.start("MenuScene");
        });
    }

    togglePause() {
        this.isPaused = !this.isPaused;

        if (this.isPaused) {
            this.physics.pause();
            this.spawnEvent.paused = true;
            this.pauseMenu.setVisible(true);
            this.pauseBtn.setVisible(false);
        } else {
            this.physics.resume();
            this.spawnEvent.paused = false;
            this.pauseMenu.setVisible(false);
            this.pauseBtn.setVisible(true);
        }
    }

    // ✅ TAMBAHAN 4: Fungsi membuat tombol Fullscreen di tengah atas
    createFullscreenButton(width, height) {
        if (!fullscreenManager.supportsFullscreen) return;

        const btnX = width / 2;
        const btnY = 60;

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

    // ✅ TAMBAHAN 5: Fungsi update icon tombol
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
}