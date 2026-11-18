// js/scenes/cell-dodger-scene.js
import { fullscreenManager } from '../utils/fullscreen.js';
import { getLang, getCurrentLang } from '../utils/translations.js';

export default class CellDodgerScene extends Phaser.Scene {
    constructor() {
        super("CellDodgerScene");
        this.fullscreenBtn = null;
    }

    init(data) {
        // ✅ KONFIGURASI ENDLESS MODE
        this.maxHP = 5;
        this.playerHP = 5; // Tetap 5 untuk testing UI Game Over
        this.dna = 0;
        this.survivalTime = 0;
        this.isGameOver = false;
        this.hasContinued = false;
        this.lastHitTime = 0;

        // ✅ Label bahasa
        const isID = getCurrentLang() === 'id';
        this.isID = isID;
        this.lblTime = isID ? 'Waktu' : 'Time';
        this.lblQuitHint = isID ? 'Untuk keluar: Pause → Exit' : 'To quit: Pause → Exit';

        // ✅ VARIABEL TAMENG BERLAPIS (3 LEVEL) - DIPERTAHANKAN UTUH
        this.shieldLevel = 0; // 0 = tidak ada, 1 = cyan, 2 = kuning, 3 = hijau
        this.shieldGraphics = null;
        this.nextShieldMilestone = 20; // Target DNA pertama

        // ✅ POINTER FOLLOW (mouse + touch) - TANPA WASD, TANPA JOYSTICK
        this.targetX = null;
        this.targetY = null;
        this.followSpeed = 8;        // multiplier jarak → kecepatan (naikkan = responsif)
        this.maxFollowSpeed = 400;   // batas maksimum kecepatan (agar tidak teleport)
        this.deadZone = 5;           // radius berhenti dalam pixel

        // ==========================================
        // ✅ VARIABEL PENEMBAKAN (MODE TESTING: UNLOCK LANGSUNG)
        //    Sistem 3 TIER:
        //    • Tier 1 = 1.0 detik (awal)
        //    • Tier 2 = 0.5 detik (setelah 2 kill)
        //    • Tier 3 = 0.3 detik (setelah 3 kill lagi)
        // ==========================================
        this.hasShootingUpgrade = true; // ✅ LANGSUNG AKTIF dari awal (testing)
        this.lastShootTime = 0;
        this.shootTiers = [1000, 500, 300];     // Daftar interval tiap tier (ms)
        this.shootTierIndex = 0;                // Mulai dari tier 0 (1 detik)
        this.shootInterval = 1000;              // Interval aktif saat ini
        this.killsInCurrentTier = 0;            // Counter kill di tier saat ini
        this.killsNeededForNextTier = [2, 3];   // Tier 0→1 butuh 2 kill, Tier 1→2 butuh 3 kill

        // ==========================================
        // ✅ KILL COUNTER BAKTERI (ditampilkan di HUD, reset saat Exit)
        // ==========================================
        this.bacteriaKillCount = 0;
    }

    create(data){
        // ✅ STOP MAIN MENU MUSIC
        const mainMenuMusic = this.sound.get('mainMenuMusic');
        if (mainMenuMusic) {
            mainMenuMusic.stop();
        }
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
        this.player.setDepth(5);

        // ✅ Set target awal = posisi player (agar sel tidak "melompat" ke kursor saat mulai)
        this.targetX = this.player.x;
        this.targetY = this.player.y;

        // 3. ✅ DAFTAR 5 JENIS BAKTERI
        this.bacteriaTypes = [
            'bacteria',
            'bacteriaBatang',
            'bacteriaSpiral',
            'bakteriRantai',
            'bakteriBulat'
        ];

        // 4. Grup Rintangan, DNA & PELURU
        this.obstacles = this.physics.add.group();
        this.dnaItems = this.physics.add.group();
        this.projectiles = this.physics.add.group();

        // ✅ BUAT TEKSTUR PELURU (Bola Kuning dengan Outline Hijau)
        const bulletGraphics = this.add.graphics();
        bulletGraphics.lineStyle(3, 0x00ff00, 1); // Outline hijau
        bulletGraphics.fillStyle(0xffff00, 1);    // Isi kuning
        bulletGraphics.fillCircle(10, 10, 10);
        bulletGraphics.strokeCircle(10, 10, 10);
        bulletGraphics.generateTexture('bulletYellowGreen', 20, 20);
        bulletGraphics.destroy();

        // 5. Spawn Rintangan setiap 800ms
        this.spawnEvent = this.time.addEvent({
            delay: 800,
            callback: this.spawnObstacle,
            callbackScope: this,
            loop: true
        });

        // 6. Spawn DNA setiap 3 detik
        this.dnaSpawnEvent = this.time.addEvent({
            delay: 3000,
            callback: this.spawnDNA,
            callbackScope: this,
            loop: true
        });

        // 7. Timer survival
        this.timerEvent = this.time.addEvent({
            delay: 1000,
            callback: () => {
                this.survivalTime++;
                this.updateHUD();
            },
            callbackScope: this,
            loop: true
        });

        // ==========================================
        // ✅ 8. KONTROL POINTER (mouse + touch) - SEMUA DEVICE
        // ==========================================
        this.input.on('pointermove', (pointer) => {
            if (this.isPaused || this.isGameOver) return;
            this.targetX = pointer.x;
            this.targetY = pointer.y;
        });

        this.input.on('pointerdown', (pointer) => {
            if (this.isPaused || this.isGameOver) return;
            this.targetX = pointer.x;
            this.targetY = pointer.y;
        });

        // ✅ ESC tetap untuk pause
        this.input.keyboard.on('keydown-ESC', () => this.togglePause());

        // 9. ✅ INSTRUKSI - TERJEMAHAN (hilang setelah 5 detik)
        const instrText = this.isID
            ? '🖱️ Gerakkan mouse / jari untuk mengikuti sel'
            : '🖱️ Move mouse / finger to follow the cell';
        const instruction = this.add.text(width / 2, height - 40, instrText, {
            font: "18px Arial",
            fill: "#ffffff",
            stroke: "#000000",
            strokeThickness: 3
        }).setOrigin(0.5);
        this.time.delayedCall(5000, () => instruction.destroy());

        // 10. HUD
        this.createHUD();

        // 11. Tombol Pause
        this.createPauseButton();

        // 12. Pause Menu
        this.createPauseMenu();

        // 13. Cek Tabrakan
        this.physics.add.overlap(this.player, this.obstacles, this.hitObstacle, null, this);
        this.physics.add.overlap(this.player, this.dnaItems, this.collectDNA, null, this);
        this.physics.add.overlap(this.projectiles, this.obstacles, this.hitObstacleWithBullet, null, this);

        this.isPaused = false;
        this.score = 0;
        this.difficultyTimer = 0;

        // 14. Fullscreen
        this.createFullscreenButton(width, height);
    }

    createHUD() {
        const width = this.cameras.main.width;

        // Kiri atas: Waktu & HP & Kill Count
        this.timeText = this.add.text(30, 30, `${this.lblTime}: 0s`, {
            font: "bold 24px Arial",
            fill: "#00ffff",
            stroke: "#000000",
            strokeThickness: 3
        }).setDepth(10);

        this.hpText = this.add.text(30, 62, `HP: ${this.playerHP}/${this.maxHP}`, {
            font: "bold 24px Arial",
            fill: "#00ff00",
            stroke: "#000000",
            strokeThickness: 3
        }).setDepth(10);

        // ✅ KILL COUNTER - di bawah HP (y=94)
        this.killCountText = this.add.text(30, 94, `Kills: 0`, {
            font: "bold 22px Arial",
            fill: "#ff6600",
            stroke: "#000000",
            strokeThickness: 3
        }).setDepth(10);

        // Kanan: DNA (y=110)
        this.dnaText = this.add.text(width - 30, 110, `DNA: 0`, {
            font: "bold 24px Arial",
            fill: "#ff00ff",
            stroke: "#000000",
            strokeThickness: 3
        }).setOrigin(1, 0).setDepth(10);
    }

    updateHUD() {
        this.timeText.setText(`${this.lblTime}: ${this.survivalTime}s`);
        this.hpText.setText(`HP: ${this.playerHP}/${this.maxHP}`);
        this.killCountText.setText(`Kills: ${this.bacteriaKillCount}`); // ✅ Update kill count
        this.dnaText.setText(`DNA: ${this.dna}`);

        if (this.playerHP <= 150) this.hpText.setColor('#ff4444');
        else if (this.playerHP <= 300) this.hpText.setColor('#ffff00');
        else this.hpText.setColor('#00ff00');
    }

    update() {
        if (this.isPaused || this.isGameOver) return;

        // ==========================================
        // ✅ 1. POINTER FOLLOW MOVEMENT (mouse + touch)
        // ==========================================
        if (this.targetX !== null && this.targetY !== null && this.player && this.player.body) {
            const dx = this.targetX - this.player.x;
            const dy = this.targetY - this.player.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance > this.deadZone) {
                const speed = Math.min(distance * this.followSpeed, this.maxFollowSpeed);
                const vx = (dx / distance) * speed;
                const vy = (dy / distance) * speed;
                this.player.setVelocity(vx, vy);

                if (dx > 10) this.player.setFlipX(false);
                else if (dx < -10) this.player.setFlipX(true);
            } else {
                this.player.setVelocity(0, 0);
            }
        }

        // ==========================================
        // ✅ 2. UPDATE TAMENG (3 LAPISAN - DIPERTAHANKAN)
        // ==========================================
        if (this.shieldLevel > 0 && this.shieldGraphics) {
            this.updateShieldVisuals();
        }

        // ==========================================
        // ✅ 3. SISTEM PENEMBAKAN OTOMATIS (LANGSUNG AKTIF - TESTING)
        // ==========================================
        if (this.hasShootingUpgrade && !this.isPaused && !this.isGameOver) {
            const currentTime = this.time.now;
            if (currentTime - this.lastShootTime >= this.shootInterval) {
                this.shoot();
                this.lastShootTime = currentTime;
            }
        }

        // Cleanup peluru yang keluar layar (atas)
        this.projectiles.children.iterate((bullet) => {
            if (bullet && bullet.active && bullet.y < -50) {
                bullet.destroy();
            }
        });

        // Difficulty scaling
        this.difficultyTimer++;
        if (this.difficultyTimer % 600 === 0) {
            this.spawnEvent.delay = Math.max(300, this.spawnEvent.delay - 100);
        }
    }

    spawnObstacle() {
        if (this.isPaused || this.isGameOver) return;

        const width = this.cameras.main.width;
        const x = Phaser.Math.Between(50, width - 50);

        const randomIndex = Phaser.Math.Between(0, this.bacteriaTypes.length - 1);
        const bacteriaKey = this.bacteriaTypes[randomIndex];

        const obstacle = this.obstacles.create(x, -50, bacteriaKey);

        if (bacteriaKey === 'bakteriBulat') {
            obstacle.setScale(0.04);
        } else if (bacteriaKey === 'bakteriRantai') {
            obstacle.setScale(0.05);
        } else if (bacteriaKey === 'bacteriaSpiral') {
            obstacle.setScale(0.05);
        } else if (bacteriaKey === 'bacteriaBatang') {
            obstacle.setScale(0.04);
        } else {
            obstacle.setScale(0.8);
        }

        const fallSpeed = Phaser.Math.Between(150, 300);
        const horizontalDirection = Phaser.Math.Between(0, 1) ? 1 : -1;
        const horizontalSpeed = Phaser.Math.Between(50, 150);

        obstacle.setVelocity(horizontalDirection * horizontalSpeed, fallSpeed);
        obstacle.setAngle(Phaser.Math.Between(0, 360));

        obstacle.checkWorldBounds = true;
        obstacle.outOfBoundsKill = true;
    }

    spawnDNA() {
        if (this.isPaused || this.isGameOver) return;

        const width = this.cameras.main.width;
        const x = Phaser.Math.Between(50, width - 50);

        const dna = this.dnaItems.create(x, -50, 'dnaCoin');
        dna.setScale(0.15);
        dna.setDepth(4);
        dna.setVelocity(0, Phaser.Math.Between(100, 180));
        dna.checkWorldBounds = true;
        dna.outOfBoundsKill = true;
    }

    collectDNA(player, dna) {
        if (this.isGameOver || !dna.active) return;
        dna.destroy();
        this.dna += 10;

        // ✅ LOGIKA MILESTONE TAMENG BERLAPIS (3 LEVEL) - DIPERTAHANKAN
        if (this.dna >= this.nextShieldMilestone && this.shieldLevel < 3) {
            this.shieldLevel++;
            this.nextShieldMilestone += 20;
            this.activateShield();
        }

        this.updateHUD();
    }

    // ==========================================
    // ✅ FUNGSI TAMENG BERLAPIS (3 LAYER) - UTUH
    // ==========================================
    activateShield() {
        if (!this.shieldGraphics) {
            this.shieldGraphics = this.add.graphics().setDepth(6);
        }
        this.updateShieldVisuals();
    }

    updateShieldVisuals() {
        if (this.shieldLevel === 0 || !this.shieldGraphics || !this.player) {
            if (this.shieldGraphics) this.shieldGraphics.clear();
            return;
        }

        this.shieldGraphics.clear();
        this.shieldGraphics.x = this.player.x;
        this.shieldGraphics.y = this.player.y;

        // --- TAMENG 1 (DALAM - CYAN) ---
        this.shieldGraphics.fillStyle(0x00ffff, 0.15);
        this.shieldGraphics.fillCircle(0, 0, 55);
        this.shieldGraphics.lineStyle(3, 0x00ffff, 0.8);
        this.shieldGraphics.strokeCircle(0, 0, 55);

        // --- TAMENG 2 (TENGAH - KUNING PUCAT) ---
        if (this.shieldLevel >= 2) {
            this.shieldGraphics.fillStyle(0xffffaa, 0.15);
            this.shieldGraphics.fillCircle(0, 0, 75);
            this.shieldGraphics.lineStyle(3, 0xffff00, 0.8);
            this.shieldGraphics.strokeCircle(0, 0, 75);
        }

        // --- TAMENG 3 (LUAR - HIJAU TERANG) ---
        if (this.shieldLevel === 3) {
            this.shieldGraphics.fillStyle(0x00ff00, 0.15);
            this.shieldGraphics.fillCircle(0, 0, 95);
            this.shieldGraphics.lineStyle(3, 0x00ff00, 0.9);
            this.shieldGraphics.strokeCircle(0, 0, 95);
        }

        this.shieldGraphics.rotation += 0.03;
    }

    breakShieldLayer() {
        this.shieldLevel--;
        this.updateShieldVisuals();
    }
    // ==========================================

    // ==========================================
    // ✅ FUNGSI PENEMBAKAN + UPGRADE 3 TIER (SILENT)
    // ==========================================
    shoot() {
        const bullet = this.projectiles.create(this.player.x, this.player.y - 30, 'bulletYellowGreen');
        bullet.setDepth(4);
        bullet.setVelocityY(-500);

        this.time.delayedCall(3000, () => {
            if (bullet.active) bullet.destroy();
        });
    }

    hitObstacleWithBullet(bullet, obstacle) {
        if (!bullet.active || !obstacle.active) return;

        bullet.destroy();
        obstacle.destroy();

        // ==========================================
        // ✅ INCREMENT KILL COUNTER (ditampilkan di HUD)
        // ==========================================
        this.bacteriaKillCount++;
        this.updateHUD(); // Update teks "Kills: X" di HUD

        // ==========================================
        // ✅ LOGIKA UPGRADE TIER TEMBAK (SILENT, TANPA TEKS)
        //    Tier 1 (1000ms) → butuh 2 kill → Tier 2 (500ms)
        //    Tier 2 (500ms)  → butuh 3 kill → Tier 3 (300ms)
        //    Tier 3 (300ms)  → MAX, tidak naik lagi
        // ==========================================
        this.killsInCurrentTier++;

        // Cek apakah masih ada tier berikutnya yang bisa dinaikkan
        if (this.shootTierIndex < this.shootTiers.length - 1) {
            const killsNeeded = this.killsNeededForNextTier[this.shootTierIndex];

            if (this.killsInCurrentTier >= killsNeeded) {
                // Naik tier
                this.shootTierIndex++;
                this.shootInterval = this.shootTiers[this.shootTierIndex];
                this.killsInCurrentTier = 0; // Reset counter untuk tier berikutnya
            }
        }
        // Jika sudah di tier terakhir (Tier 3), counter tetap bertambah tapi tidak ada efek
    }
    // ==========================================

    hitObstacle(player, obstacle) {
        if (this.isGameOver || this.isPaused || !obstacle.active) return;

        if (this.shieldLevel > 0) {
            this.breakShieldLayer();
            obstacle.destroy();
            return;
        }

        this.playerHP = Math.max(0, this.playerHP - 1);
        obstacle.destroy();
        this.updateHUD();

        player.setTint(0xff0000);
        this.time.delayedCall(200, () => {
            if (player.active) player.clearTint();
        });

        if (this.playerHP <= 0) {
            this.showContinueScreen();
        }
    }

    showContinueScreen() {
        this.isGameOver = true;
        this.physics.pause();
        this.spawnEvent.paused = true;
        this.dnaSpawnEvent.paused = true;
        this.timerEvent.paused = true;

        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        this.gameOverMenu = this.add.container(0, 0).setDepth(600);

        const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.75);
        overlay.setInteractive();
        this.gameOverMenu.add(overlay);

        const cardRock = this.add.image(width / 2, height / 2, "cardRock");
        cardRock.setDisplaySize(860, 420);
        this.gameOverMenu.add(cardRock);

        const title = this.add.text(width / 2, height / 2 - 100, getLang('dodgerGameOver'), {
            font: "bold 48px Arial",
            fill: "#ff0000",
            stroke: "#000000",
            strokeThickness: 6
        }).setOrigin(0.5);
        this.gameOverMenu.add(title);

        // ✅ Tambahkan kill count di stats game over
        const stats = this.add.text(width / 2, height / 2 - 40,
            `${this.lblTime}: ${this.survivalTime}s   |   DNA: ${this.dna}   |   Kills: ${this.bacteriaKillCount}`, {
            font: "bold 26px Arial",
            fill: "#ffffff",
            stroke: "#000000",
            strokeThickness: 4
        }).setOrigin(0.5);
        this.gameOverMenu.add(stats);

        const resumeBtn = this.add.image(width / 2, height / 2 + 40, "resume-btn");
        resumeBtn.setDisplaySize(280, 80);
        resumeBtn.setInteractive({ useHandCursor: true });
        resumeBtn.on("pointerover", () => resumeBtn.setDisplaySize(300, 86));
        resumeBtn.on("pointerout", () => resumeBtn.setDisplaySize(280, 80));
        resumeBtn.on("pointerdown", () => this.doContinue());
        this.gameOverMenu.add(resumeBtn);

        const exitBtn = this.add.image(width / 2, height / 2 + 130, "exit-btn");
        exitBtn.setDisplaySize(280, 80);
        exitBtn.setInteractive({ useHandCursor: true });
        exitBtn.on("pointerover", () => exitBtn.setDisplaySize(300, 86));
        exitBtn.on("pointerout", () => exitBtn.setDisplaySize(280, 80));
        exitBtn.on("pointerdown", () => {
            this.resetKillCount(); // ✅ Reset kill count sebelum keluar
            this.scene.start("MenuScene");
        });
        this.gameOverMenu.add(exitBtn);

        const hint = this.add.text(width / 2, height / 2 + 190, this.lblQuitHint, {
            font: "16px Arial",
            fill: "#aaaaaa",
            stroke: "#000000",
            strokeThickness: 2
        }).setOrigin(0.5);
        this.gameOverMenu.add(hint);
    }

    doContinue() {
        // ✅ Reset tameng saat continue
        this.shieldLevel = 0;
        if (this.shieldGraphics) {
            this.shieldGraphics.destroy();
            this.shieldGraphics = null;
        }

        // ✅ Reset sistem tembakan ke Tier 1 (1 detik) untuk testing ulang
        this.shootTierIndex = 0;
        this.shootInterval = 1000;
        this.killsInCurrentTier = 0;

        // ✅ HP penuh lagi, TAPI waktu, DNA, dan KILL COUNT TIDAK reset
        //    (kill count tetap terkumpul sesuai permintaan)
        this.playerHP = this.maxHP;
        this.isGameOver = false;

        if (this.gameOverMenu) {
            this.gameOverMenu.destroy();
            this.gameOverMenu = null;
        }

        this.physics.resume();
        this.spawnEvent.paused = false;
        this.dnaSpawnEvent.paused = false;
        this.timerEvent.paused = false;

        this.updateHUD();
    }

    // ==========================================
    // ✅ FUNGSI RESET KILL COUNT (dipanggil saat Exit)
    // ==========================================
    resetKillCount() {
        this.bacteriaKillCount = 0;
        this.updateHUD();
    }
    // ==========================================

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
        overlay.setInteractive();
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
            this.resetKillCount(); // ✅ Reset kill count sebelum keluar
            this.scene.start("MenuScene");
        });
        this.pauseMenu.add(this.exitBtn);
    }

    togglePause() {
        if (this.isGameOver) return;
        this.isPaused = !this.isPaused;

        if (this.isPaused) {
            this.physics.pause();
            this.spawnEvent.paused = true;
            this.dnaSpawnEvent.paused = true;
            this.timerEvent.paused = true;
            this.pauseMenu.setVisible(true);
            this.pauseBtn.setVisible(false);
        } else {
            this.physics.resume();
            this.spawnEvent.paused = false;
            this.dnaSpawnEvent.paused = false;
            this.timerEvent.paused = false;
            this.pauseMenu.setVisible(false);
            this.pauseBtn.setVisible(true);
        }
    }

    createFullscreenButton(width, height) {
        if (!fullscreenManager.supportsFullscreen) return;

        const btnX = width - 180;
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