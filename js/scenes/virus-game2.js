// virus-game2.js - Virus Misi 2 (Drain 5HP/detik + BOSS 1: WBC PENEMBAK)
// Versi: VIRUS BIRU PERMANEN + DASH 1 DETIK (tembus sel saat dash)
import { fullscreenManager } from '../utils/fullscreen.js';
import { getLang } from '../utils/translations.js';

export default class VirusGame2 extends Phaser.Scene {
    constructor() {
        super('VirusGame2');
        this.fullscreenBtn = null;
    }

    init(data) {
        this.selectedRole = data.role || 'virus';
        this.mode = data.mode || 'game';
        this.mission = data.mission || 'Misi 2';
        
        this.WIN_SCORE = 120;            // ⚠️ Nilai test (tetap 120 untuk cepat ke boss)
        this.KILL_SCORE = 14000;
        this.BOSS_CONTACT_DAMAGE = 15;
        this.WBC_SPAWN_DELAY = 350;
        this.INFECTION_COOLDOWN = 5000;
        this.DAMAGE_PER_TICK = 5;
        
        this.bossSpawned = false;
        this.bossActive = false;
        this.bossVulnerable = false;
        this.boss = null;
        this.lastBossHitTime = 0;
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        
        try {
            const bg = this.add.image(width/2, height/2, 'bgVirus');
            bg.setDepth(0);
            bg.setDisplaySize(width, height);
        } catch (e) {
            this.add.rectangle(width/2, height/2, width, height, 0x660000).setDepth(0);
        }
        
        this.player = null;
        this.wbcs = this.add.group();
        this.bossBullets = this.add.group();
        this.score = 0;
        this.isGameOver = false;
        this.isPaused = false;
        this.pauseMenuContainer = null;
        this.pauseButton = null;
        
        // ✅ TEXTURE PELURU Y (ANTIGEN)
        const bulletGraphics = this.add.graphics();
        bulletGraphics.lineStyle(4, 0xFFFF00, 1);
        bulletGraphics.lineBetween(12, 20, 12, 12);
        bulletGraphics.lineBetween(12, 12, 5, 5);
        bulletGraphics.lineBetween(12, 12, 19, 5);
        bulletGraphics.fillStyle(0x00FFFF, 1);
        bulletGraphics.fillCircle(5, 5, 3);
        bulletGraphics.lineStyle(1, 0xFFFFFF, 1);
        bulletGraphics.strokeCircle(5, 5, 3);
        bulletGraphics.fillStyle(0x00FFFF, 1);
        bulletGraphics.fillCircle(19, 5, 3);
        bulletGraphics.lineStyle(1, 0xFFFFFF, 1);
        bulletGraphics.strokeCircle(19, 5, 3);
        bulletGraphics.fillStyle(0xFFFFFF, 1);
        bulletGraphics.fillCircle(12, 12, 2);
        bulletGraphics.generateTexture('antibodyBulletTex', 24, 24);
        bulletGraphics.destroy();
        
        // ✅ JUDUL + NOMOR MISI
        this.add.text(30, 30, `${getLang('virusTitle')} 2`, {
            font: 'bold 28px Arial', fill: '#ff00ff', stroke: '#000000', strokeThickness: 4
        }).setDepth(10);
        
        this.scoreText = this.add.text(width - 30, 30, `${getLang('score')}: 0 / ${this.WIN_SCORE}`, {
            font: 'bold 28px Arial', fill: '#ffffff', stroke: '#000000', strokeThickness: 4
        }).setOrigin(1, 0).setDepth(10);
        
        this.hpText = this.add.text(30, 70, `HP: 100/100`, {
            font: 'bold 24px Arial', fill: '#00ff00', stroke: '#000000', strokeThickness: 3
        }).setDepth(10);
        
        // ✅ TIMER
        this.timerText = this.add.text(30, 100, '⏱️ 5s', {
            font: 'bold 28px Arial',
            fill: '#00ffff',
            stroke: '#000000',
            strokeThickness: 4
        }).setDepth(10);
        
        // ✅ PLAYER SPAWN DI BAWAH
        const playerStartX = width / 2;
        const playerStartY = height - 100;
        this.player = new VirusCell(this, playerStartX, playerStartY);
        
        // ✅ KONTROL: POINTER MOVE
        this.input.on('pointermove', (pointer) => {
            if (!this.isPaused && !this.isGameOver) {
                this.player.targetX = pointer.x;
                this.player.targetY = pointer.y;
            }
        });
        
        // ✅ POINTER DOWN = DASH
        this.input.on('pointerdown', (pointer) => {
            if (!this.isPaused && !this.isGameOver) {
                this.player.targetX = pointer.x;
                this.player.targetY = pointer.y;
                this.player.tryDash();
            }
        });
        
        this.cursors = this.input.keyboard.createCursorKeys();
        this.wasd = this.input.keyboard.addKeys({
            up: Phaser.Input.Keyboard.KeyCodes.W,
            down: Phaser.Input.Keyboard.KeyCodes.S,
            left: Phaser.Input.Keyboard.KeyCodes.A,
            right: Phaser.Input.Keyboard.KeyCodes.D
        });
        this.input.keyboard.on('keydown-ESC', () => this.togglePause());
        
        this.time.addEvent({
            delay: this.WBC_SPAWN_DELAY,
            callback: this.spawnWBC,
            callbackScope: this,
            loop: true
        });
        
        this.physics.add.overlap(this.player, this.wbcs, this.handleCollision, null, this);
        this.physics.add.overlap(this.player, this.bossBullets, this.handleMissileHit, null, this);
        
        this.time.addEvent({
            delay: 1000,
            callback: this.checkDamage,
            callbackScope: this,
            loop: true
        });
        
        const pauseBtnSize = 150;
        const pauseBtnMargin = 50;
        this.pauseButton = this.add.image(width - pauseBtnMargin, 110, 'pause-btn');
        this.pauseButton.setDisplaySize(pauseBtnSize, pauseBtnSize);
        this.pauseButton.setInteractive({ useHandCursor: true });
        this.pauseButton.setDepth(10);
        this.pauseButton.on('pointerover', () => this.pauseButton.setDisplaySize(pauseBtnSize * 1.1, pauseBtnSize * 1.1));
        this.pauseButton.on('pointerout', () => this.pauseButton.setDisplaySize(pauseBtnSize, pauseBtnSize));
        this.pauseButton.on('pointerdown', () => this.togglePause());
        
        const missionText = this.add.text(width/2, height/2, getLang('virusMissionText'), {
            font: 'bold 48px Arial', fill: '#ff00ff', stroke: '#000000', strokeThickness: 6, align: 'center'
        }).setOrigin(0.5).setDepth(20);
        this.time.delayedCall(3000, () => missionText.destroy());

        this.createFullscreenButton(width, height);
    }

    update() {
        if (this.isPaused || this.isGameOver) return;
        
        this.wbcs.children.iterate((wbc) => {
            if (wbc && wbc.active) wbc.updateAI();
        });
        
        if (this.bossActive && this.boss && this.boss.active) {
            this.boss.updateAI(this.player.x, this.player.y);
        }
        
        this.bossBullets.children.iterate((b) => {
            if (b && b.active) b.updateBullet(this.player.x, this.player.y);
        });
        
        this.player.updateAI();
        this.updateTimerDisplay();
    }

    updateTimerDisplay() {
        const now = Date.now();
        const timeSinceInfection = now - this.player.lastInfectionTime;
        const timeRemaining = Math.max(0, this.INFECTION_COOLDOWN - timeSinceInfection);
        const secondsLeft = Math.ceil(timeRemaining / 1000);
        
        this.timerText.setText(`⏱️ ${secondsLeft}s`);
        
        if (secondsLeft <= 2) {
            this.timerText.setStyle({ fill: '#ff0000', stroke: '#ffffff', strokeThickness: 4 });
        } else if (secondsLeft <= 3) {
            this.timerText.setStyle({ fill: '#ffff00', stroke: '#000000', strokeThickness: 4 });
        } else {
            this.timerText.setStyle({ fill: '#00ffff', stroke: '#000000', strokeThickness: 4 });
        }
    }

    spawnWBC() {
        if (this.isPaused || this.isGameOver) return;
        
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        const side = Phaser.Math.Between(0, 3);
        let x, y;
        
        if (side === 0) { x = -80; y = Phaser.Math.Between(80, height - 80); }
        else if (side === 1) { x = width + 80; y = Phaser.Math.Between(80, height - 80); }
        else if (side === 2) { x = Phaser.Math.Between(80, width - 80); y = -80; }
        else { x = Phaser.Math.Between(80, width - 80); y = height + 80; }
        
        const sizeLevel = this.getWBCSizeLevel();
        this.wbcs.add(new WBC(this, x, y, sizeLevel));
    }

    getWBCSizeLevel() {
        const roll = Math.random();
        if (roll < 0.6) return 1;
        if (roll < 0.9) return 2;
        return 3;
    }

    handleCollision(virus, wbc) {
        if (this.isGameOver || this.isPaused || !wbc.active) return;
        
        // ✅ SAAT DASH: TIDAK ADA INFEKSI! Virus menembus sel tanpa teleport
        //    (supaya jalur dash tetap lurus & tidak terganggu)
        if (virus.isDashing) return;
        
        const scoreValue = wbc.scoreValue;
        this.score += scoreValue;
        this.scoreText.setText(`${getLang('score')}: ${this.score} / ${this.KILL_SCORE}`);
        
        virus.lastInfectionTime = Date.now();
        
        this.createInfectionParticles(wbc.x, wbc.y);
        wbc.destroy();
        
        virus.setPosition(wbc.x, wbc.y);
        virus.lastInfectionTime = Date.now();
        
        virus.resetAfterInfect();
        
        if (!this.bossSpawned && this.score >= this.WIN_SCORE) {
            this.startBossFight();
        }
        else if (this.bossSpawned && !this.bossVulnerable && this.score >= this.KILL_SCORE) {
            this.weakenBoss();
        }
    }

    startBossFight() {
        this.bossSpawned = true;
        this.bossActive = true;

        // ✅ PLAYER CEPAT saat boss fight
        this.player.normalSpeed = this.player.bossPhaseSpeed;
        this.player.currentSpeed = this.player.bossPhaseSpeed;

        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        
        const warn = this.add.text(width/2, height/2, '⚠️ BOSS: WBC PENEMBAK! ⚠️', {
            font: 'bold 52px Arial', fill: '#ff0000', stroke: '#000000', strokeThickness: 8, align: 'center'
        }).setOrigin(0.5).setDepth(25);
        this.tweens.add({
            targets: warn,
            alpha: 0,
            delay: 2500,
            duration: 500,
            onComplete: () => warn.destroy()
        });
        
        this.bossStatusText = this.add.text(width/2, 70, `👑 BOSS AKTIF! KEJAR SKOR ${this.KILL_SCORE}!`, {
            font: 'bold 26px Arial', fill: '#ff4444', stroke: '#000000', strokeThickness: 4
        }).setOrigin(0.5, 0).setDepth(10);
        
        // ✅ BOSS SPAWN DI ATAS
        this.boss = new WBCBoss(this, width/2, -120);
        this.physics.add.overlap(this.player, this.boss, this.handleBossCollision, null, this);
    }

    weakenBoss() {
        this.bossVulnerable = true;
        if (this.boss && this.boss.active) {
            this.boss.vulnerable = true;
            this.boss.stopCharge();
            this.boss.setTint(0x999999);
        }
        if (this.bossStatusText) {
            this.bossStatusText.setText('⚠️ BOSS LEMAH! SENTUH UNTUK INFECT! ⚠️');
            this.bossStatusText.setStyle({ fill: '#00ff00', stroke: '#000000', strokeThickness: 4 });
        }
    }

    handleBossCollision(virus, boss) {
        if (this.isGameOver || this.isPaused || !boss.active) return;
        
        if (this.bossVulnerable) {
            this.createInfectionParticles(boss.x, boss.y);
            this.createInfectionParticles(boss.x + 40, boss.y - 25);
            this.createInfectionParticles(boss.x - 40, boss.y + 25);
            boss.destroy();
            this.boss = null;
            this.bossActive = false;
            this.triggerVictory();
            return;
        }
        
        const now = Date.now();
        if (now - this.lastBossHitTime < 1500) return;
        this.lastBossHitTime = now;
        
        virus.HP -= this.BOSS_CONTACT_DAMAGE;
        this.hpText.setText(`HP: ${virus.HP}/100`);
        if (virus.HP > 50) {
            this.hpText.setStyle({ fill: '#00ff00' });
        } else if (virus.HP > 25) {
            this.hpText.setStyle({ fill: '#ffff00' });
        } else {
            this.hpText.setStyle({ fill: '#ff0000' });
        }
        
        if (virus.HP <= 0) {
            this.triggerGameOver();
            return;
        }
        
        // Reset posisi player ke BAWAH
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        virus.resetAfterInfect();
        virus.body.setVelocity(0, 0);
        virus.setPosition(width / 2, height - 100);
        
        virus.setAlpha(0.5);
        this.time.delayedCall(1500, () => {
            if (virus.active) virus.setAlpha(1);
        });
        
        boss.lastShot = Date.now();
        boss.stopCharge();
    }

    handleMissileHit(virus, missile) {
        if (this.isGameOver || this.isPaused || !missile.active) return;
        missile.destroy();
        virus.slowUntil = Date.now() + 1000;
    }

    createInfectionParticles(x, y) {
        for (let i = 0; i < 8; i++) {
            const particle = this.add.circle(x, y, 3, 0x4488FF);
            particle.setDepth(20);
            const angle = (Math.PI * 2 / 8) * i;
            this.tweens.add({
                targets: particle,
                x: particle.x + Math.cos(angle) * 50,
                y: particle.y + Math.sin(angle) * 50,
                alpha: 0,
                duration: 500,
                onComplete: () => particle.destroy()
            });
        }
    }

    checkDamage() {
        if (this.isPaused || this.isGameOver) return;
        
        const now = Date.now();
        const timeSinceInfection = now - this.player.lastInfectionTime;
        
        if (timeSinceInfection > this.INFECTION_COOLDOWN) {
            this.player.HP -= this.DAMAGE_PER_TICK;
            
            this.hpText.setText(`HP: ${this.player.HP}/100`);
            
            if (this.player.HP > 50) {
                this.hpText.setStyle({ fill: '#00ff00' });
            } else if (this.player.HP > 25) {
                this.hpText.setStyle({ fill: '#ffff00' });
            } else {
                this.hpText.setStyle({ fill: '#ff0000' });
            }
            
            if (this.player.HP <= 0) {
                this.triggerGameOver();
            }
        }
    }

    togglePause() {
        if (this.isGameOver) return;
        this.isPaused = !this.isPaused;
        if (this.isPaused) {
            this.player.body.setVelocity(0, 0);
            this.wbcs.children.iterate((w) => { if (w && w.body) w.body.setVelocity(0, 0); });
            if (this.boss && this.boss.body) this.boss.body.setVelocity(0, 0);
            this.bossBullets.children.iterate((b) => { if (b && b.body) b.body.setVelocity(0, 0); });
            this.showPauseMenu();
        } else {
            this.hidePauseMenu();
        }
    }

    showPauseMenu() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        
        this.pauseMenuContainer = this.add.container(0, 0).setDepth(20);
        const overlay = this.add.rectangle(width/2, height/2, width, height, 0x000000, 0.7);
        overlay.setInteractive();
        this.pauseMenuContainer.add(overlay);
        
        const panel = this.add.image(width/2, height/2, 'cardRock');
        panel.setDisplaySize(500, 320);
        this.pauseMenuContainer.add(panel);
        
        const resumeBtn = this.add.image(width/2, height/2 - 40, 'resume-btn');
        resumeBtn.setDisplaySize(300, 80);
        resumeBtn.setInteractive({ useHandCursor: true });
        resumeBtn.on('pointerover', () => resumeBtn.setDisplaySize(320, 85));
        resumeBtn.on('pointerout', () => resumeBtn.setDisplaySize(300, 80));
        resumeBtn.on('pointerdown', () => this.togglePause());
        this.pauseMenuContainer.add(resumeBtn);
        
        const exitBtn = this.add.image(width/2, height/2 + 70, 'exit-btn');
        exitBtn.setDisplaySize(300, 80);
        exitBtn.setInteractive({ useHandCursor: true });
        exitBtn.on('pointerover', () => exitBtn.setDisplaySize(320, 85));
        exitBtn.on('pointerout', () => exitBtn.setDisplaySize(300, 80));
        exitBtn.on('pointerdown', () => this.scene.start('MenuScene'));
        this.pauseMenuContainer.add(exitBtn);
    }

    hidePauseMenu() {
        if (this.pauseMenuContainer) {
            this.pauseMenuContainer.destroy();
            this.pauseMenuContainer = null;
        }
    }

    triggerVictory() {
        this.isGameOver = true;
        this.add.text(640, 300, getLang('virusVictory'), {
            font: 'bold 72px Arial', fill: '#00ff00', stroke: '#000000', strokeThickness: 8
        }).setOrigin(0.5).setDepth(20);
        this.time.delayedCall(3000, () => this.scene.start('MenuScene'));
    }

    triggerGameOver() {
        this.isGameOver = true;
        this.add.text(640, 300, getLang('virusGameOver'), {
            font: 'bold 72px Arial', fill: '#ff0000', stroke: '#000000', strokeThickness: 8
        }).setOrigin(0.5).setDepth(20);
        this.time.delayedCall(3000, () => this.scene.start('MenuScene'));
    }

    createFullscreenButton(width, height) {
        if (!fullscreenManager.supportsFullscreen) return;
        const btnX = width / 2;
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
}

// ===== CLASS VIRUS CELL (BIRU PERMANEN + DASH 1 DETIK TEMBUS SEL) =====
class VirusCell extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'virus');
        scene.add.existing(this);
        scene.physics.add.existing(this);
        
        this.HP = 100;
        this.radius = 15;
        this.baseSpeed = 320;
        this.isFlipped = false;
        this.setScale(2.0);
        
        // ✅ WARNA BIRU PERMANEN
        this.baseColor = 0x4488FF;
        this.setTint(this.baseColor);
        
        this.setDepth(5);
        this.setCollideWorldBounds(true);
        
        this.lastInfectionTime = Date.now();
        this.targetX = x;
        this.targetY = y;
        
        // ✅ FASE 1: 5 DETIK PERTAMA
        this.initialPhase = true;
        this.initialPhaseDuration = 5000;
        this.initialPhaseStartTime = Date.now();
        this.initialSpeed = 130;
        
        this.normalSpeed = 150;
        this.bossPhaseSpeed = 180;
        this.dashSpeed = 500;
        this.currentSpeed = this.initialSpeed;
        
        this.direction = Math.random() * Math.PI * 2;
        this.body.setCircle(this.radius);
        
        // ✅ DASH MANUAL
        this.isDashing = false;
        this.canDash = false;
        this.dashRechargeTime = 1000;     // Recharge 1 detik (setelah dash selesai)
        this.dashDuration = 1000;         // ✅ DASH 1 DETIK (kembali dari 1.5 detik)
        this.lastDashTime = Date.now();
        this.dashDirection = 0;
        this.dashTrail = null;
        
        this.slowUntil = 0;
        
        // ✅ LASER BIDIK (biru tipis & pendek)
        this.laserGraphics = scene.add.graphics().setDepth(4);
    }

    tryDash() {
        if (!this.canDash || this.isDashing || !this.active) return;
        
        const dx = this.targetX - this.x;
        const dy = this.targetY - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < 5) return;
        
        this.isDashing = true;
        this.canDash = false;
        this.dashDirection = Math.atan2(dy, dx);
        
        // ✅ Oranye saat dash
        this.setTint(0xFF4400);
        
        this.dashTrail = this.scene.add.graphics().setDepth(3);
        
        // ✅ SELESAI DASH (1 detik): kembali BIRU PERMANEN
        this.scene.time.delayedCall(this.dashDuration, () => {
            if (this.active) {
                this.isDashing = false;
                this.currentSpeed = this.normalSpeed;
                this.setTint(this.baseColor); // ✅ Kembali BIRU
                this.lastDashTime = Date.now();
                if (this.dashTrail) {
                    this.dashTrail.destroy();
                    this.dashTrail = null;
                }
            }
        });
    }

    resetAfterInfect() {
        this.isDashing = false;
        if (this.dashTrail) {
            this.dashTrail.destroy();
            this.dashTrail = null;
        }
        this.setTint(this.baseColor); // ✅ Tetap BIRU
        this.canDash = true;
        this.lastDashTime = Date.now();
    }

    updateAI() {
        if (!this.body || !this.active) return;
        
        const currentTime = Date.now();
        const timeSinceSpawn = currentTime - this.initialPhaseStartTime;
        const slowMult = (currentTime < this.slowUntil) ? 0.25 : 1;
        
        this.updateLaserSight();
        
        // ✅ Recharge: 1 detik SETELAH dash selesai
        if (!this.canDash && !this.isDashing && currentTime - this.lastDashTime >= this.dashRechargeTime) {
            this.canDash = true;
        }
        
        // ✅ FASE 1: 5 DETIK PERTAMA
        if (this.initialPhase) {
            const dx = this.targetX - this.x;
            const dy = this.targetY - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance > 5) {
                const dirX = dx / distance;
                const dirY = dy / distance;
                this.body.setVelocity(dirX * this.initialSpeed * slowMult, dirY * this.initialSpeed * slowMult);
                this.setFlipX(dx > 0);
            } else {
                this.body.setVelocity(0, 0);
            }
            
            if (timeSinceSpawn >= this.initialPhaseDuration) {
                this.initialPhase = false;
                this.currentSpeed = this.normalSpeed;
            }
            return;
        }
        
        // ✅ SEDANG DASH (1 detik) - GERAK LURUS TANPA GANGGUAN
        if (this.isDashing) {
            this.updateDashMovement();
            return;
        }
        
        // ✅ GERAKAN NORMAL (150)
        const dx = this.targetX - this.x;
        const dy = this.targetY - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 5) {
            const dirX = dx / distance;
            const dirY = dy / distance;
            this.body.setVelocity(
                dirX * this.currentSpeed * slowMult,
                dirY * this.currentSpeed * slowMult
            );
            this.setFlipX(dx > 0);
        } else {
            this.body.setVelocity(0, 0);
        }
    }

    updateDashMovement() {
        this.body.setVelocity(
            Math.cos(this.dashDirection) * this.dashSpeed,
            Math.sin(this.dashDirection) * this.dashSpeed
        );
        this.setFlipX(Math.cos(this.dashDirection) > 0);
        
        if (this.dashTrail) {
            this.dashTrail.clear();
            this.dashTrail.fillStyle(0xFF4400, 0.7);
            this.dashTrail.fillCircle(this.x, this.y, this.radius * 1.5);
            this.dashTrail.fillStyle(0xFFFF00, 0.5);
            this.dashTrail.fillCircle(this.x, this.y, this.radius * 0.8);
        }
        
        const width = this.scene.cameras.main.width;
        const height = this.scene.cameras.main.height;
        const margin = 50;
        
        if (this.x < margin) {
            this.x = margin;
            this.dashDirection = Math.PI - this.dashDirection;
        } else if (this.x > width - margin) {
            this.x = width - margin;
            this.dashDirection = Math.PI - this.dashDirection;
        }
        
        if (this.y < margin) {
            this.y = margin;
            this.dashDirection = -this.dashDirection;
        } else if (this.y > height - margin) {
            this.y = height - margin;
            this.dashDirection = -this.dashDirection;
        }
    }

    // ✅ LASER TIPIS & PENDEK + CINCIN TANDA DASH SIAP
    updateLaserSight() {
        if (!this.laserGraphics) return;
        this.laserGraphics.clear();
        
        const dx = this.targetX - this.x;
        const dy = this.targetY - this.y;
        const angle = Math.atan2(dy, dx);
        const laserLength = 250;
        
        const endX = this.x + Math.cos(angle) * laserLength;
        const endY = this.y + Math.sin(angle) * laserLength;
        
        if (this.canDash && !this.isDashing) {
            // Dash siap: laser biru TIPIS + TERANG
            this.laserGraphics.lineStyle(2, 0x4488FF, 0.4);
            this.laserGraphics.lineBetween(this.x, this.y, endX, endY);
            this.laserGraphics.lineStyle(1, 0x88BBFF, 0.7);
            this.laserGraphics.lineBetween(this.x, this.y, endX, endY);
            
            this.laserGraphics.fillStyle(0x4488FF, 0.7);
            this.laserGraphics.fillCircle(endX, endY, 4);
            
            // ✅ CINCIN TIPIS = tanda dash SIAP
            this.laserGraphics.lineStyle(2, 0x88BBFF, 0.6);
            this.laserGraphics.strokeCircle(this.x, this.y, this.radius * 2.2);
        } else if (!this.isDashing) {
            // Normal: laser sangat redup & tipis
            this.laserGraphics.lineStyle(1, 0x4488FF, 0.2);
            this.laserGraphics.lineBetween(this.x, this.y, endX, endY);
        }
    }

    destroy() {
        if (this.dashTrail) {
            this.dashTrail.destroy();
        }
        if (this.laserGraphics) {
            this.laserGraphics.destroy();
        }
        super.destroy();
    }
}

// ===== CLASS WBC (Musuh biasa) =====
class WBC extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, sizeLevel) {
        super(scene, x, y, 'wbc');
        scene.add.existing(this);
        scene.physics.add.existing(this);
        
        let scale, scoreValue, speed, tint;
        if (sizeLevel === 1) {
            scale = 0.4;
            scoreValue = 50;
            speed = 120;
            tint = 0xFFFFFF;
        } else if (sizeLevel === 2) {
            scale = 0.65;
            scoreValue = 100;
            speed = 80;
            tint = 0xADD8E6;
        } else {
            scale = 1.0;
            scoreValue = 150;
            speed = 50;
            tint = 0x87CEEB;
        }
        
        this.sizeLevel = sizeLevel;
        this.scoreValue = scoreValue;
        this.moveSpeed = speed;
        this.setScale(scale);
        this.setTint(tint);
        this.setDepth(3);
        
        this.radius = scale * 50;
        this.body.setCircle(this.radius);
        
        this.direction = Phaser.Math.Angle.Between(x, y, 640, 360) + Phaser.Math.FloatBetween(-0.5, 0.5);
    }

    updateAI() {
        if (!this.body) return;
        
        if (Phaser.Math.Between(0, 100) < 2) {
            this.direction += Phaser.Math.FloatBetween(-0.4, 0.4);
        }
        
        this.body.setVelocity(
            Math.cos(this.direction) * this.moveSpeed,
            Math.sin(this.direction) * this.moveSpeed
        );
        this.setFlipX(Math.cos(this.direction) > 0);
        
        const width = this.scene.cameras.main.width;
        const height = this.scene.cameras.main.height;
        if (this.x < -200 || this.x > width + 200 || this.y < -200 || this.y > height + 200) {
            this.destroy();
        }
    }
}

// ===== CLASS BOSS 1: WBC PENEMBAK (KUNING PUCAT + BESAR + CEPAT) =====
class WBCBoss extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'wbc');
        scene.add.existing(this);
        scene.physics.add.existing(this);
        
        this.setScale(1.8);           // ✅ Lebih besar dari musuh lain
        this.setTint(0xFFFFAA);       // ✅ Kuning pucat
        this.setDepth(4);
        this.radius = 15;
        this.body.setCircle(this.radius);
        
        this.moveSpeed = 125;         // ✅ Cepat (tapi kalah dari player 150/180)
        this.shootDelay = 5000;
        this.chargeTime = 1200;
        this.lastShot = Date.now();
        this.chargeTween = null;
        this.vulnerable = false;
    }

    updateAI(playerX, playerY) {
        if (!this.body) return;
        
        const angle = Phaser.Math.Angle.Between(this.x, this.y, playerX, playerY);
        this.body.setVelocity(Math.cos(angle) * this.moveSpeed, Math.sin(angle) * this.moveSpeed);
        this.setFlipX(Math.cos(angle) > 0);
        
        const now = Date.now();
        const timeSinceShot = now - this.lastShot;
        
        if (timeSinceShot >= this.shootDelay - this.chargeTime && !this.chargeTween && !this.vulnerable) {
            this.startCharge();
        }
        
        if (timeSinceShot >= this.shootDelay && !this.vulnerable) {
            this.stopCharge();
            this.lastShot = now;
            this.shoot(playerX, playerY);
        }
    }

    startCharge() {
        if (this.chargeTween) this.chargeTween.stop();
        this.chargeTween = this.scene.tweens.addCounter({
            from: 0,
            to: 1,
            duration: 200,
            repeat: -1,
            yoyo: true,
            onUpdate: (tween) => {
                if (!this.active) return;
                const val = tween.getValue();
                if (val > 0.5) {
                    this.setTint(0xFF0000);
                } else {
                    this.setTint(0xFFFFAA);
                }
            }
        });
    }

    stopCharge() {
        if (this.chargeTween) {
            this.chargeTween.stop();
            this.chargeTween = null;
        }
        if (this.active) {
            this.setTint(this.vulnerable ? 0x999999 : 0xFFFFAA);
        }
    }

    shoot(targetX, targetY) {
        const angle = Phaser.Math.Angle.Between(this.x, this.y, targetX, targetY);
        const missile = new BossMissile(this.scene, this.x, this.y, angle);
        this.scene.bossBullets.add(missile);
    }
}

// ===== CLASS MISIL BOSS (homing 3 detik) =====
class BossMissile extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, angle) {
        super(scene, x, y, 'antibodyBulletTex');
        scene.add.existing(this);
        scene.physics.add.existing(this);
        
        this.moveSpeed = 260;
        this.radius = 10;
        this.body.setCircle(this.radius);
        this.setDepth(6);
        this.setRotation(angle + Math.PI / 2);
        this.body.setVelocity(Math.cos(angle) * this.moveSpeed, Math.sin(angle) * this.moveSpeed);
        
        this.spawnTime = Date.now();
        this.homingDuration = 2000;
        
        scene.time.delayedCall(7000, () => {
            if (this.active) this.destroy();
        });
    }

    updateBullet(playerX, playerY) {
        const now = Date.now();
        
        if (now - this.spawnTime < this.homingDuration) {
            const angle = Phaser.Math.Angle.Between(this.x, this.y, playerX, playerY);
            this.body.setVelocity(Math.cos(angle) * this.moveSpeed, Math.sin(angle) * this.moveSpeed);
            this.setRotation(angle + Math.PI / 2);
        }
        
        const width = this.scene.cameras.main.width;
        const height = this.scene.cameras.main.height;
        if (this.x < -50 || this.x > width + 50 || this.y < -50 || this.y > height + 50) {
            this.destroy();
        }
    }
}