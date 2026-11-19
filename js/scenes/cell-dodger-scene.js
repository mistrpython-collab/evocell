/*
 * ═══════════════════════════════════════════════════════════════
 *  EVOCELL — CELL DODGER (Misi 3 · Prokaryotic)
 *  js/scenes/cell-dodger-scene.js
 * ═══════════════════════════════════════════════════════════════
 *
 *  🎮 GAMEPLAY
 *  • Gerak      : Pointer follow (mouse + touch). TANPA WASD/joystick.
 *  • Mode       : Endless survival. maxHP = 500, playerHP awal = 5 (test).
 *  • Musuh      : 5 jenis bakteri jatuh dari atas.
 *                 66% tanpa tameng · 20% tameng 1 lapis ·
 *                 10% tameng 2 lapis · 4% tameng 3 lapis.
 *  • Pickup     : DNA coin, +10 per koin.
 *  • Damage     : 1 HP per tabrakan (jika tameng player habis).
 *
 *  🛡️ PROGRESI TAMENG PLAYER (4 LAPISAN)
 *  DNA  20  →  Tameng 1 : Cyan          (1 HP)
 *  DNA  40  →  Tameng 2 : Kuning pucat  (1 HP)
 *  DNA  60  →  Tameng 3 : Hijau terang  (1 HP)
 *  DNA 100  →  Tameng 4 : UNGU TERANG   (2 HP)
 *
 *  🔫 PROGRESI TEMBAKAN PLAYER (4 SISTEM)
 *  DNA  80            →  Tembakan 1 : 1 peluru lurus ke atas
 *  DNA 250 + 25 kill  →  Tembakan 2 : 2 peluru diagonal / 2.5s
 *  DNA 250 + 35 kill  →  Tembakan 3 : 2 peluru diagonal / 1.5s
 *  DNA 300 + 300 kill →  Tembakan 4 : 4 peluru fan-spread / 1.0s
 *
 *  🛡️ TAMENG BAKTERI MUSUH (BERLAPIS, MERAH TERANG)
 *  • Peluang: 20% 1 lapis, 10% 2 lapis, 4% 3 lapis, 66% tanpa tameng.
 *  • Visual : Outline MERAH TERANG. Lapis luar = lingkaran lebih besar.
 *  • Mekanik: Tiap tembakan hancurkan 1 lapis, bakteri TETAP HIDUP.
 *             Bakteri mati hanya setelah semua lapis habis + 1 tembakan lagi.
 *
 *  💀 KILL COUNTER
 *  • Naik HANYA saat bakteri benar-benar mati (bukan saat tameng pecah).
 *  • RESUME : kill TETAP terkumpul.
 *  • EXIT   : kill RESET ke 0.
 *
 *  ⏸️ PAUSE
 *  • Tombol pause (kanan atas) + ESC + P.
 * ═══════════════════════════════════════════════════════════════
 */

import { fullscreenManager } from '../utils/fullscreen.js';
import { getLang, getCurrentLang } from '../utils/translations.js';

export default class CellDodgerScene extends Phaser.Scene {
    constructor() {
        super("CellDodgerScene");
        this.fullscreenBtn = null;
    }

    init(data) {
        // ✅ KONFIGURASI ENDLESS MODE
        this.maxHP = 500;
        this.playerHP = 5;
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

        // ==========================================
        // ✅ VARIABEL TAMENG BERLAPIS PLAYER (4 LEVEL)
        // ==========================================
        this.shieldLevel = 0;
        this.shieldGraphics = null;
        this.nextShieldMilestone = 20;
        this.shield4HP = 0;

        // ✅ POINTER FOLLOW (mouse + touch)
        this.targetX = null;
        this.targetY = null;
        this.followSpeed = 8;
        this.maxFollowSpeed = 400;
        this.deadZone = 5;

        // ==========================================
        // ✅ VARIABEL PENEMBAKAN UTAMA (1 ARAH KE ATAS)
        // ==========================================
        this.hasShootingUpgrade = false;
        this.shootUnlockDNA = 80;
        this.lastShootTime = 0;
        this.shootTiers = [1000, 500, 300];
        this.shootTierIndex = 0;
        this.shootInterval = 1000;
        this.killsInCurrentTier = 0;
        this.killsNeededForNextTier = [2, 3];

        // ==========================================
        // ✅ VARIABEL PENEMBAKAN KE-2 (DUA ARAH DIAGONAL)
        // ==========================================
        this.hasDualShotUpgrade = false;
        this.dualShotUnlockDNA = 250;
        this.dualShotUnlockKills = 25;
        this.lastDualShotTime = 0;
        this.dualShotInterval = 2500;

        // ==========================================
        // ✅ VARIABEL PENEMBAKAN KE-3 (DUA ARAH DIAGONAL, LEBIH CEPAT)
        // ==========================================
        this.hasAdvancedShotUpgrade = false;
        this.advancedShotUnlockDNA = 250;
        this.advancedShotUnlockKills = 35;
        this.lastAdvancedShotTime = 0;
        this.advancedShotInterval = 1500;

        // ==========================================
        // ✅ VARIABEL PENEMBAKAN KE-4 (EMPAT ARAH DIAGONAL LEBAR)
        // ==========================================
        this.hasQuadShotUpgrade = false;
        this.quadShotUnlockDNA = 300;
        this.quadShotUnlockKills = 300;
        this.lastQuadShotTime = 0;
        this.quadShotInterval = 1000;

        // ==========================================
        // ✅ KILL COUNTER
        // ==========================================
        this.bacteriaKillCount = 0;
    }

    create(data){
        const mainMenuMusic = this.sound.get('mainMenuMusic');
        if (mainMenuMusic) {
            mainMenuMusic.stop();
        }
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        const bg = this.add.image(width / 2, height / 2, "bgGameplay");
        bg.setAngle(-90);
        bg.setScale(1.8);
        bg.setDepth(-1);

        this.player = this.physics.add.sprite(width / 2, height - 100, "prokaryotic");
        this.player.setScale(2);
        this.player.setCollideWorldBounds(true);
        this.player.setDepth(5);

        this.targetX = this.player.x;
        this.targetY = this.player.y;

        this.bacteriaTypes = [
            'bacteria',
            'bacteriaBatang',
            'bacteriaSpiral',
            'bakteriRantai',
            'bakteriBulat'
        ];

        this.obstacles = this.physics.add.group();
        this.dnaItems = this.physics.add.group();
        this.projectiles = this.physics.add.group();

        // ✅ TEKSTUR PELURU UTAMA (Kuning outline Hijau)
        const bulletGraphics = this.add.graphics();
        bulletGraphics.lineStyle(3, 0x00ff00, 1);
        bulletGraphics.fillStyle(0xffff00, 1);
        bulletGraphics.fillCircle(10, 10, 10);
        bulletGraphics.strokeCircle(10, 10, 10);
        bulletGraphics.generateTexture('bulletYellowGreen', 20, 20);
        bulletGraphics.destroy();

        // ✅ TEKSTUR PELURU KE-2, KE-3 & KE-4 (Cyan outline Biru)
        const dualGraphics = this.add.graphics();
        dualGraphics.lineStyle(3, 0x0066ff, 1);
        dualGraphics.fillStyle(0x00ffff, 1);
        dualGraphics.fillCircle(10, 10, 10);
        dualGraphics.strokeCircle(10, 10, 10);
        dualGraphics.generateTexture('bulletCyanBlue', 20, 20);
        dualGraphics.destroy();

        this.spawnEvent = this.time.addEvent({
            delay: 800,
            callback: this.spawnObstacle,
            callbackScope: this,
            loop: true
        });

        this.dnaSpawnEvent = this.time.addEvent({
            delay: 3000,
            callback: this.spawnDNA,
            callbackScope: this,
            loop: true
        });

        this.timerEvent = this.time.addEvent({
            delay: 1000,
            callback: () => {
                this.survivalTime++;
                this.updateHUD();
            },
            callbackScope: this,
            loop: true
        });

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

        // ✅ ESC dan P untuk pause
        this.input.keyboard.on('keydown-ESC', () => this.togglePause());
        this.input.keyboard.on('keydown-P', () => this.togglePause());

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

        this.createHUD();
        this.createPauseButton();
        this.createPauseMenu();

        this.physics.add.overlap(this.player, this.obstacles, this.hitObstacle, null, this);
        this.physics.add.overlap(this.player, this.dnaItems, this.collectDNA, null, this);
        this.physics.add.overlap(this.projectiles, this.obstacles, this.hitObstacleWithBullet, null, this);

        this.isPaused = false;
        this.score = 0;
        this.difficultyTimer = 0;

        this.createFullscreenButton(width, height);
    }

    createHUD() {
        const width = this.cameras.main.width;

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

        this.killCountText = this.add.text(30, 94, `Kills: 0`, {
            font: "bold 22px Arial",
            fill: "#ff6600",
            stroke: "#000000",
            strokeThickness: 3
        }).setDepth(10);

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
        this.killCountText.setText(`Kills: ${this.bacteriaKillCount}`);
        this.dnaText.setText(`DNA: ${this.dna}`);

        if (this.playerHP <= 150) this.hpText.setColor('#ff4444');
        else if (this.playerHP <= 300) this.hpText.setColor('#ffff00');
        else this.hpText.setColor('#00ff00');
    }

    update() {
        if (this.isPaused || this.isGameOver) return;

        // ==========================================
        // ✅ 1. POINTER FOLLOW MOVEMENT
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
        // ✅ 2. UPDATE TAMENG PLAYER (4 LAPISAN)
        // ==========================================
        if (this.shieldLevel > 0 && this.shieldGraphics) {
            this.updateShieldVisuals();
        }

        // ==========================================
        // ✅ 3. UPDATE POSISI TAMENG BAKTERI MUSUH
        // ==========================================
        this.obstacles.children.iterate((obs) => {
            if (obs && obs.active && obs.shieldHP > 0 && obs.shieldGraphic) {
                obs.shieldGraphic.x = obs.x;
                obs.shieldGraphic.y = obs.y;
            }
        });

        // ==========================================
        // ✅ 4. CEK UNLOCK TEMBAKAN (SEMUA TIER)
        // ==========================================
        if (this.dna >= this.shootUnlockDNA && !this.hasShootingUpgrade) {
            this.hasShootingUpgrade = true;
        }
        if (this.dna >= this.dualShotUnlockDNA && this.bacteriaKillCount >= this.dualShotUnlockKills && !this.hasDualShotUpgrade) {
            this.hasDualShotUpgrade = true;
        }
        if (this.dna >= this.advancedShotUnlockDNA && this.bacteriaKillCount >= this.advancedShotUnlockKills && !this.hasAdvancedShotUpgrade) {
            this.hasAdvancedShotUpgrade = true;
        }
        if (this.dna >= this.quadShotUnlockDNA && this.bacteriaKillCount >= this.quadShotUnlockKills && !this.hasQuadShotUpgrade) {
            this.hasQuadShotUpgrade = true;
        }

        // ==========================================
        // ✅ 5. SISTEM PENEMBAKAN (4 TIPE)
        // ==========================================
        if (this.hasShootingUpgrade && !this.isPaused && !this.isGameOver) {
            const currentTime = this.time.now;
            if (currentTime - this.lastShootTime >= this.shootInterval) {
                this.shoot();
                this.lastShootTime = currentTime;
            }
        }
        if (this.hasDualShotUpgrade && !this.isPaused && !this.isGameOver) {
            const currentTime = this.time.now;
            if (currentTime - this.lastDualShotTime >= this.dualShotInterval) {
                this.shootDual();
                this.lastDualShotTime = currentTime;
            }
        }
        if (this.hasAdvancedShotUpgrade && !this.isPaused && !this.isGameOver) {
            const currentTime = this.time.now;
            if (currentTime - this.lastAdvancedShotTime >= this.advancedShotInterval) {
                this.shootAdvanced();
                this.lastAdvancedShotTime = currentTime;
            }
        }
        if (this.hasQuadShotUpgrade && !this.isPaused && !this.isGameOver) {
            const currentTime = this.time.now;
            if (currentTime - this.lastQuadShotTime >= this.quadShotInterval) {
                this.shootQuad();
                this.lastQuadShotTime = currentTime;
            }
        }

        // Cleanup peluru yang keluar layar
        const camW = this.cameras.main.width;
        this.projectiles.children.iterate((bullet) => {
            if (bullet && bullet.active && (bullet.y < -50 || bullet.x < -50 || bullet.x > camW + 50)) {
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

        // ==========================================
        // ✅ LOGIKA TAMENG BAKTERI MUSUH (BERLAPIS)
        //    20% → 1 lapis | 10% → 2 lapis | 4% → 3 lapis | 66% → tanpa
        // ==========================================
        const roll = Math.random();
        if (roll < 0.20) {
            obstacle.shieldHP = 1;   // 20%
        } else if (roll < 0.30) {
            obstacle.shieldHP = 2;   // 10%
        } else if (roll < 0.34) {
            obstacle.shieldHP = 3;   // 4%
        } else {
            obstacle.shieldHP = 0;   // 66%
        }

        if (obstacle.shieldHP > 0) {
            obstacle.shieldGraphic = this.add.graphics();
            obstacle.shieldGraphic.setDepth(obstacle.depth);
            this.drawEnemyShield(obstacle);

            // ✅ Hapus graphic otomatis saat bakteri hancur (mencegah memory leak)
            obstacle.on('destroy', () => {
                if (obstacle.shieldGraphic) {
                    obstacle.shieldGraphic.destroy();
                    obstacle.shieldGraphic = null;
                }
            });
        }
    }

    // ==========================================
    // ✅ GAMBAR VISUAL TAMENG BAKTERI (1-3 LAPIS, MERAH TERANG)
    // ==========================================
    drawEnemyShield(obstacle) {
        if (!obstacle.shieldGraphic) return;

        obstacle.shieldGraphic.clear();

        // Radius dasar mengikuti ukuran sprite bakteri
        const innerRadius = (obstacle.width / 2) * obstacle.scaleX + 8;

        // --- LAPIS 1 (DALAM) ---
        if (obstacle.shieldHP >= 1) {
            obstacle.shieldGraphic.lineStyle(3, 0xff0000, 1.0);
            obstacle.shieldGraphic.strokeCircle(0, 0, innerRadius);
        }

        // --- LAPIS 2 (TENGAH) ---
        if (obstacle.shieldHP >= 2) {
            obstacle.shieldGraphic.lineStyle(3, 0xff0000, 0.75);
            obstacle.shieldGraphic.strokeCircle(0, 0, innerRadius + 12);
        }

        // --- LAPIS 3 (LUAR) ---
        if (obstacle.shieldHP >= 3) {
            obstacle.shieldGraphic.lineStyle(3, 0xff0000, 0.5);
            obstacle.shieldGraphic.strokeCircle(0, 0, innerRadius + 24);
        }
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

        if (this.dna >= this.nextShieldMilestone && this.shieldLevel < 4) {
            this.shieldLevel++;
            if (this.shieldLevel === 4) {
                this.shield4HP = 2;
            }
            if (this.shieldLevel === 3) {
                this.nextShieldMilestone = 100;
            } else {
                this.nextShieldMilestone += 20;
            }
            this.activateShield();
        }

        this.updateHUD();
    }

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

        this.shieldGraphics.fillStyle(0x00ffff, 0.15);
        this.shieldGraphics.fillCircle(0, 0, 55);
        this.shieldGraphics.lineStyle(3, 0x00ffff, 0.8);
        this.shieldGraphics.strokeCircle(0, 0, 55);

        if (this.shieldLevel >= 2) {
            this.shieldGraphics.fillStyle(0xffffaa, 0.15);
            this.shieldGraphics.fillCircle(0, 0, 75);
            this.shieldGraphics.lineStyle(3, 0xffff00, 0.8);
            this.shieldGraphics.strokeCircle(0, 0, 75);
        }

        if (this.shieldLevel >= 3) {
            this.shieldGraphics.fillStyle(0x00ff00, 0.15);
            this.shieldGraphics.fillCircle(0, 0, 95);
            this.shieldGraphics.lineStyle(3, 0x00ff00, 0.9);
            this.shieldGraphics.strokeCircle(0, 0, 95);
        }

        if (this.shieldLevel >= 4) {
            const fillAlpha = this.shield4HP === 2 ? 0.2 : 0.08;
            const lineAlpha = this.shield4HP === 2 ? 1.0 : 0.5;
            this.shieldGraphics.fillStyle(0xcc00ff, fillAlpha);
            this.shieldGraphics.fillCircle(0, 0, 115);
            this.shieldGraphics.lineStyle(4, 0xff00ff, lineAlpha);
            this.shieldGraphics.strokeCircle(0, 0, 115);
        }

        this.shieldGraphics.rotation += 0.03;
    }

    breakShieldLayer() {
        if (this.shieldLevel === 4) {
            this.shield4HP--;
            if (this.shield4HP <= 0) {
                this.shieldLevel = 3;
                this.shield4HP = 0;
            }
        } else {
            this.shieldLevel--;
        }
        this.updateShieldVisuals();
    }

    shoot() {
        const bullet = this.projectiles.create(this.player.x, this.player.y - 30, 'bulletYellowGreen');
        bullet.setDepth(4);
        bullet.setVelocityY(-500);
        this.time.delayedCall(3000, () => { if (bullet.active) bullet.destroy(); });
    }

    shootDual() {
        const speed = 500;
        const angleLeft = -Math.PI / 2 - 0.61;
        const angleRight = -Math.PI / 2 + 0.61;

        const b1 = this.projectiles.create(this.player.x, this.player.y - 20, 'bulletCyanBlue');
        b1.setDepth(4);
        b1.setVelocity(Math.cos(angleLeft) * speed, Math.sin(angleLeft) * speed);

        const b2 = this.projectiles.create(this.player.x, this.player.y - 20, 'bulletCyanBlue');
        b2.setDepth(4);
        b2.setVelocity(Math.cos(angleRight) * speed, Math.sin(angleRight) * speed);

        this.time.delayedCall(3000, () => { if (b1.active) b1.destroy(); });
        this.time.delayedCall(3000, () => { if (b2.active) b2.destroy(); });
    }

    shootAdvanced() {
        const speed = 500;
        const angleLeft = -Math.PI / 2 - 0.61;
        const angleRight = -Math.PI / 2 + 0.61;

        const b1 = this.projectiles.create(this.player.x, this.player.y - 20, 'bulletCyanBlue');
        b1.setDepth(4);
        b1.setVelocity(Math.cos(angleLeft) * speed, Math.sin(angleLeft) * speed);

        const b2 = this.projectiles.create(this.player.x, this.player.y - 20, 'bulletCyanBlue');
        b2.setDepth(4);
        b2.setVelocity(Math.cos(angleRight) * speed, Math.sin(angleRight) * speed);

        this.time.delayedCall(3000, () => { if (b1.active) b1.destroy(); });
        this.time.delayedCall(3000, () => { if (b2.active) b2.destroy(); });
    }

    shootQuad() {
        const speed = 500;
        const angles = [
            -Math.PI / 2 - 0.9,
            -Math.PI / 2 - 0.3,
            -Math.PI / 2 + 0.3,
            -Math.PI / 2 + 0.9
        ];

        angles.forEach(angle => {
            const b = this.projectiles.create(this.player.x, this.player.y - 20, 'bulletCyanBlue');
            b.setDepth(4);
            b.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
            this.time.delayedCall(3000, () => { if (b.active) b.destroy(); });
        });
    }

    // ==========================================
    // ✅ TABRAKAN PELURU → MUSUH (DENGAN LOGIKA TAMENG BERLAPIS)
    // ==========================================
    hitObstacleWithBullet(bullet, obstacle) {
        if (!bullet.active || !obstacle.active) return;

        bullet.destroy();

        // ✅ CEK APAKAH BAKTERI MASIH PUNYA TAMENG
        if (obstacle.shieldHP > 0) {
            // 1. Kurangi 1 lapis tameng
            obstacle.shieldHP--;

            // 2. Redraw visual (lapisan terluar hilang)
            this.drawEnemyShield(obstacle);

            // 3. Efek visual: Bakteri berkedip putih sesaat sebagai feedback tameng pecah
            obstacle.setTint(0xffffff);
            this.time.delayedCall(100, () => {
                if (obstacle.active) obstacle.clearTint();
            });

            // 4. Bakteri TETAP HIDUP, kill count TIDAK bertambah
            return;
        }

        // ✅ LOGIKA BIASA (TAMENG HABIS / TIDAK PUNYA TAMENG)
        obstacle.destroy();

        this.bacteriaKillCount++;
        this.updateHUD();

        this.killsInCurrentTier++;
        if (this.shootTierIndex < this.shootTiers.length - 1) {
            if (this.killsInCurrentTier >= this.killsNeededForNextTier[this.shootTierIndex]) {
                this.shootTierIndex++;
                this.shootInterval = this.shootTiers[this.shootTierIndex];
                this.killsInCurrentTier = 0;
            }
        }
    }

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
            this.resetKillCount();
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
        this.shieldLevel = 0;
        this.shield4HP = 0;
        if (this.shieldGraphics) {
            this.shieldGraphics.destroy();
            this.shieldGraphics = null;
        }

        this.shootTierIndex = 0;
        this.shootInterval = 1000;
        this.killsInCurrentTier = 0;

        this.lastDualShotTime = 0;
        this.lastAdvancedShotTime = 0;
        this.lastQuadShotTime = 0;

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

    resetKillCount() {
        this.bacteriaKillCount = 0;
        this.updateHUD();
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
            this.resetKillCount();
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