// prokaryotic-game.js - LENGKAP: 3 Boss + Cursor Smooth + Dash Jauh + Shooter 4 Bola + Chaser Nembak
import { fullscreenManager } from '../utils/fullscreen.js'; // ✅ TAMBAHAN: Import fullscreen

export default class ProkaryoticGame extends Phaser.Scene {
    constructor() {
        super('ProkaryoticGame');
        this.fullscreenBtn = null; // ✅ TAMBAHAN: Variabel tombol fullscreen
    }

    init(data) {
        this.selectedRole = data.role || 'prokaryotic';
        this.mode = data.mode || 'game';
        this.mission = data.mission || 'Misi 1';
        
        if (this.mission === 'Misi 1') {
            this.WIN_SCORE = 500;
            this.SPAWN_DELAY = 400;
            this.ENEMY_SPEED_MULT = 0.8;
            this.BOSS_MODE = false;
        } else if (this.mission === 'Misi 2') {
            this.WIN_SCORE = 15000;
            this.SPAWN_DELAY = 250;
            this.ENEMY_SPEED_MULT = 1.3;
            this.BOSS_MODE = true;
            this.BOSS1_SPAWN_SCORE = 500;
            this.BOSS1_KILL_SCORE = 1500;
            this.BOSS2_KILL_SCORE = 3000;
            this.BOSS3_KILL_SCORE = 10000;
            this.BOSS3_PHASE2_KILL_SCORE = 15000;
        } else {
            this.WIN_SCORE = 1500;
            this.SPAWN_DELAY = 400;
            this.ENEMY_SPEED_MULT = 1.0;
            this.BOSS_MODE = false;
        }
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        
        try {
            this.add.image(width/2, height/2, 'bgGameplay').setDepth(0);
        } catch (e) {
            this.add.rectangle(width/2, height/2, width, height, 0x0a2a2a).setDepth(0);
        }
        
        this.player = null;
        this.enemies = this.add.group();
        this.projectiles = this.add.group();
        this.boss1 = null;
        this.boss2 = null;
        this.boss3 = null;
        this.boss3Shooter = null;
        this.boss3Chaser = null;
        this.score = 0;
        this.lives = 3;
        this.isGameOver = false;
        this.isPaused = false;
        this.lastDamageTime = 0;
        this.boss1Spawned = false;
        this.boss1Defeated = false;
        this.boss2Spawned = false;
        this.boss2Defeated = false;
        this.boss3Spawned = false;
        this.boss3Phase2 = false;
        this.pauseMenuContainer = null;
        this.pauseButton = null;
        
        this.add.text(30, 30, 'PROKARYOTIC', {
            font: 'bold 28px Arial', fill: '#00ff00', stroke: '#000000', strokeThickness: 4
        }).setDepth(10);
        
        this.scoreText = this.add.text(width - 30, 30, `Skor: 0 / ${this.WIN_SCORE}`, {
            font: 'bold 28px Arial', fill: '#ffffff', stroke: '#000000', strokeThickness: 4
        }).setOrigin(1, 0).setDepth(10);
        
        this.livesText = this.add.text(30, 70, `Nyawa: ❤️❤️❤️`, {
            font: 'bold 28px Arial', fill: '#ff4444', stroke: '#000000', strokeThickness: 4
        }).setDepth(10);
        
        this.bossStatusText = this.add.text(width/2, 140, '', {
    font: 'bold 24px Arial', fill: '#ff0000', stroke: '#000000', strokeThickness: 3, align: 'center'
}).setOrigin(0.5).setDepth(15);
        this.bossStatusText.visible = false;
        
        this.player = new ProkaryoticCell(this, width/2, height/2);
        
        this.input.on('pointermove', (pointer) => {
            if (!this.isPaused && !this.isGameOver) {
                this.player.moveToPointer(pointer);
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
            delay: this.SPAWN_DELAY,
            callback: this.spawnBacteria,
            callbackScope: this,
            loop: true
        });
        
        this.physics.add.overlap(this.player, this.enemies, this.handleCollision, null, this);
        this.physics.add.overlap(this.player, this.projectiles, this.handleProjectileCollision, null, this);
        
       const pauseBtnSize = 150;
const pauseBtnMargin = 50;
this.pauseButton = this.add.image(width - pauseBtnMargin, 110, 'pause-btn'); // ✅ Pindah ke kanan atas
this.pauseButton.setDisplaySize(pauseBtnSize, pauseBtnSize);
this.pauseButton.setInteractive({ useHandCursor: true });
this.pauseButton.setDepth(10);
this.pauseButton.on('pointerover', () => this.pauseButton.setDisplaySize(pauseBtnSize * 1.1, pauseBtnSize * 1.1));
this.pauseButton.on('pointerout', () => this.pauseButton.setDisplaySize(pauseBtnSize, pauseBtnSize));
this.pauseButton.on('pointerdown', () => this.togglePause());
        
        if (this.mission === 'Misi 2') {
            const missionText = this.add.text(width/2, height/2, 'MISSION 2\nHARD MODE + 3 BOSS BATTLES', {
                font: 'bold 48px Arial', fill: '#ff0000', stroke: '#000000', strokeThickness: 6, align: 'center'
            }).setOrigin(0.5).setDepth(20);
            this.time.delayedCall(3000, () => missionText.destroy());
        }

        // ✅ TAMBAHAN: Buat tombol fullscreen di tengah atas
        this.createFullscreenButton(width, height);
    }

    update() {
        if (this.isPaused || this.isGameOver) return;
        
        this.enemies.children.iterate((bacteria) => {
            if (bacteria && bacteria.active) bacteria.updateAI();
        });
        
        this.projectiles.children.iterate((proj) => {
            if (proj && proj.active) proj.updateProjectile();
        });
        
        const speed = 320;
        let vx = 0, vy = 0;
        if (this.cursors.left.isDown || this.wasd.left.isDown) { vx = -speed; this.player.setFlipX(true); }
        if (this.cursors.right.isDown || this.wasd.right.isDown) { vx = speed; this.player.setFlipX(false); }
        if (this.cursors.up.isDown || this.wasd.up.isDown) vy = -speed;
        if (this.cursors.down.isDown || this.wasd.down.isDown) vy = speed;
        this.player.body.setVelocity(vx, vy);
        
        if (this.boss1 && this.boss1.active) {
            if (this.score >= this.BOSS1_KILL_SCORE) {
                this.bossStatusText.setText('BOSS 1: VULNERABLE! - KEJAR & TABRAK!');
                this.bossStatusText.setStyle({ fill: '#00ff00' });
            } else {
                this.bossStatusText.setText(`BOSS 1: IMMUNE (Reach ${this.BOSS1_KILL_SCORE})`);
                this.bossStatusText.setStyle({ fill: '#ff0000' });
            }
            this.bossStatusText.visible = true;
        } else if (this.boss2 && this.boss2.active) {
            if (this.score >= this.BOSS2_KILL_SCORE) {
                this.bossStatusText.setText('BOSS 2: VULNERABLE! - KEJAR & TABRAK!');
                this.bossStatusText.setStyle({ fill: '#00ff00' });
            } else {
                this.bossStatusText.setText(`BOSS 2: IMMUNE (Reach ${this.BOSS2_KILL_SCORE})`);
                this.bossStatusText.setStyle({ fill: '#9900ff' });
            }
            this.bossStatusText.visible = true;
        } else if (this.boss3 && this.boss3.active) {
            if (this.score >= this.BOSS3_KILL_SCORE) {
                this.bossStatusText.setText('BOSS 3: VULNERABLE! - KEJAR & TABRAK!');
                this.bossStatusText.setStyle({ fill: '#00ff00' });
            } else {
                this.bossStatusText.setText(`BOSS 3: IMMUNE (Reach ${this.BOSS3_KILL_SCORE})`);
                this.bossStatusText.setStyle({ fill: '#ffff00' });
            }
            this.bossStatusText.visible = true;
        } else if (this.boss3Phase2) {
            if (this.score >= this.BOSS3_PHASE2_KILL_SCORE) {
                this.bossStatusText.setText('BOSS 3 PHASE 2: VULNERABLE! - KEJAR & TABRAK!');
                this.bossStatusText.setStyle({ fill: '#00ff00' });
            } else {
                this.bossStatusText.setText(`BOSS 3 PHASE 2: IMMUNE (Reach ${this.BOSS3_PHASE2_KILL_SCORE})`);
                this.bossStatusText.setStyle({ fill: '#ffaa00' });
            }
            this.bossStatusText.visible = true;
        } else {
            this.bossStatusText.visible = false;
        }
    }

    spawnBacteria() {
        if (this.isPaused || this.isGameOver) return;
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        const side = Phaser.Math.Between(0, 3);
        let x, y;
        if (side === 0) { x = -80; y = Phaser.Math.Between(80, height - 80); }
        else if (side === 1) { x = width + 80; y = Phaser.Math.Between(80, height - 80); }
        else if (side === 2) { x = Phaser.Math.Between(80, width - 80); y = -80; }
        else { x = Phaser.Math.Between(80, width - 80); y = height + 80; }
        
        if (this.BOSS_MODE && !this.boss1Spawned && this.score >= this.BOSS1_SPAWN_SCORE) {
            this.spawnBoss1();
            this.boss1Spawned = true;
            return;
        }
        const sizeLevel = this.getBacteriaSizeLevel();
        this.enemies.add(new Bacteria(this, x, y, sizeLevel, this.ENEMY_SPEED_MULT));
    }

    spawnBoss1() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        this.boss1 = new BossBacteriaRed(this, width/2, -150);
        this.enemies.add(this.boss1);
        const bossAlert = this.add.text(width/2, height/2, '⚠️ BOSS 1 APPEARS! ⚠️\nRed Bacteria - Reach 1500 to Kill!', {
            font: 'bold 48px Arial', fill: '#ff0000', stroke: '#000000', strokeThickness: 8, align: 'center'
        }).setOrigin(0.5).setDepth(25);
        this.time.delayedCall(3000, () => bossAlert.destroy());
        this.cameras.main.shake(500, 0.02);
    }

    spawnBoss2() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        this.boss2 = new BossBacteriaPurple(this, width/2, -150, this);
        this.enemies.add(this.boss2);
        const bossAlert = this.add.text(width/2, height/2, '⚠️ BOSS 2 APPEARS! ⚠️\nPurple Shooter - Reach 3000 to Kill!', {
            font: 'bold 48px Arial', fill: '#9900ff', stroke: '#000000', strokeThickness: 8, align: 'center'
        }).setOrigin(0.5).setDepth(25);
        this.time.delayedCall(3000, () => bossAlert.destroy());
        this.cameras.main.shake(500, 0.02);
    }

    spawnBoss3() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        const warningText = this.add.text(width/2, height/2, '⚠️ WARNING! ⚠️\nBOSS 3 INCOMING!', {
            font: 'bold 72px Arial', fill: '#ff0000', stroke: '#000000', strokeThickness: 8, align: 'center'
        }).setOrigin(0.5).setDepth(30);
        this.tweens.add({ targets: warningText, alpha: 0.3, duration: 300, yoyo: true, repeat: 5 });
        this.cameras.main.shake(1000, 0.03);
        this.time.delayedCall(2000, () => {
            warningText.destroy();
            this.boss3 = new BossBacteriaYellow(this, width/2, height/2, this);
            this.enemies.add(this.boss3);
            this.cameras.main.shake(500, 0.02);
            const bossAlert = this.add.text(width/2, height/2 - 200, 'YELLOW BERSERKER\nReach 10000 to Kill!', {
                font: 'bold 48px Arial', fill: '#ffff00', stroke: '#000000', strokeThickness: 8, align: 'center'
            }).setOrigin(0.5).setDepth(25);
            this.time.delayedCall(3000, () => bossAlert.destroy());
        });
    }

    spawnBoss3Phase2() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        this.boss3Shooter = new BossBacteriaYellowShooter(this, width/3, height/2, this);
        this.enemies.add(this.boss3Shooter);
        this.boss3Chaser = new BossBacteriaYellowChaser(this, width * 2/3, height/2, this);
        this.enemies.add(this.boss3Chaser);
        this.boss3Phase2 = true;
        const bossAlert = this.add.text(width/2, height/2, '⚠️ BOSS 3 PHASE 2! ⚠️\nSPLIT INTO 2 BOSSES!\nReach 15000 to Kill Both!', {
            font: 'bold 48px Arial', fill: '#ffaa00', stroke: '#000000', strokeThickness: 8, align: 'center'
        }).setOrigin(0.5).setDepth(25);
        this.time.delayedCall(3000, () => bossAlert.destroy());
        this.cameras.main.shake(500, 0.02);
    }

    getBacteriaSizeLevel() {
        const playerSize = this.player.cellSize;
        const roll = Math.random();
        if (this.mission === 'Misi 2') {
            if (playerSize < 1.5) { if (roll < 0.5) return 1; if (roll < 0.85) return 2; return 3; }
            else if (playerSize < 2.0) { if (roll < 0.3) return 1; if (roll < 0.7) return 2; return 3; }
            else { if (roll < 0.2) return 1; if (roll < 0.5) return 2; return 3; }
        } else {
            if (playerSize < 1.5) { if (roll < 0.75) return 1; if (roll < 0.95) return 2; return 3; }
            else if (playerSize < 2.0) { if (roll < 0.5) return 1; if (roll < 0.85) return 2; return 3; }
            else { if (roll < 0.3) return 1; if (roll < 0.7) return 2; return 3; }
        }
    }

    handleCollision(player, bacteria) {
        if (this.isGameOver || this.isPaused || !bacteria.active) return;
        const currentTime = Date.now();
        if (currentTime - this.lastDamageTime < 500) return;
        const playerRadius = player.radius;
        const bacteriaRadius = bacteria.radius;
        if (bacteria instanceof BossBacteriaRed) { this.handleBoss1Collision(player, bacteria); return; }
        if (bacteria instanceof BossBacteriaPurple) { this.handleBoss2Collision(player, bacteria); return; }
        if (bacteria instanceof BossBacteriaYellow) { this.handleBoss3Collision(player, bacteria); return; }
        if (bacteria instanceof BossBacteriaYellowShooter || bacteria instanceof BossBacteriaYellowChaser) { this.handleBoss3Phase2Collision(player, bacteria); return; }
        if (playerRadius > bacteriaRadius * 1.1) {
            this.score += bacteria.scoreValue;
            this.scoreText.setText(`Skor: ${this.score} / ${this.WIN_SCORE}`);
            player.grow();
            bacteria.destroy();
            if (this.score >= this.WIN_SCORE && !this.BOSS_MODE) this.triggerVictory();
        } else if (bacteriaRadius > playerRadius * 1.1) {
            this.loseLife();
            this.lastDamageTime = currentTime;
        }
    }

    handleBoss1Collision(player, boss) {
        if (this.score < this.BOSS1_KILL_SCORE) {
            this.loseLife(); this.lastDamageTime = Date.now();
            const immuneText = this.add.text(this.cameras.main.width/2, this.cameras.main.height/2 + 150, `BOSS 1 IMMUNE!\nReach ${this.BOSS1_KILL_SCORE} Score!`, { font: 'bold 32px Arial', fill: '#ff6600', stroke: '#000000', strokeThickness: 4, align: 'center' }).setOrigin(0.5).setDepth(20);
            this.time.delayedCall(1500, () => immuneText.destroy());
            return;
        }
        boss.destroy(); this.boss1Defeated = true; this.score += 500;
        this.scoreText.setText(`Skor: ${this.score} / ${this.WIN_SCORE}`);
        this.cameras.main.shake(500, 0.03);
        const killText = this.add.text(this.cameras.main.width/2, this.cameras.main.height/2, 'BOSS 1 DEFEATED!', { font: 'bold 64px Arial', fill: '#00ff00', stroke: '#000000', strokeThickness: 6 }).setOrigin(0.5).setDepth(20);
        this.time.delayedCall(1500, () => killText.destroy());
        this.time.delayedCall(2000, () => { if (!this.isGameOver) this.spawnBoss2(); });
    }

    handleBoss2Collision(player, boss) {
        if (this.score < this.BOSS2_KILL_SCORE) {
            this.loseLife(); this.lastDamageTime = Date.now();
            const immuneText = this.add.text(this.cameras.main.width/2, this.cameras.main.height/2 + 150, `BOSS 2 IMMUNE!\nReach ${this.BOSS2_KILL_SCORE} Score!`, { font: 'bold 32px Arial', fill: '#9900ff', stroke: '#000000', strokeThickness: 4, align: 'center' }).setOrigin(0.5).setDepth(20);
            this.time.delayedCall(1500, () => immuneText.destroy());
            return;
        }
        boss.destroy(); this.boss2Defeated = true; this.score += 1000;
        this.scoreText.setText(`Skor: ${this.score} / ${this.WIN_SCORE}`);
        this.cameras.main.shake(500, 0.03);
        const killText = this.add.text(this.cameras.main.width/2, this.cameras.main.height/2, 'BOSS 2 DEFEATED!', { font: 'bold 64px Arial', fill: '#9900ff', stroke: '#000000', strokeThickness: 6 }).setOrigin(0.5).setDepth(20);
        this.time.delayedCall(1500, () => killText.destroy());
        this.time.delayedCall(2000, () => { if (!this.isGameOver) this.spawnBoss3(); });
    }

    handleBoss3Collision(player, boss) {
        if (this.score < this.BOSS3_KILL_SCORE) {
            this.loseLife(); this.lastDamageTime = Date.now();
            const immuneText = this.add.text(this.cameras.main.width/2, this.cameras.main.height/2 + 150, `BOSS 3 IMMUNE!\nReach ${this.BOSS3_KILL_SCORE} Score!`, { font: 'bold 32px Arial', fill: '#ffff00', stroke: '#000000', strokeThickness: 4, align: 'center' }).setOrigin(0.5).setDepth(20);
            this.time.delayedCall(1500, () => immuneText.destroy());
            return;
        }
        boss.destroy(); this.score += 1500;
        this.scoreText.setText(`Skor: ${this.score} / ${this.WIN_SCORE}`);
        this.cameras.main.shake(500, 0.03);
        const killText = this.add.text(this.cameras.main.width/2, this.cameras.main.height/2, 'BOSS 3 DEFEATED!\nPHASE 2 INCOMING...', { font: 'bold 64px Arial', fill: '#ffff00', stroke: '#000000', strokeThickness: 6, align: 'center' }).setOrigin(0.5).setDepth(20);
        this.time.delayedCall(2000, () => killText.destroy());
        this.time.delayedCall(3000, () => { if (!this.isGameOver) this.spawnBoss3Phase2(); });
    }

    handleBoss3Phase2Collision(player, bacteria) {
        if (this.score < this.BOSS3_PHASE2_KILL_SCORE) {
            this.loseLife(); this.lastDamageTime = Date.now();
            const immuneText = this.add.text(this.cameras.main.width/2, this.cameras.main.height/2 + 150, `PHASE 2 IMMUNE!\nReach ${this.BOSS3_PHASE2_KILL_SCORE} Score!`, { font: 'bold 32px Arial', fill: '#ffaa00', stroke: '#000000', strokeThickness: 4, align: 'center' }).setOrigin(0.5).setDepth(20);
            this.time.delayedCall(1500, () => immuneText.destroy());
            return;
        }
        bacteria.destroy(); this.score += 500;
        this.scoreText.setText(`Skor: ${this.score} / ${this.WIN_SCORE}`);
        this.cameras.main.shake(300, 0.02);
        const shooterAlive = this.boss3Shooter && this.boss3Shooter.active;
        const chaserAlive = this.boss3Chaser && this.boss3Chaser.active;
        if (!shooterAlive && !chaserAlive) {
            const killText = this.add.text(this.cameras.main.width/2, this.cameras.main.height/2, 'ALL BOSSES DEFEATED!', { font: 'bold 64px Arial', fill: '#00ffff', stroke: '#000000', strokeThickness: 6 }).setOrigin(0.5).setDepth(20);
            this.time.delayedCall(1500, () => killText.destroy());
            this.triggerVictory();
        }
    }

    handleProjectileCollision(player, projectile) {
        if (this.isGameOver || this.isPaused || !projectile.active) return;
        const currentTime = Date.now();
        if (currentTime - this.lastDamageTime < 500) return;
        this.loseLife(); this.lastDamageTime = currentTime;
        projectile.destroy();
        this.cameras.main.flash(200, 255, 255, 0);
    }

    loseLife() {
        this.lives--;
        let hearts = '❤️'.repeat(this.lives);
        this.livesText.setText(`Nyawa: ${hearts}`);
        if (this.lives <= 0) { this.triggerGameOver(); }
        else { this.player.setPosition(640, 360); this.player.body.setVelocity(0, 0); }
    }

    togglePause() {
        if (this.isGameOver) return;
        this.isPaused = !this.isPaused;
        if (this.isPaused) {
            this.player.body.setVelocity(0, 0);
            this.enemies.children.iterate((b) => { if (b && b.body) b.body.setVelocity(0, 0); });
            this.projectiles.children.iterate((p) => { if (p && p.body) p.body.setVelocity(0, 0); });
            this.showPauseMenu();
        } else { this.hidePauseMenu(); }
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
        if (this.pauseMenuContainer) { this.pauseMenuContainer.destroy(); this.pauseMenuContainer = null; }
    }

    triggerVictory() {
        this.isGameOver = true;
        const victoryText = this.mission === 'Misi 2' ? 'MISSION 2 COMPLETE!' : 'VICTORY!';
        this.add.text(640, 300, victoryText, { font: 'bold 72px Arial', fill: '#00ff00', stroke: '#000000', strokeThickness: 8 }).setOrigin(0.5).setDepth(20);
        this.time.delayedCall(3000, () => this.scene.start('MenuScene'));
    }

    triggerGameOver() {
        this.isGameOver = true;
        this.add.text(640, 300, 'GAME OVER', { font: 'bold 72px Arial', fill: '#ff0000', stroke: '#000000', strokeThickness: 8 }).setOrigin(0.5).setDepth(20);
        this.time.delayedCall(3000, () => this.scene.start('MenuScene'));
    }

    // ✅ TAMBAHAN: Fungsi membuat tombol Fullscreen di tengah atas
    createFullscreenButton(width, height) {
        if (!fullscreenManager.supportsFullscreen) return;

        const btnX = width / 2; // Posisi TENGAH
        const btnY = 60;        // Posisi ATAS (aman, tidak menutupi gameplay)

        this.fullscreenBtn = this.add.text(btnX, btnY, '⛶', {
            font: 'bold 28px Arial',
            fill: '#00ff00',
            stroke: '#00cc00',
            strokeThickness: 3,
            backgroundColor: '#001a00',
            padding: { x: 12, y: 8 }
        });
        this.fullscreenBtn.setOrigin(0.5);
        this.fullscreenBtn.setDepth(1000); // Pastikan di atas segalanya
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

    // ✅ TAMBAHAN: Fungsi update icon tombol
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

// ===== CLASS PLAYER - ULTIMATE SMOOTH CURSOR MOVEMENT =====
class ProkaryoticCell extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'prokaryotic');
        scene.add.existing(this);
        scene.physics.add.existing(this);
        this.cellSize = 1;
        this.baseScale = 1.0;
        this.radius = 45;
        this.baseSpeed = 320;
        this.isFlipped = false;
        this.setScale(this.baseScale);
        this.updateBody();
        this.setCollideWorldBounds(true);
        this.setDepth(5);
        this.currentSpeed = 0;
        this.acceleration = 18;
        this.deceleration = 15;
    }

    updateBody() {
        const halfSize = Math.min(this.width, this.height) / 2;
        const textureRadius = halfSize * 0.75;
        this.radius = textureRadius * this.scaleX;
        this.body.setCircle(textureRadius, this.width/2 - textureRadius, this.height/2 - textureRadius);
    }

    moveToPointer(pointer) {
        const dx = pointer.x - this.x;
        const dy = pointer.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (dx > 10 && !this.isFlipped) { this.setFlipX(true); this.isFlipped = true; }
        else if (dx < -10 && this.isFlipped) { this.setFlipX(false); this.isFlipped = false; }
        if (distance < 5) { this.body.setVelocity(0, 0); this.currentSpeed = 0; return; }
        
        let targetSpeed;
        if (distance > 150) targetSpeed = this.baseSpeed;
        else if (distance > 50) targetSpeed = this.baseSpeed * 0.85;
        else targetSpeed = 120;
        
        if (this.currentSpeed < targetSpeed) {
            this.currentSpeed = Math.min(this.currentSpeed + this.acceleration, targetSpeed);
        } else {
            this.currentSpeed = Math.max(this.currentSpeed - this.deceleration, targetSpeed);
        }
        
        const dirX = dx / distance;
        const dirY = dy / distance;
        this.body.setVelocity(dirX * this.currentSpeed, dirY * this.currentSpeed);
    }

    grow() {
        this.cellSize += 0.1;
        if (this.cellSize > 2.5) this.cellSize = 2.5;
        this.setScale(this.baseScale * this.cellSize);
        this.updateBody();
        this.scene.tweens.add({ targets: this, scaleX: this.scaleX * 1.1, scaleY: this.scaleY * 1.1, duration: 100, yoyo: true, ease: 'Back.easeOut' });
    }
}

// ===== CLASS ENEMY (BACTERIA BIASA) =====
class Bacteria extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, sizeLevel, speedMultiplier = 1.0) {
        super(scene, x, y, 'bacteria');
        scene.add.existing(this);
        scene.physics.add.existing(this);
        let scale, scoreValue, speed, tint;
        if (sizeLevel === 1) { scale = 0.4; scoreValue = 10; speed = 120 * speedMultiplier; tint = 0x66FF66; }
        else if (sizeLevel === 2) { scale = 0.65; scoreValue = 25; speed = 80 * speedMultiplier; tint = 0xFF6666; }
        else { scale = 1.0; scoreValue = 50; speed = 50 * speedMultiplier; tint = 0x6666FF; }
        this.sizeLevel = sizeLevel;
        this.scoreValue = scoreValue;
        this.moveSpeed = speed;
        this.setScale(scale);
        this.setTint(tint);
        this.updateBody();
        this.setDepth(4);
        this.direction = Phaser.Math.Angle.Between(x, y, 640, 360) + Phaser.Math.FloatBetween(-0.5, 0.5);
    }
    updateBody() {
        const halfSize = Math.min(this.width, this.height) / 2;
        const textureRadius = halfSize * 0.65;
        this.radius = textureRadius * this.scaleX;
        this.body.setCircle(textureRadius, this.width/2 - textureRadius, this.height/2 - textureRadius);
    }
    updateAI() {
        if (!this.body) return;
        if (Phaser.Math.Between(0, 100) < 2) { this.direction += Phaser.Math.FloatBetween(-0.4, 0.4); }
        this.body.setVelocity(Math.cos(this.direction) * this.moveSpeed, Math.sin(this.direction) * this.moveSpeed);
        this.setFlipX(Math.cos(this.direction) > 0);
        const width = this.scene.cameras.main.width;
        const height = this.scene.cameras.main.height;
        if (this.x < -200 || this.x > width + 200 || this.y < -200 || this.y > height + 200) { this.destroy(); }
    }
}

// ===== CLASS BOSS 1 - BAKTERI MERAH =====
class BossBacteriaRed extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'bacteria');
        scene.add.existing(this);
        scene.physics.add.existing(this);
        this.sizeLevel = 4;
        this.scoreValue = 1000;
        this.moveSpeed = 80;
        this.setScale(1.5);
        this.setTint(0xFF00FF);
        this.setDepth(4);
        this.direction = Phaser.Math.Angle.Between(x, y, 640, 360);
        this.radius = 15;
        this.body.setCircle(this.radius, this.width/2 - this.radius, this.height/2 - this.radius);
        scene.cameras.main.shake(500, 0.02);
        scene.tweens.add({ targets: this, scaleX: this.scaleX * 1.3, scaleY: this.scaleY * 1.3, duration: 600, yoyo: true, ease: 'Back.easeOut' });
    }
    updateAI() {
        if (!this.body || !this.active) return;
        const player = this.scene.player;
        if (player && player.active) {
            const angleToPlayer = Phaser.Math.Angle.Between(this.x, this.y, player.x, player.y);
            let angleDiff = angleToPlayer - this.direction;
            while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
            while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
            this.direction += angleDiff * 0.02;
        }
        if (Phaser.Math.Between(0, 100) < 2) { this.direction += Phaser.Math.FloatBetween(-0.3, 0.3); }
        this.body.setVelocity(Math.cos(this.direction) * this.moveSpeed, Math.sin(this.direction) * this.moveSpeed);
        this.setFlipX(Math.cos(this.direction) > 0);
        const width = this.scene.cameras.main.width;
        const height = this.scene.cameras.main.height;
        if (this.x < -200 || this.x > width + 200 || this.y < -200 || this.y > height + 200) { this.direction += Math.PI; }
    }
}

// ===== CLASS BOSS 2 - BAKTERI UNGU (Shooter) =====
class BossBacteriaPurple extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, gameScene) {
        super(scene, x, y, 'bacteria');
        scene.add.existing(this);
        scene.physics.add.existing(this);
        this.gameScene = gameScene;
        this.sizeLevel = 5;
        this.scoreValue = 2000;
        this.moveSpeed = 60;
        this.setScale(1.8);
        this.setTint(0x9900FF);
        this.setDepth(4);
        this.direction = Phaser.Math.Angle.Between(x, y, 640, 360);
        this.radius = 15;
        this.body.setCircle(this.radius, this.width/2 - this.radius, this.height/2 - this.radius);
        this.shootCooldown = 5000;
        this.lastShootTime = Date.now();
        this.isCharging = false;
        this.blinkTween = null;
        scene.cameras.main.shake(500, 0.02);
        scene.tweens.add({ targets: this, scaleX: this.scaleX * 1.3, scaleY: this.scaleY * 1.3, duration: 600, yoyo: true, ease: 'Back.easeOut' });
    }
    updateAI() {
        if (!this.body || !this.active) return;
        const currentTime = Date.now();
        const timeSinceLastShoot = currentTime - this.lastShootTime;
        if (timeSinceLastShoot >= 3000 && !this.isCharging) { this.startCharging(); }
        if (timeSinceLastShoot >= this.shootCooldown && this.isCharging) { this.shoot(); }
        const player = this.gameScene.player;
        if (player && player.active) {
            const angleToPlayer = Phaser.Math.Angle.Between(this.x, this.y, player.x, player.y);
            let angleDiff = angleToPlayer - this.direction;
            while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
            while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
            this.direction += angleDiff * 0.015;
        }
        if (Phaser.Math.Between(0, 100) < 1) { this.direction += Phaser.Math.FloatBetween(-0.2, 0.2); }
        this.body.setVelocity(Math.cos(this.direction) * this.moveSpeed, Math.sin(this.direction) * this.moveSpeed);
        this.setFlipX(Math.cos(this.direction) > 0);
        const width = this.scene.cameras.main.width;
        const height = this.scene.cameras.main.height;
        if (this.x < -200 || this.x > width + 200 || this.y < -200 || this.y > height + 200) { this.direction += Math.PI; }
    }
    startCharging() {
        this.isCharging = true;
        if (this.blinkTween) { this.blinkTween.stop(); }
        this.blinkTween = this.scene.tweens.addCounter({
            from: 0, to: 10, duration: 2000, repeat: 0,
            onUpdate: (tween) => {
                if (!this.active) return;
                const val = Math.floor(tween.getValue());
                this.setTint(val % 2 === 0 ? 0x9900FF : 0xFF0000);
            },
            onComplete: () => { if (this.active) this.setTint(0xFF0000); }
        });
    }
    shoot() {
        this.isCharging = false;
        this.lastShootTime = Date.now();
        if (this.blinkTween) { this.blinkTween.stop(); this.blinkTween = null; }
        this.setTint(0x9900FF);
        const player = this.gameScene.player;
        if (player && player.active) {
            const angle = Phaser.Math.Angle.Between(this.x, this.y, player.x, player.y);
            const projectile = new YellowBall(this.scene, this.x, this.y, angle);
            this.gameScene.projectiles.add(projectile);
        }
        this.scene.cameras.main.shake(100, 0.01);
    }
    destroy() {
        if (this.blinkTween) { this.blinkTween.stop(); this.blinkTween = null; }
        super.destroy();
    }
}

// ===== CLASS BOSS 3 - BAKTERI KUNING "BERSERKER" =====
class BossBacteriaYellow extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, gameScene) {
        super(scene, x, y, 'bacteria');
        scene.add.existing(this);
        scene.physics.add.existing(this);
        this.gameScene = gameScene;
        this.sizeLevel = 6;
        this.scoreValue = 3000;
        this.setPosition(x, y);
        this.initialPhase = true;
        this.initialPhaseDuration = 5000;
        this.initialPhaseStartTime = Date.now();
        this.initialSpeed = 130;
        this.normalSpeed = 40;
        this.recoverySpeed = 25;
        this.dashSpeed = 650;
        this.currentSpeed = this.initialSpeed;
        this.setScale(2.2);
        this.setTint(0xFFFF00);
        this.setDepth(4);
        this.direction = Math.random() * Math.PI * 2;
        this.radius = 15;
        this.body.setCircle(this.radius, this.width/2 - this.radius, this.height/2 - this.radius);
        this.isCharging = false;
        this.isDashing = false;
        this.isRecovering = false;
        this.dashCooldown = 5000;
        this.lastDashTime = Date.now();
        this.blinkTween = null;
        this.dashBlinkTween = null;
        this.wobbleAngle = 0;
        this.dashTrail = null;
        this.dashDirection = 0;
        this.dashWarningText = null;
        scene.cameras.main.shake(500, 0.03);
        scene.tweens.add({ targets: this, scaleX: this.scaleX * 1.5, scaleY: this.scaleY * 1.5, duration: 800, yoyo: true, ease: 'Back.easeOut' });
    }
    updateAI() {
        if (!this.body || !this.active) return;
        const currentTime = Date.now();
        const timeSinceSpawn = currentTime - this.initialPhaseStartTime;
        if (this.initialPhase) {
            const player = this.gameScene.player;
            if (player && player.active) {
                const angleToPlayer = Phaser.Math.Angle.Between(this.x, this.y, player.x, player.y);
                let angleDiff = angleToPlayer - this.direction;
                while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
                while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
                this.direction += angleDiff * 0.03;
            }
            if (Phaser.Math.Between(0, 100) < 2) { this.direction += Phaser.Math.FloatBetween(-0.3, 0.3); }
            this.body.setVelocity(Math.cos(this.direction) * this.initialSpeed, Math.sin(this.direction) * this.initialSpeed);
            this.setFlipX(Math.cos(this.direction) > 0);
            const width = this.scene.cameras.main.width;
            const height = this.scene.cameras.main.height;
            const margin = 100;
            if (this.x < margin) { this.x = margin; this.direction = Math.PI - this.direction; }
            else if (this.x > width - margin) { this.x = width - margin; this.direction = Math.PI - this.direction; }
            if (this.y < margin) { this.y = margin; this.direction = -this.direction; }
            else if (this.y > height - margin) { this.y = height - margin; this.direction = -this.direction; }
            if (timeSinceSpawn >= this.initialPhaseDuration) {
                this.initialPhase = false;
                this.currentSpeed = this.normalSpeed;
                this.lastDashTime = Date.now();
                this.scene.tweens.add({ targets: this, scaleX: this.scaleX * 1.2, scaleY: this.scaleY * 1.2, duration: 300, yoyo: true, ease: 'Back.easeOut' });
            }
            return;
        }
        if (this.isDashing) { this.updateDash(); return; }
        if (this.isRecovering) { this.updateRecovery(); return; }
        const timeSinceLastDash = currentTime - this.lastDashTime;
        if (timeSinceLastDash >= 2000 && !this.isCharging) { this.startCharging(); }
        if (timeSinceLastDash >= this.dashCooldown && this.isCharging) { this.startDash(); }
        if (!this.isCharging) {
            this.wobbleAngle += 0.05;
            const wobbleX = Math.sin(this.wobbleAngle) * 0.3;
            const wobbleY = Math.cos(this.wobbleAngle * 1.3) * 0.3;
            if (Phaser.Math.Between(0, 100) < 5) { this.direction += Phaser.Math.FloatBetween(-1.5, 1.5); }
            const player = this.gameScene.player;
            if (player && player.active) {
                const angleToPlayer = Phaser.Math.Angle.Between(this.x, this.y, player.x, player.y);
                let angleDiff = angleToPlayer - this.direction;
                while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
                while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
                this.direction += angleDiff * 0.008;
            }
            this.direction += wobbleX * 0.02;
            this.body.setVelocity(Math.cos(this.direction) * this.currentSpeed + wobbleX * 20, Math.sin(this.direction) * this.currentSpeed + wobbleY * 20);
            this.setFlipX(Math.cos(this.direction) > 0);
            const width = this.scene.cameras.main.width;
            const height = this.scene.cameras.main.height;
            const margin = 100;
            if (this.x < margin) { this.x = margin; this.direction = Math.PI - this.direction; }
            else if (this.x > width - margin) { this.x = width - margin; this.direction = Math.PI - this.direction; }
            if (this.y < margin) { this.y = margin; this.direction = -this.direction; }
            else if (this.y > height - margin) { this.y = height - margin; this.direction = -this.direction; }
        } else {
            this.body.setVelocity(0, 0);
        }
    }
    startCharging() {
        this.isCharging = true;
        this.body.setVelocity(0, 0);
        if (this.blinkTween) { this.blinkTween.stop(); }
        this.blinkTween = this.scene.tweens.addCounter({
            from: 0, to: 1, duration: 200, repeat: -1, yoyo: true,
            onUpdate: (tween) => {
                if (!this.active) return;
                const val = tween.getValue();
                this.setTint(val > 0.5 ? 0xFF0000 : 0xFFFF00);
            }
        });
        if (!this.dashWarningText) {
            this.dashWarningText = this.scene.add.text(this.x, this.y - 100, '⚠️ DASH INCOMING!', {
                font: 'bold 28px Arial', fill: '#ff0000', stroke: '#000000', strokeThickness: 4
            }).setOrigin(0.5).setDepth(20);
        }
        this.dashWarningText.setPosition(this.x, this.y - 100);
        this.dashWarningText.visible = true;
        this.scene.tweens.add({ targets: this.dashWarningText, alpha: 0.3, duration: 200, yoyo: true, repeat: -1 });
    }
    startDash() {
        this.isCharging = false;
        this.isDashing = true;
        this.isRecovering = false;
        this.currentSpeed = this.dashSpeed;
        this.lastDashTime = Date.now();
        if (this.blinkTween) { this.blinkTween.stop(); this.blinkTween = null; }
        if (this.dashWarningText) { this.dashWarningText.visible = false; }
        const player = this.gameScene.player;
        if (player && player.active) { this.dashDirection = Phaser.Math.Angle.Between(this.x, this.y, player.x, player.y); }
        this.direction = this.dashDirection;
        if (this.dashBlinkTween) { this.dashBlinkTween.stop(); }
        this.dashBlinkTween = this.scene.tweens.addCounter({
            from: 0, to: 1, duration: 50, repeat: -1, yoyo: true,
            onUpdate: (tween) => {
                if (!this.active) return;
                const val = tween.getValue();
                this.setTint(val > 0.5 ? 0xFF0000 : 0xFFFF00);
            }
        });
        this.scene.cameras.main.shake(300, 0.02);
        this.dashTrail = this.scene.add.graphics().setDepth(3);
        
        this.scene.time.delayedCall(450, () => {
            if (this.active) {
                this.isDashing = false;
                this.isRecovering = true;
                this.currentSpeed = this.recoverySpeed;
                this.setTint(0xFFFF00);
                if (this.dashBlinkTween) { this.dashBlinkTween.stop(); this.dashBlinkTween = null; }
                if (this.dashTrail) { this.dashTrail.destroy(); this.dashTrail = null; }
                this.scene.tweens.add({ targets: this, scaleX: this.scaleX * 0.9, scaleY: this.scaleY * 0.9, duration: 200, yoyo: true, ease: 'Back.easeOut' });
            }
        });
    }
    updateDash() {
        this.body.setVelocity(Math.cos(this.dashDirection) * this.currentSpeed, Math.sin(this.dashDirection) * this.currentSpeed);
        this.setFlipX(Math.cos(this.dashDirection) > 0);
        if (this.dashTrail) { this.dashTrail.clear(); this.dashTrail.fillStyle(0xFF4400, 0.5); this.dashTrail.fillCircle(this.x, this.y, this.radius * 0.8); }
        const width = this.scene.cameras.main.width;
        const height = this.scene.cameras.main.height;
        const margin = 50;
        if (this.x < margin) { this.x = margin; this.dashDirection = Math.PI - this.dashDirection; this.direction = this.dashDirection; }
        else if (this.x > width - margin) { this.x = width - margin; this.dashDirection = Math.PI - this.dashDirection; this.direction = this.dashDirection; }
        if (this.y < margin) { this.y = margin; this.dashDirection = -this.dashDirection; this.direction = this.dashDirection; }
        else if (this.y > height - margin) { this.y = height - margin; this.dashDirection = -this.dashDirection; this.direction = this.dashDirection; }
    }
    updateRecovery() {
        const player = this.gameScene.player;
        if (player && player.active) {
            const angleToPlayer = Phaser.Math.Angle.Between(this.x, this.y, player.x, player.y);
            let angleDiff = angleToPlayer - this.direction;
            while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
            while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
            this.direction += angleDiff * 0.02;
        }
        this.wobbleAngle += 0.03;
        const wobbleX = Math.sin(this.wobbleAngle) * 0.2;
        const wobbleY = Math.cos(this.wobbleAngle * 1.3) * 0.2;
        this.body.setVelocity(Math.cos(this.direction) * this.recoverySpeed + wobbleX * 10, Math.sin(this.direction) * this.recoverySpeed + wobbleY * 10);
        this.setFlipX(Math.cos(this.direction) > 0);
        const width = this.scene.cameras.main.width;
        const height = this.scene.cameras.main.height;
        const margin = 100;
        if (this.x < margin) { this.x = margin; this.direction = Math.PI - this.direction; }
        else if (this.x > width - margin) { this.x = width - margin; this.direction = Math.PI - this.direction; }
        if (this.y < margin) { this.y = margin; this.direction = -this.direction; }
        else if (this.y > height - margin) { this.y = height - margin; this.direction = -this.direction; }
        const timeSinceLastDash = Date.now() - this.lastDashTime;
        if (timeSinceLastDash >= 7800) {
            this.isRecovering = false;
            this.currentSpeed = this.normalSpeed;
            this.lastDashTime = Date.now();
        }
    }
    destroy() {
        if (this.blinkTween) { this.blinkTween.stop(); this.blinkTween = null; }
        if (this.dashBlinkTween) { this.dashBlinkTween.stop(); this.dashBlinkTween = null; }
        if (this.dashTrail) { this.dashTrail.destroy(); this.dashTrail = null; }
        if (this.dashWarningText) { this.dashWarningText.destroy(); this.dashWarningText = null; }
        super.destroy();
    }
}

// ===== CLASS BOSS 3 PHASE 2 - SHOOTER (4 BOLA SEKALIGUS) =====
class BossBacteriaYellowShooter extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, gameScene) {
        super(scene, x, y, 'bacteria');
        scene.add.existing(this);
        scene.physics.add.existing(this);
        this.gameScene = gameScene;
        this.sizeLevel = 5;
        this.scoreValue = 2000;
        this.moveSpeed = 60;
        this.setScale(1.6);
        this.setTint(0xFFDD00);
        this.setDepth(4);
        this.direction = Phaser.Math.Angle.Between(x, y, 640, 360);
        this.radius = 15;
        this.body.setCircle(this.radius, this.width/2 - this.radius, this.height/2 - this.radius);
        this.shootCooldown = 5000;
        this.lastShootTime = Date.now();
        this.isCharging = false;
        this.blinkTween = null;
        scene.tweens.add({ targets: this, scaleX: this.scaleX * 1.3, scaleY: this.scaleY * 1.3, duration: 600, yoyo: true, ease: 'Back.easeOut' });
    }
    updateAI() {
        if (!this.body || !this.active) return;
        const currentTime = Date.now();
        const timeSinceLastShoot = currentTime - this.lastShootTime;
        if (timeSinceLastShoot >= 3000 && !this.isCharging) { this.startCharging(); }
        if (timeSinceLastShoot >= this.shootCooldown && this.isCharging) { this.shoot(); }
        const player = this.gameScene.player;
        if (player && player.active) {
            const angleToPlayer = Phaser.Math.Angle.Between(this.x, this.y, player.x, player.y);
            let angleDiff = angleToPlayer - this.direction;
            while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
            while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
            this.direction += angleDiff * 0.015;
        }
        if (Phaser.Math.Between(0, 100) < 1) { this.direction += Phaser.Math.FloatBetween(-0.2, 0.2); }
        this.body.setVelocity(Math.cos(this.direction) * this.moveSpeed, Math.sin(this.direction) * this.moveSpeed);
        this.setFlipX(Math.cos(this.direction) > 0);
        const width = this.scene.cameras.main.width;
        const height = this.scene.cameras.main.height;
        if (this.x < -200 || this.x > width + 200 || this.y < -200 || this.y > height + 200) { this.direction += Math.PI; }
    }
    startCharging() {
        this.isCharging = true;
        if (this.blinkTween) { this.blinkTween.stop(); }
        this.blinkTween = this.scene.tweens.addCounter({
            from: 0, to: 10, duration: 2000, repeat: 0,
            onUpdate: (tween) => {
                if (!this.active) return;
                const val = Math.floor(tween.getValue());
                this.setTint(val % 2 === 0 ? 0xFFDD00 : 0xFF0000);
            },
            onComplete: () => { if (this.active) this.setTint(0xFF0000); }
        });
    }
    
    shoot() {
        this.isCharging = false;
        this.lastShootTime = Date.now();
        if (this.blinkTween) { this.blinkTween.stop(); this.blinkTween = null; }
        this.setTint(0xFFDD00);
        
        const player = this.gameScene.player;
        if (player && player.active) {
            const baseAngle = Phaser.Math.Angle.Between(this.x, this.y, player.x, player.y);
            const spread = 0.25;
            
            const proj1 = new YellowBall(this.scene, this.x, this.y, baseAngle - spread * 1.5);
            this.gameScene.projectiles.add(proj1);
            
            const proj2 = new YellowBall(this.scene, this.x, this.y, baseAngle - spread * 0.5);
            this.gameScene.projectiles.add(proj2);
            
            const proj3 = new YellowBall(this.scene, this.x, this.y, baseAngle + spread * 0.5);
            this.gameScene.projectiles.add(proj3);
            
            const proj4 = new YellowBall(this.scene, this.x, this.y, baseAngle + spread * 1.5);
            this.gameScene.projectiles.add(proj4);
        }
        this.scene.cameras.main.shake(100, 0.01);
    }

    destroy() {
        if (this.blinkTween) { this.blinkTween.stop(); this.blinkTween = null; }
        super.destroy();
    }
}

// ===== CLASS BOSS 3 PHASE 2 - CHASER (TEMBAK 1 BOLA, SANGAT LAMBAT) =====
class BossBacteriaYellowChaser extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, gameScene) {
        super(scene, x, y, 'bacteria');
        scene.add.existing(this);
        scene.physics.add.existing(this);
        this.gameScene = gameScene;
        this.sizeLevel = 5;
        this.scoreValue = 2000;
        this.moveSpeed = 140; 
        this.setScale(1.5);
        this.setTint(0xFFAA00);
        this.setDepth(4);
        this.direction = Phaser.Math.Angle.Between(x, y, 640, 360);
        this.radius = 15;
        this.body.setCircle(this.radius, this.width/2 - this.radius, this.height/2 - this.radius);
        
        this.shootCooldown = 8000;
        this.lastShootTime = Date.now();
        this.isCharging = false;
        this.blinkTween = null;
        
        scene.tweens.add({ targets: this, scaleX: this.scaleX * 1.3, scaleY: this.scaleY * 1.3, duration: 600, yoyo: true, ease: 'Back.easeOut' });
    }
    updateAI() {
        if (!this.body || !this.active) return;
        
        const currentTime = Date.now();
        const timeSinceLastShoot = currentTime - this.lastShootTime;
        
        if (timeSinceLastShoot >= 6000 && !this.isCharging) { 
            this.startCharging(); 
        }
        if (timeSinceLastShoot >= this.shootCooldown && this.isCharging) { 
            this.shoot(); 
        }
        
        const player = this.gameScene.player;
        if (player && player.active) {
            const angleToPlayer = Phaser.Math.Angle.Between(this.x, this.y, player.x, player.y);
            let angleDiff = angleToPlayer - this.direction;
            while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
            while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
            this.direction += angleDiff * 0.025;
        }
        if (Phaser.Math.Between(0, 100) < 2) { this.direction += Phaser.Math.FloatBetween(-0.3, 0.3); }
        this.body.setVelocity(Math.cos(this.direction) * this.moveSpeed, Math.sin(this.direction) * this.moveSpeed);
        this.setFlipX(Math.cos(this.direction) > 0);
        const width = this.scene.cameras.main.width;
        const height = this.scene.cameras.main.height;
        if (this.x < -200 || this.x > width + 200 || this.y < -200 || this.y > height + 200) { this.direction += Math.PI; }
    }
    
    startCharging() {
        this.isCharging = true;
        if (this.blinkTween) { this.blinkTween.stop(); }
        this.blinkTween = this.scene.tweens.addCounter({
            from: 0, to: 10, duration: 2000, repeat: 0,
            onUpdate: (tween) => {
                if (!this.active) return;
                const val = Math.floor(tween.getValue());
                this.setTint(val % 2 === 0 ? 0xFFAA00 : 0xFF0000);
            },
            onComplete: () => { if (this.active) this.setTint(0xFF0000); }
        });
    }
    
    shoot() {
        this.isCharging = false;
        this.lastShootTime = Date.now();
        if (this.blinkTween) { this.blinkTween.stop(); this.blinkTween = null; }
        this.setTint(0xFFAA00);
        
        const player = this.gameScene.player;
        if (player && player.active) {
            const angle = Phaser.Math.Angle.Between(this.x, this.y, player.x, player.y);
            const projectile = new YellowBall(this.scene, this.x, this.y, angle);
            this.gameScene.projectiles.add(projectile);
        }
        this.scene.cameras.main.shake(100, 0.01);
    }

    destroy() {
        if (this.blinkTween) { this.blinkTween.stop(); this.blinkTween = null; }
        super.destroy();
    }
}

// ===== CLASS BOLA KUNING (Projectile) =====
class YellowBall extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, angle) {
        const graphics = scene.add.graphics();
        graphics.fillStyle(0xFFFF00, 1);
        graphics.fillCircle(15, 15, 15);
        graphics.generateTexture('yellowBall', 30, 30);
        graphics.destroy();
        super(scene, x, y, 'yellowBall');
        scene.add.existing(this);
        scene.physics.add.existing(this);
        this.moveSpeed = 200;
        this.direction = angle;
        this.radius = 15;
        this.body.setCircle(this.radius);
        this.setDepth(6);
        this.body.setVelocity(Math.cos(angle) * this.moveSpeed, Math.sin(angle) * this.moveSpeed);
        scene.time.delayedCall(5000, () => { if (this.active) this.destroy(); });
    }
    updateProjectile() {
        const width = this.scene.cameras.main.width;
        const height = this.scene.cameras.main.height;
        if (this.x < -50 || this.x > width + 50 || this.y < -50 || this.y > height + 50) { this.destroy(); }
    }
}