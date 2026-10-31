// wbc-game.js - White Blood Cell Game
import { fullscreenManager } from '../utils/fullscreen.js'; // ✅ TAMBAHAN 1: Import fullscreen

export default class WBCGame extends Phaser.Scene {
    constructor() {
        super('WBCGame');
        this.fullscreenBtn = null; // ✅ TAMBAHAN 2: Variabel tombol fullscreen
    }

    init(data) {
        this.selectedRole = data.role || 'wbc';
        this.mode = data.mode || 'game';
        this.mission = data.mission || 'Misi 1';
        
        this.WIN_SCORE = 10000;
        this.ENEMY_SPAWN_DELAY = 700;
        this.WEAKEN_DURATION = 6000;
        this.DAMAGE_INVULNERABILITY = 500;
        this.INSTAKILL_CHANCE = 35;
        this.SHIELD_CHANCE = 20;
        
        this.mouseX = 0;
        this.mouseY = 0;
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
        this.enemies = this.add.group();
        this.bullets = this.add.group();
        this.score = 0;
        this.isGameOver = false;
        this.isPaused = false;
        this.pauseMenuContainer = null;
        this.pauseButton = null;
        this.lastDamageTime = 0;
        
        // ✅ GENERATE TEXTURE PELURU Y - DIPERKECIL (24x24)
        const bulletGraphics = this.add.graphics();
        
        // Batang vertikal Y (bagian bawah - Fc region)
        bulletGraphics.lineStyle(4, 0xFFFF00, 1); // Kuning
        bulletGraphics.lineBetween(12, 20, 12, 12);
        
        // Cabang kiri Y
        bulletGraphics.lineBetween(12, 12, 5, 5);
        
        // Cabang kanan Y
        bulletGraphics.lineBetween(12, 12, 19, 5);
        
        // Lingkaran di ujung cabang kiri (binding site - cyan)
        bulletGraphics.fillStyle(0x00FFFF, 1);
        bulletGraphics.fillCircle(5, 5, 3);
        bulletGraphics.lineStyle(1, 0xFFFFFF, 1);
        bulletGraphics.strokeCircle(5, 5, 3);
        
        // Lingkaran di ujung cabang kanan (binding site - cyan)
        bulletGraphics.fillStyle(0x00FFFF, 1);
        bulletGraphics.fillCircle(19, 5, 3);
        bulletGraphics.lineStyle(1, 0xFFFFFF, 1);
        bulletGraphics.strokeCircle(19, 5, 3);
        
        // Titik tengah Y (pertemuan cabang)
        bulletGraphics.fillStyle(0xFFFFFF, 1);
        bulletGraphics.fillCircle(12, 12, 2);
        
        bulletGraphics.generateTexture('antibodyBulletTex', 24, 24);
        bulletGraphics.destroy();
        
        this.laserGraphics = this.add.graphics().setDepth(4);
        
        this.add.text(30, 30, 'WBC', {
            font: 'bold 28px Arial', fill: '#FFFF00', stroke: '#000000', strokeThickness: 4
        }).setDepth(10);
        
        this.scoreText = this.add.text(width - 30, 30, `Skor: 0 / ${this.WIN_SCORE}`, {
            font: 'bold 28px Arial', fill: '#FFFFFF', stroke: '#000000', strokeThickness: 4
        }).setOrigin(1, 0).setDepth(10);
        
        this.hpText = this.add.text(30, 70, `HP: 500/500`, {
            font: 'bold 24px Arial', fill: '#00FF00', stroke: '#000000', strokeThickness: 4
        }).setDepth(10);
        
        this.player = new WBCPlayer(this, width/2, height/2);
        
        this.input.on('pointermove', (pointer) => {
            if (!this.isPaused && !this.isGameOver) {
                this.mouseX = pointer.x;
                this.mouseY = pointer.y;
            }
        });
        
        this.input.on('pointerdown', (pointer) => {
            if (!this.isPaused && !this.isGameOver && pointer.leftButtonDown()) {
                this.fireAntibody();
            }
        });
        
        this.wasd = this.input.keyboard.addKeys({
            up: Phaser.Input.Keyboard.KeyCodes.W,
            down: Phaser.Input.Keyboard.KeyCodes.S,
            left: Phaser.Input.Keyboard.KeyCodes.A,
            right: Phaser.Input.Keyboard.KeyCodes.D
        });
        
        this.arrows = this.input.keyboard.createCursorKeys();
        this.input.keyboard.on('keydown-ESC', () => this.togglePause());
        
        this.time.addEvent({
            delay: this.ENEMY_SPAWN_DELAY,
            callback: this.spawnEnemy,
            callbackScope: this,
            loop: true
        });
        
        this.physics.add.overlap(this.player, this.enemies, this.handleEat, null, this);
        this.physics.add.overlap(this.bullets, this.enemies, this.handleBulletHit, null, this);
        
       const pauseBtnSize = 150;
const pauseBtnMargin = 50;
this.pauseButton = this.add.image(width - pauseBtnMargin, 110, 'pause-btn'); // ✅ Pindah ke kanan atas
this.pauseButton.setDisplaySize(pauseBtnSize, pauseBtnSize);
this.pauseButton.setInteractive({ useHandCursor: true });
this.pauseButton.setDepth(10);
this.pauseButton.on('pointerover', () => this.pauseButton.setDisplaySize(pauseBtnSize * 1.1, pauseBtnSize * 1.1));
this.pauseButton.on('pointerout', () => this.pauseButton.setDisplaySize(pauseBtnSize, pauseBtnSize));
this.pauseButton.on('pointerdown', () => this.togglePause());
        
        const missionText = this.add.text(width/2, height/2, 'MISI WBC\nWASD Gerak - Mouse Aim - Klik Tembak!', {
            font: 'bold 48px Arial', fill: '#FFFF00', stroke: '#000000', strokeThickness: 6, align: 'center'
        }).setOrigin(0.5).setDepth(20);
        this.time.delayedCall(3000, () => missionText.destroy());

        // ✅ TAMBAHAN 3: Panggil fungsi buat tombol fullscreen
        this.createFullscreenButton(width, height);
    }

    update() {
        if (this.isPaused || this.isGameOver) return;
        
        this.enemies.children.iterate((enemy) => {
            if (enemy && enemy.active) enemy.updateAI();
        });
        
        this.bullets.children.iterate((bullet) => {
            if (bullet && bullet.active) bullet.updateBullet();
        });
        
        this.player.updateMovement(this.wasd, this.arrows);
        this.updateLaserSight();
    }

    spawnEnemy() {
        if (this.isPaused || this.isGameOver) return;
        
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        const side = Phaser.Math.Between(0, 3);
        let x, y;
        
        if (side === 0) { x = -80; y = Phaser.Math.Between(80, height - 80); }
        else if (side === 1) { x = width + 80; y = Phaser.Math.Between(80, height - 80); }
        else if (side === 2) { x = Phaser.Math.Between(80, width - 80); y = -80; }
        else { x = Phaser.Math.Between(80, width - 80); y = height + 80; }
        
        const isVirus = Math.random() < 0.5;
        const hasShield = Math.random() < (this.SHIELD_CHANCE / 100);
        
        if (isVirus) {
            this.enemies.add(new VirusEnemy(this, x, y, hasShield));
        } else {
            this.enemies.add(new Bacteria(this, x, y, hasShield));
        }
    }

    fireAntibody() {
        const dx = this.mouseX - this.player.x;
        const dy = this.mouseY - this.player.y;
        const angle = Math.atan2(dy, dx);
        
        const bullet = new AntibodyBullet(this, this.player.x, this.player.y, angle);
        this.bullets.add(bullet);
    }

    handleBulletHit(bullet, enemy) {
        if (!bullet.active || !enemy.active) return;
        
        if (enemy.isWeakened) {
            return;
        }
        
        if (enemy.hasShield) {
            enemy.removeShield();
            enemy.weaken();
            bullet.destroy();
            return;
        }
        
        const roll = Phaser.Math.Between(1, 100);
        if (roll <= this.INSTAKILL_CHANCE) {
            enemy.destroy();
            
            const points = enemy.wasShielded ? 50 : Phaser.Math.Between(30, 250);
            this.score += points;
            this.scoreText.setText(`Skor: ${this.score} / ${this.WIN_SCORE}`);
            
            if (this.score >= this.WIN_SCORE) {
                this.triggerVictory();
            }
            
            return;
        }
        
        enemy.weaken();
        bullet.destroy();
    }

    handleEat(wbc, enemy) {
        if (this.isGameOver || this.isPaused || !enemy.active) return;
        
        const now = Date.now();
        if (now - this.lastDamageTime < this.DAMAGE_INVULNERABILITY) {
            return;
        }
        
        if (!enemy.isWeakened) {
            this.lastDamageTime = now;
            this.player.takeDamage(1);
            
            this.hpText.setText(`HP: ${this.player.HP}/500`);
            
            if (this.player.HP > 250) {
                this.hpText.setStyle({ fill: '#00FF00' });
            } else if (this.player.HP > 100) {
                this.hpText.setStyle({ fill: '#FFFF00' });
            } else {
                this.hpText.setStyle({ fill: '#FFA500' });
            }
            
            if (this.player.HP <= 0) {
                this.triggerGameOver();
            }
            return;
        }
        
        const points = enemy.wasShielded ? 50 : Phaser.Math.Between(30, 250);
        this.score += points;
        this.scoreText.setText(`Skor: ${this.score} / ${this.WIN_SCORE}`);
        
        this.createEatParticles(enemy.x, enemy.y);
        enemy.destroy();
        
        if (this.score >= this.WIN_SCORE) {
            this.triggerVictory();
        }
    }

    togglePause() {
        if (this.isGameOver) return;
        this.isPaused = !this.isPaused;
        if (this.isPaused) {
            this.player.body.setVelocity(0, 0);
            this.enemies.children.iterate((e) => { if (e && e.body) e.body.setVelocity(0, 0); });
            this.bullets.children.iterate((b) => { if (b && b.body) b.body.setVelocity(0, 0); });
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
        this.add.text(640, 300, 'MISI SELESAI!', {
            font: 'bold 72px Arial', fill: '#00FF00', stroke: '#000000', strokeThickness: 8
        }).setOrigin(0.5).setDepth(20);
        this.time.delayedCall(3000, () => this.scene.start('MenuScene'));
    }

    triggerGameOver() {
        this.isGameOver = true;
        this.add.text(640, 300, 'WBC GAGAL', {
            font: 'bold 72px Arial', fill: '#FFA500', stroke: '#000000', strokeThickness: 8
        }).setOrigin(0.5).setDepth(20);
        this.time.delayedCall(3000, () => this.scene.start('MenuScene'));
    }

    // ✅ TAMBAHAN 4: Fungsi membuat tombol Fullscreen di tengah atas
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

    updateLaserSight() {
        this.laserGraphics.clear();
        
        const dx = this.mouseX - this.player.x;
        const dy = this.mouseY - this.player.y;
        const angle = Math.atan2(dy, dx);
        
        const laserLength = 400;
        const endX = this.player.x + Math.cos(angle) * laserLength;
        const endY = this.player.y + Math.sin(angle) * laserLength;
        
        this.laserGraphics.lineStyle(1, 0x00FFFF, 0.3);
        this.laserGraphics.lineBetween(this.player.x, this.player.y, endX, endY);
    }

    createEatParticles(x, y) {
        for (let i = 0; i < 8; i++) {
            const particle = this.add.circle(x, y, 3, 0x00FF00);
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
}

// ===== CLASS WBC PLAYER =====
class WBCPlayer extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'wbc');
        scene.add.existing(this);
        scene.physics.add.existing(this);
        
        this.HP = 500;
        this.maxHP = 500;
        this.radius = 45;
        this.baseSpeed = 320;
        this.isFlipped = false;
        this.setScale(1.5);
        this.setTint(0xFFFFFF);
        this.setDepth(5);
        this.setCollideWorldBounds(true);
        
        this.body.setCircle(this.radius);
    }

    updateMovement(wasd, arrows) {
        let vx = 0;
        let vy = 0;
        
        if (arrows.left.isDown || wasd.left.isDown) { 
            vx = -this.baseSpeed; 
            this.setFlipX(true); 
            this.isFlipped = true; 
        }
        if (arrows.right.isDown || wasd.right.isDown) { 
            vx = this.baseSpeed; 
            this.setFlipX(false); 
            this.isFlipped = false; 
        }
        if (arrows.up.isDown || wasd.up.isDown) { vy = -this.baseSpeed; }
        if (arrows.down.isDown || wasd.down.isDown) { vy = this.baseSpeed; }
        
        if (vx !== 0 && vy !== 0) {
            vx *= 0.7071;
            vy *= 0.7071;
        }
        
        this.body.setVelocity(vx, vy);
    }

    takeDamage(amount) {
        this.HP -= amount;
        if (this.HP <= 0) this.HP = 0;
    }
}

// ===== CLASS ANTIBODY BULLET (BENTUK Y - DIPERKECIL & DIBALIK) =====
class AntibodyBullet extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, angle) {
        super(scene, x, y, 'antibodyBulletTex');
        scene.add.existing(this);
        scene.physics.add.existing(this);
        
        this.moveSpeed = 600;
        this.radius = 10; // ✅ Diperkecil dari 15
        
        this.body.setCircle(this.radius);
        this.setDepth(6);
        
        // ✅ DIBALIK: Cabang Y (dengan lingkaran cyan) menghadap ke arah tembak
        // Y default: batang di bawah, cabang di atas (menghadap ke atas)
        // angle + Math.PI/2 → cabang Y menghadap ke arah angle (ke musuh)
        this.setRotation(angle + Math.PI / 2);
        
        this.body.setVelocity(
            Math.cos(angle) * this.moveSpeed,
            Math.sin(angle) * this.moveSpeed
        );
        
        scene.time.delayedCall(3000, () => {
            if (this.active) this.destroy();
        });
    }

    updateBullet() {
        const width = this.scene.cameras.main.width;
        const height = this.scene.cameras.main.height;
        if (this.x < -50 || this.x > width + 50 || this.y < -50 || this.y > height + 50) {
            this.destroy();
        }
    }
}

// ===== CLASS BACTERIA - DENGAN TAMENG =====
class Bacteria extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, hasShield = false) {
        super(scene, x, y, 'bacteria');
        scene.add.existing(this);
        scene.physics.add.existing(this);
        
        this.scoreValue = 50;
        this.normalSpeed = 80;
        this.moveSpeed = 80;
        this.setScale(0.8);
        this.setTint(0x66FF66);
        this.setDepth(3);
        
        this.radius = 35;
        this.body.setCircle(this.radius);
        
        this.direction = Phaser.Math.Angle.Between(x, y, 640, 360) + Phaser.Math.FloatBetween(-0.5, 0.5);
        
        this.isWeakened = false;
        this.weakenTimer = 0;
        this.originalTint = 0x66FF66;
        
        this.hasShield = hasShield;
        this.wasShielded = hasShield;
        this.shieldGraphics = null;
        
        if (hasShield) {
            this.createShield(scene);
        }
    }

    createShield(scene) {
        this.shieldGraphics = scene.add.graphics().setDepth(2);
        this.updateShieldPosition();
    }

    updateShieldPosition() {
        if (this.shieldGraphics) {
            this.shieldGraphics.clear();
            this.shieldGraphics.fillStyle(0x00BFFF, 0.3);
            this.shieldGraphics.fillCircle(0, 0, this.radius + 12);
            this.shieldGraphics.lineStyle(3, 0x00FFFF, 0.6);
            this.shieldGraphics.strokeCircle(0, 0, this.radius + 12);
            this.shieldGraphics.lineStyle(2, 0xFFFFFF, 0.3);
            this.shieldGraphics.strokeCircle(0, 0, this.radius + 8);
        }
    }

    removeShield() {
        if (this.shieldGraphics) {
            this.shieldGraphics.clear();
            this.shieldGraphics.lineStyle(2, 0x00FFFF, 0.8);
            this.shieldGraphics.strokeCircle(0, 0, this.radius + 15);
            
            this.scene.tweens.add({
                targets: this.shieldGraphics,
                alpha: 0,
                duration: 300,
                onComplete: () => {
                    if (this.shieldGraphics) {
                        this.shieldGraphics.destroy();
                        this.shieldGraphics = null;
                    }
                }
            });
        }
        this.hasShield = false;
    }

    weaken() {
        this.isWeakened = true;
        this.weakenTimer = Date.now();
        this.moveSpeed = this.normalSpeed * 0.2;
        this.setTint(0x444444);
        this.setAlpha(1.0);
    }

    restoreNormal() {
        this.isWeakened = false;
        this.moveSpeed = this.normalSpeed;
        this.setTint(this.originalTint);
        this.setAlpha(1.0);
    }

    updateAI() {
        if (!this.body) return;
        
        if (this.isWeakened) {
            if (Date.now() - this.weakenTimer > 6000) {
                this.restoreNormal();
            }
        }
        
        if (this.shieldGraphics) {
            this.shieldGraphics.x = this.x;
            this.shieldGraphics.y = this.y;
        }
        
        if (Phaser.Math.Between(0, 100) < 2) {
            this.direction += Phaser.Math.FloatBetween(-0.4, 0.4);
        }
        this.body.setVelocity(Math.cos(this.direction) * this.moveSpeed, Math.sin(this.direction) * this.moveSpeed);
        this.setFlipX(Math.cos(this.direction) > 0);
        
        const width = this.scene.cameras.main.width;
        const height = this.scene.cameras.main.height;
        if (this.x < -200 || this.x > width + 200 || this.y < -200 || this.y > height + 200) {
            this.destroy();
        }
    }

    destroy() {
        if (this.shieldGraphics) {
            this.shieldGraphics.destroy();
        }
        super.destroy();
    }
}

// ===== CLASS VIRUS ENEMY - DENGAN TAMENG =====
class VirusEnemy extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, hasShield = false) {
        super(scene, x, y, 'virus');
        scene.add.existing(this);
        scene.physics.add.existing(this);
        
        this.isVirus = true;
        this.scoreValue = 100;
        this.normalSpeed = 100;
        this.moveSpeed = 100;
        this.setScale(1.2);
        this.setTint(0xFF00FF);
        this.setDepth(3);
        
        this.radius = 30;
        this.body.setCircle(this.radius);
        
        this.direction = Phaser.Math.Angle.Between(x, y, 640, 360) + Phaser.Math.FloatBetween(-0.5, 0.5);
        
        this.isWeakened = false;
        this.weakenTimer = 0;
        this.originalTint = 0xFF00FF;
        
        this.hasShield = hasShield;
        this.wasShielded = hasShield;
        this.shieldGraphics = null;
        
        if (hasShield) {
            this.createShield(scene);
        }
    }

    createShield(scene) {
        this.shieldGraphics = scene.add.graphics().setDepth(2);
        this.updateShieldPosition();
    }

    updateShieldPosition() {
        if (this.shieldGraphics) {
            this.shieldGraphics.clear();
            this.shieldGraphics.fillStyle(0x00BFFF, 0.3);
            this.shieldGraphics.fillCircle(0, 0, this.radius + 12);
            this.shieldGraphics.lineStyle(3, 0x00FFFF, 0.6);
            this.shieldGraphics.strokeCircle(0, 0, this.radius + 12);
            this.shieldGraphics.lineStyle(2, 0xFFFFFF, 0.3);
            this.shieldGraphics.strokeCircle(0, 0, this.radius + 8);
        }
    }

    removeShield() {
        if (this.shieldGraphics) {
            this.shieldGraphics.clear();
            this.shieldGraphics.lineStyle(2, 0x00FFFF, 0.8);
            this.shieldGraphics.strokeCircle(0, 0, this.radius + 15);
            
            this.scene.tweens.add({
                targets: this.shieldGraphics,
                alpha: 0,
                duration: 300,
                onComplete: () => {
                    if (this.shieldGraphics) {
                        this.shieldGraphics.destroy();
                        this.shieldGraphics = null;
                    }
                }
            });
        }
        this.hasShield = false;
    }

    weaken() {
        this.isWeakened = true;
        this.weakenTimer = Date.now();
        this.moveSpeed = this.normalSpeed * 0.2;
        this.setTint(0x444444);
        this.setAlpha(1.0);
    }

    restoreNormal() {
        this.isWeakened = false;
        this.moveSpeed = this.normalSpeed;
        this.setTint(this.originalTint);
        this.setAlpha(1.0);
    }

    updateAI() {
        if (!this.body) return;
        
        if (this.isWeakened) {
            if (Date.now() - this.weakenTimer > 6000) {
                this.restoreNormal();
            }
        }
        
        if (this.shieldGraphics) {
            this.shieldGraphics.x = this.x;
            this.shieldGraphics.y = this.y;
        }
        
        if (Phaser.Math.Between(0, 100) < 2) {
            this.direction += Phaser.Math.FloatBetween(-0.4, 0.4);
        }
        this.body.setVelocity(Math.cos(this.direction) * this.moveSpeed, Math.sin(this.direction) * this.moveSpeed);
        this.setFlipX(Math.cos(this.direction) > 0);
        
        const width = this.scene.cameras.main.width;
        const height = this.scene.cameras.main.height;
        if (this.x < -200 || this.x > width + 200 || this.y < -200 || this.y > height + 200) {
            this.destroy();
        }
    }

    destroy() {
        if (this.shieldGraphics) {
            this.shieldGraphics.destroy();
        }
        super.destroy();
    }
}