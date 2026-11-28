/*
 * ═══════════════════════════════════════════════════════════════
 *  EVOCELL — CELL DODGER (Misi 3 · Prokaryotic)
 *  js/scenes/cell-dodger-scene.js
 * ═══════════════════════════════════════════════════════════════
 *
 *  🎮 GAMEPLAY
 *  • Gerak      : Pointer follow (mouse + touch). TANPA WASD/joystick.
 *  • Mode       : Endless survival. maxHP = 500, playerHP = 500 (asli).
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
 *  🔫 PROGRESI TEMBAKAN PLAYER (5 SISTEM)
 *  DNA  80            →  Tembakan 1 : 1 peluru lurus ke atas (tier: 1.0s → 0.5s → 0.3s)
 *  DNA 250 + 25 kill  →  Tembakan 2 : 2 peluru diagonal / 2.5s
 *  DNA 250 + 35 kill  →  Tembakan 3 : 2 peluru diagonal / 1.5s
 *  DNA 250 + 60 kill  →  Tembakan 4 : 4 peluru fan-spread / 1.0s
 *  DNA 250 + 90 kill  →  Tembakan 5 : 1 peluru kuning lurus / 0.5s (BARU)
 *
 *  🛡️ TAMENG BAKTERI MUSUH (BERLAPIS, MERAH TERANG)
 *  • Peluang: 20% 1 lapis, 10% 2 lapis, 4% 3 lapis, 66% tanpa tameng.
 *  • Visual : Outline MERAH TERANG. Lapis luar = lingkaran lebih besar.
 *  • Mekanik: Tiap tembakan hancurkan 1 lapis, bakteri TETAP HIDUP.
 *             Bakteri mati hanya setelah semua lapis habis + 1 tembakan lagi.
 *
 *  💀 KILL COUNTER
 *  • Naik HANYA saat bakteri benar-benar mati (bukan saat tameng pecah).
 *  • Duplikat boss mati = +5 kill count (setara 5 musuh biasa).
 *  • RESUME : kill TETAP terkumpul.
 *  • EXIT   : kill RESET ke 0.
 *
 *  ⏸️ PAUSE
 *  • Tombol pause (kanan atas) + ESC + P.
 *
 *  🗂️ STATUS ARSIP — BOSS FIGHT (MIMIVIRUS)
 *  • Mimivirus (Boss 1) DIARSIPKAN sebagai template multi-boss.
 *    - Class MimivirusBoss & VirusDuplicate: UTUH (tidak diubah).
 *    - Fungsi spawnMimivirusBoss / checkBossCollision / spawnVirusDuplicate /
 *      checkVirusCollision / endBossFight: UTUH (tidak diubah).
 *    - TRIGGER SPAWN: DIKOMENTARI di hitObstacleWithBullet() → boss tidak
 *      muncul otomatis. Game jadi endless murni tanpa boss.
 *    - Trigger DNA >= 100: sudah dikomentari sejak iterasi sebelumnya.
 *    - Akan di-uncomment saat sistem multi-boss (Boss 2-4) siap dirakit.
 *
 *  👹 BOSS FIGHT — MIMIVIRUS (DIARSIPKAN, referensi mekanik)
 *  • Muncul saat player membunuh 2 musuh bakteri (testing mode).
 *  • Spawn dari atas layar (y = -150), BERGERAK TURUN via TWEEN ke atas tengah
 *    (y = 180), lalu mulai PATROL RANDOM di zona atas.
 *  • 🌀 PATROL: boss bergerak acak HANYA di zona atas layar (Y ~90–340,
 *    X 120–width-120). TIDAK PERNAH turun ke area sel player di bawah.
 *  • 🧬 DUPLIKASI REGULER: Setiap 1.2 detik, boss meninggalkan 1 virus mini.
 *    Virus duplikat punya 2 FASE: IDLE (2 detik) → DASH (kecepatan ~500 px/detik).
 *    ❤️ Duplikat punya 3 HP → butuh 3 tembakan untuk mati.
 *    💥 FEEDBACK: kedip putih tiap kena tembakan; tint jadi MERAH saat HP kritis (<=1).
 *    ⚠️ Tabrakan ke player = duplikat MELEDAK (mati total + -1 HP player).
 *    🏆 KILL REWARD: Duplikat yang mati = +5 kill count (setara 5 musuh biasa).
 *    Maksimal 15 duplikat di layar (anti-lag). Auto-destroy 8 detik.
 *  • 😡 ENRAGE (MENGAMUK): Saat HP boss mencapai 15, boss langsung mengeluarkan
 *    2 virus duplikat SECARA BERSAMAAN (dengan sedikit offset posisi).
 *    Trigger ini hanya terjadi 1 kali per fight.
 *  • 📉 FASE BOSS AKTIF: Saat boss aktif, spawn bakteri biasa DITURUNKAN DRASTIS
 *    (hanya ~15% peluang spawn) → arena jadi fokus boss fight.
 *  • ❤️ Boss punya 50 HP → butuh 50 tembakan untuk mati.
 *  • 💥 EFEK DAMAGE: Setiap kali kena tembakan, boss berkedip MERAH TERANG.
 *  • 🔄 Musuh & DNA TETAP spawn normal selama boss fight (arena TIDAK dikosongkan).
 *  • ⚠️ Key texture = 'bossMimivirus' (WAJIB sama dgn boot-scene.js, BUKAN 'mimivirus').
 *
 *  📏 HIERARKI UKURAN BOSS (mengikuti sains dunia nyata):
 *    Mimivirus        → 0.4  (paling kecil) — DIARSIPKAN (template Boss 1)
 *    Thiomargarita    → 0.8  (Boss 2 — akan dibuat)
 *    Pandoravirus     → 1.0  (Boss 3 — akan dibuat)
 *    Epulo            → 1.5  (paling besar) — (Boss 4 — akan dibuat)
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
        this.playerHP = 500;
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
        //    DIUBAH: DNA 250 + 60 kill (dari 300 + 300)
        // ==========================================
        this.hasQuadShotUpgrade = false;
        this.quadShotUnlockDNA = 250;
        this.quadShotUnlockKills = 60;
        this.lastQuadShotTime = 0;
        this.quadShotInterval = 1000;

        // ==========================================
        // ✅ VARIABEL PENEMBAKAN KE-5 (BARU: 1 PELURU KUNING LURUS, 0.5s)
        //    Syarat: DNA 250 + 90 kill
        // ==========================================
        this.hasPentaShotUpgrade = false;
        this.pentaShotUnlockDNA = 250;
        this.pentaShotUnlockKills = 90;
        this.lastPentaShotTime = 0;
        this.pentaShotInterval = 500; // 0.5 detik

        // ==========================================
        // ✅ KILL COUNTER
        // ==========================================
        this.bacteriaKillCount = 0;

        // ==========================================
        // 🗂️ BOSS FIGHT — MIMIVIRUS (DIARSIPKAN)
        //    Semua variabel tetap ada (tidak dihapus) sebagai template Boss 1.
        //    Trigger spawn dikomentari di hitObstacleWithBullet() → boss tidak
        //    muncul otomatis. Akan di-uncomment saat multi-boss siap.
        // ==========================================
        this.bossKillThreshold = 2;        // 🗂️ DIARSIPKAN (template Boss 1)
        this.bossSpawned = false;          // 🗂️ DIARSIPKAN
        this.boss = null;                  // 🗂️ DIARSIPKAN
        this.virusDuplicates = [];         // 🗂️ DIARSIPKAN
        this.lastVirusSpawnTime = 0;       // 🗂️ DIARSIPKAN
        this.virusSpawnInterval = 1200;    // 🗂️ DIARSIPKAN
        this.maxVirusDuplicates = 15;      // 🗂️ DIARSIPKAN
        this.bossEnrageTriggered = false;  // 🗂️ DIARSIPKAN
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

        const bulletGraphics = this.add.graphics();
        bulletGraphics.lineStyle(3, 0x00ff00, 1);
        bulletGraphics.fillStyle(0xffff00, 1);
        bulletGraphics.fillCircle(10, 10, 10);
        bulletGraphics.strokeCircle(10, 10, 10);
        bulletGraphics.generateTexture('bulletYellowGreen', 20, 20);
        bulletGraphics.destroy();

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
        // ✅ BARU: Cek unlock tembakan ke-5
        if (this.dna >= this.pentaShotUnlockDNA && this.bacteriaKillCount >= this.pentaShotUnlockKills && !this.hasPentaShotUpgrade) {
            this.hasPentaShotUpgrade = true;
        }

        // ==========================================
        // ✅ 5. SISTEM PENEMBAKAN (5 TIPE)
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
        // ✅ BARU: Sistem tembakan ke-5 (peluru kuning lurus, 0.5s)
        if (this.hasPentaShotUpgrade && !this.isPaused && !this.isGameOver) {
            const currentTime = this.time.now;
            if (currentTime - this.lastPentaShotTime >= this.pentaShotInterval) {
                this.shootPenta();
                this.lastPentaShotTime = currentTime;
            }
        }

        // Cleanup peluru yang keluar layar
        const camW = this.cameras.main.width;
        this.projectiles.children.iterate((bullet) => {
            if (bullet && bullet.active && (bullet.y < -50 || bullet.x < -50 || bullet.x > camW + 50)) {
                bullet.destroy();
            }
        });

        // ==========================================
        // ✅ 6. BOSS FIGHT — CEK PELURU MENGENA BOSS
        //    🗂️ DIARSIPKAN: fungsi tetap dipanggil, tapi karena this.boss
        //    selalu null (trigger dikomentari), cek ini langsung return.
        // ==========================================
        this.checkBossCollision();

        // ==========================================
        // ✅ 7. BOSS FIGHT — DUPLIKASI VIRUS (setiap 1.2 detik)
        //    🗂️ DIARSIPKAN: sama, this.boss null → langsung return.
        // ==========================================
        this.spawnVirusDuplicate();

        // ==========================================
        // ✅ 8. BOSS FIGHT — CEK TABRAKAN PLAYER vs VIRUS DUPLIKAT
        //    🗂️ DIARSIPKAN: virusDuplicates selalu kosong → langsung return.
        // ==========================================
        this.checkVirusCollision();

        // Difficulty scaling
        this.difficultyTimer++;
        if (this.difficultyTimer % 600 === 0) {
            this.spawnEvent.delay = Math.max(300, this.spawnEvent.delay - 100);
        }
    }

    spawnObstacle() {
        if (this.isPaused || this.isGameOver) return;

        // 📉 FASE BOSS AKTIF: Spawn bakteri biasa DITURUNKAN DRASTIS
        //    🗂️ DIARSIPKAN: logic tetap ada, tapi tidak aktif (this.boss null).
        if (this.boss && this.boss.active) {
            if (Math.random() > 0.15) {
                return; // 85% chance skip spawn bakteri biasa
            }
        }

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

        const roll = Math.random();
        if (roll < 0.20) {
            obstacle.shieldHP = 1;
        } else if (roll < 0.30) {
            obstacle.shieldHP = 2;
        } else if (roll < 0.34) {
            obstacle.shieldHP = 3;
        } else {
            obstacle.shieldHP = 0;
        }

        if (obstacle.shieldHP > 0) {
            obstacle.shieldGraphic = this.add.graphics();
            obstacle.shieldGraphic.setDepth(obstacle.depth);
            this.drawEnemyShield(obstacle);

            obstacle.on('destroy', () => {
                if (obstacle.shieldGraphic) {
                    obstacle.shieldGraphic.destroy();
                    obstacle.shieldGraphic = null;
                }
            });
        }
    }

    drawEnemyShield(obstacle) {
        if (!obstacle.shieldGraphic) return;

        obstacle.shieldGraphic.clear();

        const innerRadius = (obstacle.width / 2) * obstacle.scaleX + 8;

        if (obstacle.shieldHP >= 1) {
            obstacle.shieldGraphic.lineStyle(3, 0xff0000, 1.0);
            obstacle.shieldGraphic.strokeCircle(0, 0, innerRadius);
        }

        if (obstacle.shieldHP >= 2) {
            obstacle.shieldGraphic.lineStyle(3, 0xff0000, 0.75);
            obstacle.shieldGraphic.strokeCircle(0, 0, innerRadius + 12);
        }

        if (obstacle.shieldHP >= 3) {
            obstacle.shieldGraphic.lineStyle(3, 0xff0000, 0.5);
            obstacle.shieldGraphic.strokeCircle(0, 0, innerRadius + 24);
        }
    }

    // 🗂️ DIARSIPKAN — fungsi tetap utuh sebagai template Boss 1.
    //    Akan dipanggil lagi saat trigger di-uncomment.
    spawnMimivirusBoss() {
        if (this.bossSpawned) return;
        this.bossSpawned = true;

        const width = this.cameras.main.width;

        this.boss = new MimivirusBoss(this, width / 2, -150, width / 2, 180);
    }

    // 🗂️ DIARSIPKAN — fungsi tetap utuh sebagai template Boss 1.
    checkBossCollision() {
        if (!this.boss || !this.boss.active) return;

        const bossRadius = (this.boss.displayWidth / 2) + 12;
        let gotHit = false;

        this.projectiles.children.iterate((bullet) => {
            if (gotHit) return;
            if (!bullet.active) return;

            const dx = bullet.x - this.boss.x;
            const dy = bullet.y - this.boss.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < bossRadius) {
                bullet.destroy();
                gotHit = true;
            }
        });

        if (gotHit) {
            this.boss.hp--;

            this.boss.setTint(0xff0000);
            this.time.delayedCall(120, () => {
                if (this.boss && this.boss.active) this.boss.clearTint();
            });

            // ✅ ENRAGE MECHANIC: Saat HP mencapai 15, spawn 2 duplikat sekaligus
            if (this.boss.hp === 15 && !this.bossEnrageTriggered) {
                this.bossEnrageTriggered = true;
                console.log('👹 BOSS FIGHT: Mimivirus ENRAGED! Spawning 2 duplicates simultaneously!');

                const dup1 = new VirusDuplicate(this, this.boss.x - 15, this.boss.y);
                const dup2 = new VirusDuplicate(this, this.boss.x + 15, this.boss.y);

                this.virusDuplicates.push(dup1, dup2);
            }

            if (this.boss.hp <= 0) {
                this.endBossFight();
            }
        }
    }

    // 🗂️ DIARSIPKAN — fungsi tetap utuh sebagai template Boss 1.
    spawnVirusDuplicate() {
        if (!this.boss || !this.boss.active || !this.boss.arrived) return;

        const currentTime = this.time.now;

        if (currentTime - this.lastVirusSpawnTime < this.virusSpawnInterval) return;
        if (this.virusDuplicates.length >= this.maxVirusDuplicates) return;

        this.lastVirusSpawnTime = currentTime;

        const duplicate = new VirusDuplicate(this, this.boss.x, this.boss.y);
        this.virusDuplicates.push(duplicate);
    }

    // 🗂️ DIARSIPKAN — fungsi tetap utuh sebagai template Boss 1.
    checkVirusCollision() {
        if (this.virusDuplicates.length === 0) return;

        const playerRadius = (this.player.displayWidth / 2);

        // ==========================================
        // ✅ TABRAKAN PLAYER vs DUPlikat
        // ==========================================
        for (let i = this.virusDuplicates.length - 1; i >= 0; i--) {
            const dup = this.virusDuplicates[i];
            if (!dup || !dup.active) {
                this.virusDuplicates.splice(i, 1);
                continue;
            }

            const dx = this.player.x - dup.x;
            const dy = this.player.y - dup.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < playerRadius + (dup.displayWidth / 2)) {
                this.playerHP = Math.max(0, this.playerHP - 1);
                this.updateHUD();

                this.player.setTint(0xff0000);
                this.time.delayedCall(200, () => {
                    if (this.player.active) this.player.clearTint();
                });

                dup.destroy();
                this.virusDuplicates.splice(i, 1);

                if (this.playerHP <= 0) {
                    this.showContinueScreen();
                }
            }
        }

        // ==========================================
        // ✅ PELURU vs DUPlikat (butuh 3 tembakan)
        // ==========================================
        this.projectiles.children.iterate((bullet) => {
            if (!bullet || !bullet.active) return;

            for (let i = this.virusDuplicates.length - 1; i >= 0; i--) {
                const dup = this.virusDuplicates[i];
                if (!dup || !dup.active) continue;

                const dx = bullet.x - dup.x;
                const dy = bullet.y - dup.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                const dupRadius = (dup.displayWidth / 2) + 8;

                if (dist < dupRadius) {
                    bullet.destroy();

                    // 💥 Kurangi 1 HP duplikat
                    dup.hp--;

                    // 💥 Feedback: kedip putih saat kena tembakan
                    dup.setTint(0xffffff);
                    this.time.delayedCall(100, () => {
                        if (dup.active) dup.refreshTint();
                    });

                    // ✅ Hancurkan hanya jika HP habis
                    if (dup.hp <= 0) {
                        dup.destroy();
                        this.virusDuplicates.splice(i, 1);

                        // 🏆 KILL REWARD: +5 kill count (setara 5 musuh biasa)
                        this.bacteriaKillCount += 5;
                        this.updateHUD();
                        console.log(`🧬 Virus duplicate destroyed! +5 kills. Total: ${this.bacteriaKillCount}`);
                    }

                    break;
                }
            }
        });
    }

    // 🗂️ DIARSIPKAN — fungsi tetap utuh sebagai template Boss 1.
    endBossFight() {
        if (this.boss) {
            this.tweens.killTweensOf(this.boss);
            this.boss.destroy();
            this.boss = null;
        }

        this.virusDuplicates.forEach(dup => {
            if (dup && dup.active) dup.destroy();
        });
        this.virusDuplicates = [];

        console.log('👹 BOSS FIGHT: Mimivirus defeated!');
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

        // ✅ BOSS FIGHT — TRIGGER SPAWN MIMIVIRUS SAAT DNA >= 100 (DIKOMENTARI)
        // if (!this.bossSpawned && this.dna >= 100) {
        //     this.spawnMimivirusBoss();
        // }

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
    // ✅ BARU: TEMBAKAN KE-5 (1 PELURU KUNING LURUS, 0.5s)
    // ==========================================
    shootPenta() {
        const bullet = this.projectiles.create(this.player.x, this.player.y - 30, 'bulletYellowGreen');
        bullet.setDepth(4);
        bullet.setVelocityY(-500);
        this.time.delayedCall(3000, () => { if (bullet.active) bullet.destroy(); });
    }

    hitObstacleWithBullet(bullet, obstacle) {
        if (!bullet.active || !obstacle.active) return;

        bullet.destroy();

        if (obstacle.shieldHP > 0) {
            obstacle.shieldHP--;
            this.drawEnemyShield(obstacle);

            obstacle.setTint(0xffffff);
            this.time.delayedCall(100, () => {
                if (obstacle.active) obstacle.clearTint();
            });

            return;
        }

        obstacle.destroy();

        this.bacteriaKillCount++;
        this.updateHUD();

        // ==========================================
        // 🗂️ DIARSIPKAN — Trigger spawn Mimivirus (Boss 1)
        //    Akan di-uncomment saat sistem multi-boss (Boss 2-4) siap dirakit.
        //    Untuk sekarang, boss TIDAK akan spawn otomatis (game endless murni).
        // ==========================================
        // if (!this.bossSpawned && this.bacteriaKillCount >= this.bossKillThreshold) {
        //     this.spawnMimivirusBoss();
        // }
        // ==========================================

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
        this.lastPentaShotTime = 0; // ✅ BARU: Reset timer tembakan ke-5

        // 🗂️ DIARSIPKAN — reset Mimivirus (tetap ada, siap dipakai saat unarchive)
        this.bossSpawned = false;
        this.bossEnrageTriggered = false;

        if (this.boss) {
            this.tweens.killTweensOf(this.boss);
            this.boss.destroy();
            this.boss = null;
        }

        this.virusDuplicates.forEach(dup => {
            if (dup && dup.active) dup.destroy();
        });
        this.virusDuplicates = [];
        this.lastVirusSpawnTime = 0;

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

// =================================================================
// 🗂️ BOSS FIGHT — CLASS MIMIVIRUS (DIARSIPKAN sebagai template Boss 1)
// =================================================================
// Class ini UTUH — tidak diubah, tidak dihapus.
// Akan jadi template untuk Boss 2, 3, 4 nanti.
// Trigger spawn dikomentari di hitObstacleWithBullet().
// =================================================================
class MimivirusBoss extends Phaser.GameObjects.Image {
    constructor(scene, startX, startY, targetX, targetY) {
        super(scene, startX, startY, 'bossMimivirus');
        scene.add.existing(this);

        this.targetX = targetX;
        this.targetY = targetY;
        this.arrived = false;

        // ❤️ HP BOSS = 50 (butuh 50 tembakan untuk mati)
        this.hp = 50;
        this.maxHp = 50;

        this.patrolSpeed = 260;
        this.patrolMinX = 120;
        this.patrolMinY = 90;
        this.patrolMaxY = 340;

        this.setScale(0.4);
        this.setDepth(20);

        scene.tweens.add({
            targets: this,
            y: this.targetY,
            x: this.targetX,
            duration: 1500,
            ease: 'Sine.easeInOut',
            onComplete: () => {
                this.arrived = true;
                console.log('👹 BOSS FIGHT: Mimivirus arrived → mulai patrol');
                this.patrolMove();
            }
        });

        console.log('👹 BOSS FIGHT: Mimivirus spawned!');
    }

    patrolMove() {
        if (!this.active) return;

        const camW = this.scene.cameras.main.width;
        const camH = this.scene.cameras.main.height;

        const minX = this.patrolMinX;
        const maxX = camW - this.patrolMinX;
        const minY = this.patrolMinY;
        const maxY = Math.min(this.patrolMaxY, camH * 0.45);

        const nextX = Phaser.Math.Between(minX, maxX);
        const nextY = Phaser.Math.Between(minY, maxY);

        const dx = nextX - this.x;
        const dy = nextY - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const duration = Math.max(400, (dist / this.patrolSpeed) * 1000);

        this.scene.tweens.add({
            targets: this,
            x: nextX,
            y: nextY,
            duration: duration,
            ease: 'Sine.easeInOut',
            onComplete: () => {
                if (this.active) this.patrolMove();
            }
        });
    }
}
// =================================================================

// =================================================================
// 🗂️ BOSS FIGHT — CLASS VIRUS DUPLICATE (IDLE → DASH · 3 HP)
// =================================================================
// Class ini UTUH — tidak diubah, tidak dihapus.
// Akan jadi template minion untuk Boss 2, 3, 4 nanti.
// =================================================================
class VirusDuplicate extends Phaser.GameObjects.Image {
    constructor(scene, x, y) {
        super(scene, x, y, 'bossMimivirus');
        scene.add.existing(this);

        // ❤️ HP = 3 (butuh 3 tembakan untuk mati) — DIUBAH dari 6
        this.hp = 3;
        this.maxHp = 3;

        this.state = 'idle';
        this.idleDuration = 2000;
        this.dashSpeed = 500;

        this.setScale(0.2);
        this.setDepth(15);
        this.refreshTint();

        this.setAlpha(0);
        scene.tweens.add({
            targets: this,
            alpha: 1,
            duration: 300,
            ease: 'Power2'
        });

        this.idleTimer = scene.time.delayedCall(this.idleDuration, () => {
            if (this.active) {
                this.startDash();
            }
        });

        this.lifetimeTimer = scene.time.delayedCall(8000, () => {
            if (this.active) {
                this.destroy();
            }
        });
    }

    refreshTint() {
        if (!this.active) return;

        if (this.hp <= 1) {
            this.setTint(0xff4444);   // 🩸 kritis → merah (HP <= 1)
        } else if (this.state === 'dashing') {
            this.setTint(0xff44ff);   // ⚡ dash → ungu terang
        } else {
            this.setTint(0x8844ff);   // 💤 idle → ungu pudar
        }
    }

    startDash() {
        if (!this.active) return;

        this.state = 'dashing';
        this.refreshTint();

        this.scene.tweens.killTweensOf(this);

        const player = this.scene.player;
        if (!player || !player.active) return;

        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 1) {
            this.destroy();
            return;
        }

        const ndx = dx / dist;
        const ndy = dy / dist;

        const dashDistance = Math.max(1500, dist * 2);
        const targetX = this.x + ndx * dashDistance;
        const targetY = this.y + ndy * dashDistance;

        const duration = (dashDistance / this.dashSpeed) * 1000;

        this.scene.tweens.add({
            targets: this,
            x: targetX,
            y: targetY,
            duration: duration,
            ease: 'Linear',
            onComplete: () => {
                if (this.active) {
                    this.destroy();
                }
            }
        });

        if (this.lifetimeTimer) {
            this.lifetimeTimer.remove();
            this.lifetimeTimer = null;
        }
    }

    destroy() {
        if (this.idleTimer) {
            this.idleTimer.remove();
            this.idleTimer = null;
        }
        if (this.lifetimeTimer) {
            this.lifetimeTimer.remove();
            this.lifetimeTimer = null;
        }
        super.destroy();
    }
}
// =================================================================