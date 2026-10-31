// virus-game.js - Gameplay Virus (Dash Bisa Infect)
import { fullscreenManager } from '../utils/fullscreen.js';
import { getLang } from '../utils/translations.js'; // ✅ TAMBAH IMPORT

export default class VirusGame extends Phaser.Scene {
    constructor() {
        super('VirusGame');
        this.fullscreenBtn = null;
    }

    init(data) {
        this.selectedRole = data.role || 'virus';
        this.mode = data.mode || 'game';
        this.mission = data.mission || 'Misi 1';
        
        this.WIN_SCORE = 2500;
        this.WBC_SPAWN_DELAY = 550;
        this.INFECTION_COOLDOWN = 5000;
        this.DAMAGE_PER_TICK = 1;
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
        this.score = 0;
        this.isGameOver = false;
        this.isPaused = false;
        this.pauseMenuContainer = null;
        this.pauseButton = null;
        
        // ✅ JUDUL - TERJEMAHAN
        this.add.text(30, 30, getLang('virusTitle'), {
            font: 'bold 28px Arial', fill: '#ff00ff', stroke: '#000000', strokeThickness: 4
        }).setDepth(10);
        
        // ✅ SKOR - TERJEMAHAN
        this.scoreText = this.add.text(width - 30, 30, `${getLang('score')}: 0 / ${this.WIN_SCORE}`, {
            font: 'bold 28px Arial', fill: '#ffffff', stroke: '#000000', strokeThickness: 4
        }).setOrigin(1, 0).setDepth(10);
        
        this.hpText = this.add.text(30, 70, `HP: 100/100`, {
            font: 'bold 24px Arial', fill: '#00ff00', stroke: '#000000', strokeThickness: 3
        }).setDepth(10);
        
        this.timerText = this.add.text(30, 100, '⏱️ 5s', {
            font: 'bold 28px Arial', 
            fill: '#00ffff',
            stroke: '#000000', 
            strokeThickness: 4
        }).setDepth(10);
        
        this.player = new VirusCell(this, width/2, height/2);
        
        this.input.on('pointermove', (pointer) => {
            if (!this.isPaused && !this.isGameOver) {
                this.player.targetX = pointer.x;
                this.player.targetY = pointer.y;
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
        
        // ✅ MISI VIRUS - TERJEMAHAN
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
        
        if (secondsLeft <= 2) {
            const alpha = 0.5 + Math.sin(now / 100) * 0.5;
            this.timerText.setAlpha(alpha);
        } else {
            this.timerText.setAlpha(1);
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
        
        const scoreValue = wbc.scoreValue;
        this.score += scoreValue;
        this.scoreText.setText(`${getLang('score')}: ${this.score} / ${this.WIN_SCORE}`);
        
        virus.lastInfectionTime = Date.now();
        
        this.createInfectionParticles(wbc.x, wbc.y);
        wbc.destroy();
        
        virus.setPosition(wbc.x, wbc.y);
        virus.lastInfectionTime = Date.now();
        
        virus.isDashing = false;
        if (virus.blinkTween) {
            virus.blinkTween.stop();
            virus.blinkTween = null;
        }
        if (virus.dashWarningText) {
            virus.dashWarningText.destroy();
            virus.dashWarningText = null;
        }
        if (virus.dashLaser) {
            virus.dashLaser.destroy();
            virus.dashLaser = null;
        }
        virus.setTint(0xFF00FF);
        
        if (this.score >= this.WIN_SCORE) {
            this.triggerVictory();
        }
    }

    createInfectionParticles(x, y) {
        for (let i = 0; i < 8; i++) {
            const particle = this.add.circle(x, y, 3, 0xFF00FF);
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
            this.player.lastInfectionTime = now;
            
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

    // ✅ VICTORY - TERJEMAHAN
    triggerVictory() {
        this.isGameOver = true;
        this.add.text(640, 300, getLang('virusVictory'), {
            font: 'bold 72px Arial', fill: '#00ff00', stroke: '#000000', strokeThickness: 8
        }).setOrigin(0.5).setDepth(20);
        this.time.delayedCall(3000, () => this.scene.start('MenuScene'));
    }

    // ✅ GAME OVER - TERJEMAHAN
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

// ===== CLASS VIRUS CELL =====
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
        this.setTint(0xFF00FF);
        this.setDepth(5);
        this.setCollideWorldBounds(true);
        
        this.lastInfectionTime = Date.now();
        this.targetX = x;
        this.targetY = y;
        
        this.initialPhase = true;
        this.initialPhaseDuration = 5000;
        this.initialPhaseStartTime = Date.now();
        this.initialSpeed = 130;
        
        this.normalSpeed = 40;
        this.dashSpeed = 500;
        this.currentSpeed = this.initialSpeed;
        
        this.direction = Math.random() * Math.PI * 2;
        this.body.setCircle(this.radius);
        
        this.isDashing = false;
        this.dashCooldown = 4000;
        this.lastDashTime = Date.now();
        this.blinkTween = null;
        this.wobbleAngle = 0;
        this.dashTrail = null;
        this.dashDirection = 0;
        this.dashWarningText = null;
        this.dashLaser = null;
    }

    updateAI() {
        if (!this.body || !this.active) return;
        
        const currentTime = Date.now();
        const timeSinceSpawn = currentTime - this.initialPhaseStartTime;
        
        if (this.initialPhase) {
            const dx = this.targetX - this.x;
            const dy = this.targetY - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance > 5) {
                const dirX = dx / distance;
                const dirY = dy / distance;
                this.body.setVelocity(dirX * this.initialSpeed, dirY * this.initialSpeed);
                this.setFlipX(dx > 0);
            } else {
                this.body.setVelocity(0, 0);
            }
            
            if (timeSinceSpawn >= this.initialPhaseDuration) {
                this.initialPhase = false;
                this.currentSpeed = this.normalSpeed;
                this.lastDashTime = Date.now();
            }
            return;
        }
        
        if (this.isDashing) {
            this.updateDash();
            return;
        }
        
        const timeSinceLastDash = currentTime - this.lastDashTime;
        
        if (timeSinceLastDash >= 2000 && !this.blinkTween) {
            this.startCharging();
        }
        
        if (timeSinceLastDash >= this.dashCooldown && this.blinkTween) {
            this.startDash();
        }
        
        if (this.dashLaser) {
            this.updateDashLaser();
        }
        
        if (!this.blinkTween) {
            this.wobbleAngle += 0.05;
            const wobbleX = Math.sin(this.wobbleAngle) * 0.3;
            const wobbleY = Math.cos(this.wobbleAngle * 1.3) * 0.3;
            
            const dx = this.targetX - this.x;
            const dy = this.targetY - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance > 5) {
                const dirX = dx / distance;
                const dirY = dy / distance;
                this.body.setVelocity(
                    dirX * this.currentSpeed + wobbleX * 20,
                    dirY * this.currentSpeed + wobbleY * 20
                );
                this.setFlipX(dx > 0);
            } else {
                this.body.setVelocity(0, 0);
            }
        } else {
            this.body.setVelocity(0, 0);
        }
    }

    startCharging() {
        if (this.blinkTween) {
            this.blinkTween.stop();
        }
        
        this.blinkTween = this.scene.tweens.addCounter({
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
                    this.setTint(0xFF00FF);
                }
            }
        });
        
        if (!this.dashWarningText) {
            this.dashWarningText = this.scene.add.text(this.x, this.y - 50, '⚠️ DASH!', {
                font: 'bold 32px Arial',
                fill: '#ff0000',
                stroke: '#000000',
                strokeThickness: 4
            }).setOrigin(0.5).setDepth(20);
        }
        this.dashWarningText.setPosition(this.x, this.y - 50);
        this.dashWarningText.visible = true;
        
        this.scene.tweens.add({
            targets: this.dashWarningText,
            alpha: 0.3,
            duration: 200,
            yoyo: true,
            repeat: -1
        });
        
        this.createDashLaser();
    }

    createDashLaser() {
        if (this.dashLaser) {
            this.dashLaser.destroy();
        }
        
        const dx = this.targetX - this.x;
        const dy = this.targetY - this.y;
        const angle = Math.atan2(dy, dx);
        
        const laserLength = 400;
        
        const endX = this.x + Math.cos(angle) * laserLength;
        const endY = this.y + Math.sin(angle) * laserLength;
        
        this.dashLaser = this.scene.add.graphics().setDepth(4);
        
        this.dashLaser.lineStyle(8, 0x00BFFF, 0.4);
        this.dashLaser.lineBetween(this.x, this.y, endX, endY);
        
        this.dashLaser.lineStyle(4, 0x00FFFF, 0.8);
        this.dashLaser.lineBetween(this.x, this.y, endX, endY);
        
        this.dashLaser.lineStyle(2, 0xFFFFFF, 1.0);
        this.dashLaser.lineBetween(this.x, this.y, endX, endY);
        
        this.dashLaser.fillStyle(0x00FFFF, 0.8);
        this.dashLaser.fillCircle(endX, endY, 6);
        this.dashLaser.fillStyle(0xFFFFFF, 1.0);
        this.dashLaser.fillCircle(endX, endY, 3);
    }

    updateDashLaser() {
        if (!this.dashLaser) return;
        
        const dx = this.targetX - this.x;
        const dy = this.targetY - this.y;
        const angle = Math.atan2(dy, dx);
        
        const laserLength = 400;
        
        const endX = this.x + Math.cos(angle) * laserLength;
        const endY = this.y + Math.sin(angle) * laserLength;
        
        this.dashLaser.clear();
        
        this.dashLaser.lineStyle(8, 0x00BFFF, 0.4);
        this.dashLaser.lineBetween(this.x, this.y, endX, endY);
        
        this.dashLaser.lineStyle(4, 0x00FFFF, 0.8);
        this.dashLaser.lineBetween(this.x, this.y, endX, endY);
        
        this.dashLaser.lineStyle(2, 0xFFFFFF, 1.0);
        this.dashLaser.lineBetween(this.x, this.y, endX, endY);
        
        this.dashLaser.fillStyle(0x00FFFF, 0.8);
        this.dashLaser.fillCircle(endX, endY, 6);
        this.dashLaser.fillStyle(0xFFFFFF, 1.0);
        this.dashLaser.fillCircle(endX, endY, 3);
    }

    startDash() {
        if (this.blinkTween) {
            this.blinkTween.stop();
            this.blinkTween = null;
        }
        
        if (this.dashWarningText) {
            this.dashWarningText.destroy();
            this.dashWarningText = null;
        }
        
        if (this.dashLaser) {
            this.dashLaser.destroy();
            this.dashLaser = null;
        }
        
        this.isDashing = true;
        this.currentSpeed = this.dashSpeed;
        this.lastDashTime = Date.now();
        
        const dx = this.targetX - this.x;
        const dy = this.targetY - this.y;
        this.dashDirection = Math.atan2(dy, dx);
        
        this.setTint(0xFF4400);
        this.dashTrail = this.scene.add.graphics().setDepth(3);
        
        this.scene.time.delayedCall(800, () => {
            if (this.active) {
                this.isDashing = false;
                this.currentSpeed = this.normalSpeed;
                this.setTint(0xFF00FF);
                if (this.dashTrail) {
                    this.dashTrail.destroy();
                    this.dashTrail = null;
                }
            }
        });
    }

    updateDash() {
        this.body.setVelocity(
            Math.cos(this.dashDirection) * this.currentSpeed,
            Math.sin(this.dashDirection) * this.currentSpeed
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

    destroy() {
        if (this.blinkTween) {
            this.blinkTween.stop();
        }
        if (this.dashTrail) {
            this.dashTrail.destroy();
        }
        if (this.dashWarningText) {
            this.dashWarningText.destroy();
        }
        if (this.dashLaser) {
            this.dashLaser.destroy();
        }
        super.destroy();
    }
}

// ===== CLASS WBC =====
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