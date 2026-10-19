// wbc-game.js - WBC dengan Tembakan Cepat + Hanya Musuh Besar yang Lemah
export default class WBCGame extends Phaser.Scene {
    constructor() {
        super('WBCGame');
    }

    init(data) {
        this.selectedRole = data.role || 'wbc';
        this.mode = data.mode || 'game';
        this.mission = data.mission || 'Misi 1';
        
        this.WIN_SCORE = 2500;
        this.ENEMY_SPAWN_DELAY = 450;
        this.FIRE_RATE = 200; // ✅ TEMBAK SANGAT CEPAT (200ms = 5 tembakan/detik)
        this.WEAKEN_DURATION = 6000; // ✅ 6 DETIK EFFECT SLOW
        this.DAMAGE_INVULNERABILITY = 500;
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        
        // 1. BACKGROUND
        try {
            const bg = this.add.image(width/2, height/2, 'bgVirus');
            bg.setDepth(0);
            bg.setDisplaySize(width, height);
        } catch (e) {
            this.add.rectangle(width/2, height/2, width, height, 0x660000).setDepth(0);
        }
        
        // 2. VARIABEL GAME
        this.player = null;
        this.enemies = this.add.group();
        this.bullets = this.add.group();
        this.score = 0;
        this.isGameOver = false;
        this.isPaused = false;
        this.pauseMenuContainer = null;
        this.pauseButton = null;
        this.lastFireTime = 0;
        this.lastDamageTime = 0;
        
        // 3. LASER SIGHT (Hanya visual, tidak damage)
        this.laserGraphics = this.add.graphics().setDepth(4);
        
        // 4. UI
        this.add.text(30, 30, 'WBC', {
            font: 'bold 28px Arial', 
            fill: '#FFFF00', 
            stroke: '#000000', 
            strokeThickness: 4
        }).setDepth(10);
        
        this.scoreText = this.add.text(width - 30, 30, `Skor: 0 / ${this.WIN_SCORE}`, {
            font: 'bold 28px Arial', 
            fill: '#FFFFFF', 
            stroke: '#000000', 
            strokeThickness: 4
        }).setOrigin(1, 0).setDepth(10);
        
        this.hpText = this.add.text(30, 70, `HP: 500/500`, {
            font: 'bold 24px Arial', 
            fill: '#00FF00', 
            stroke: '#000000', 
            strokeThickness: 4
        }).setDepth(10);
        
        // 5. PLAYER
        this.player = new WBCPlayer(this, width/2, height/2);
        
        // 6. KONTROL
        this.input.on('pointermove', (pointer) => {
            if (!this.isPaused && !this.isGameOver) {
                this.player.targetX = pointer.x;
                this.player.targetY = pointer.y;
            }
        });
        
        this.input.on('pointerdown', (pointer) => {
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
        
        // 7. SPAWN SYSTEM
        this.time.addEvent({
            delay: this.ENEMY_SPAWN_DELAY,
            callback: this.spawnEnemy,
            callbackScope: this,
            loop: true
        });
        
        // 8. COLLISION
        this.physics.add.overlap(this.player, this.enemies, this.handleEat, null, this);
        this.physics.add.overlap(this.bullets, this.enemies, this.handleBulletHit, null, this);
        
        // 9. TOMBOL PAUSE
        const pauseBtnSize = 150;
        const pauseBtnMargin = 50;
        this.pauseButton = this.add.image(pauseBtnMargin, height - pauseBtnMargin, 'pause-btn');
        this.pauseButton.setDisplaySize(pauseBtnSize, pauseBtnSize);
        this.pauseButton.setInteractive({ useHandCursor: true });
        this.pauseButton.setDepth(10);
        this.pauseButton.on('pointerover', () => this.pauseButton.setDisplaySize(pauseBtnSize * 1.1, pauseBtnSize * 1.1));
        this.pauseButton.on('pointerout', () => this.pauseButton.setDisplaySize(pauseBtnSize, pauseBtnSize));
        this.pauseButton.on('pointerdown', () => this.togglePause());
        
        // 10. NOTIFIKASI
        const missionText = this.add.text(width/2, height/2, 'MISI WBC\nTembak Cepat & Makan Patogen!', {
            font: 'bold 48px Arial', 
            fill: '#FFFF00', 
            stroke: '#000000', 
            strokeThickness: 6, 
            align: 'center'
        }).setOrigin(0.5).setDepth(20);
        this.time.delayedCall(3000, () => missionText.destroy());
        
        console.log('✅ WBC Game created - Fire rate: 200ms');
    }

    update() {
        if (this.isPaused || this.isGameOver) return;
        
        this.enemies.children.iterate((enemy) => {
            if (enemy && enemy.active) enemy.updateAI();
        });
        
        this.bullets.children.iterate((bullet) => {
            if (bullet && bullet.active) bullet.updateBullet();
        });
        
        this.player.updateAI();
        
        // ✅ UPDATE LASER (hanya visual)
        this.updateLaserSight();
        
        // ✅ AUTO-FIRE SANGAT CEPAT (setiap 200ms)
        const now = Date.now();
        if (now - this.lastFireTime >= this.FIRE_RATE) {
            this.fireAntibody();
            this.lastFireTime = now;
        }
    }

    updateLaserSight() {
        // Laser HANYA VISUAL - tidak damage
        this.laserGraphics.clear();
        
        const dx = this.player.targetX - this.player.x;
        const dy = this.player.targetY - this.player.y;
        const angle = Math.atan2(dy, dx);
        const laserLength = 150; // Lebih pendek
        
        const endX = this.player.x + Math.cos(angle) * laserLength;
        const endY = this.player.y + Math.sin(angle) * laserLength;
        
        // Laser tipis transparan
        this.laserGraphics.lineStyle(2, 0x00FFFF, 0.3);
        this.laserGraphics.lineBetween(this.player.x, this.player.y, endX, endY);
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
        
        const isVirus = Math.random() < 0.3;
        
        if (isVirus) {
            this.enemies.add(new VirusEnemy(this, x, y));
        } else {
            const sizeLevel = this.getEnemySizeLevel();
            this.enemies.add(new Bacteria(this, x, y, sizeLevel));
        }
    }

    getEnemySizeLevel() {
        const roll = Math.random();
        if (roll < 0.6) return 1;
        if (roll < 0.9) return 2;
        return 3;
    }

    fireAntibody() {
        const dx = this.player.targetX - this.player.x;
        const dy = this.player.targetY - this.player.y;
        const angle = Math.atan2(dy, dx);
        
        const bullet = new AntibodyBullet(this, this.player.x, this.player.y, angle);
        this.bullets.add(bullet);
    }

    handleBulletHit(bullet, enemy) {
        if (!bullet.active || !enemy.active) return;
        
        // ✅ HANYA MUSUH SIZE 2 & 3 YANG BISA LEMAH
        if (enemy.sizeLevel >= 2 || enemy.isVirus) {
            enemy.weaken();
            console.log('💥 Enemy weakened! Size:', enemy.sizeLevel);
        }
        
        bullet.destroy();
    }

    handleEat(wbc, enemy) {
        if (this.isGameOver || this.isPaused || !enemy.active) return;
        
        const now = Date.now();
        if (now - this.lastDamageTime < this.DAMAGE_INVULNERABILITY) {
            return;
        }
        
        // Jika tabrak musuh NORMAL
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
        
        // Makan musuh lemah
        const scoreValue = enemy.scoreValue * 4;
        this.score += scoreValue;
        this.scoreText.setText(`Skor: ${this.score} / ${this.WIN_SCORE}`);
        
        this.createEatParticles(enemy.x, enemy.y);
        enemy.destroy();
        
        if (this.score >= this.WIN_SCORE) {
            this.triggerVictory();
        }
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
            font: 'bold 72px Arial', 
            fill: '#00FF00', 
            stroke: '#000000', 
            strokeThickness: 8
        }).setOrigin(0.5).setDepth(20);
        this.time.delayedCall(3000, () => this.scene.start('MenuScene'));
    }

    triggerGameOver() {
        this.isGameOver = true;
        this.add.text(640, 300, 'WBC GAGAL', {
            font: 'bold 72px Arial', 
            fill: '#FFA500', 
            stroke: '#000000', 
            strokeThickness: 8
        }).setOrigin(0.5).setDepth(20);
        this.time.delayedCall(3000, () => this.scene.start('MenuScene'));
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
        
        this.targetX = x;
        this.targetY = y;
        this.currentSpeed = 0;
        this.acceleration = 18;
        this.deceleration = 15;
        
        this.body.setCircle(this.radius);
    }

    updateAI() {
        const dx = this.targetX - this.x;
        const dy = this.targetY - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (dx > 10 && !this.isFlipped) { this.setFlipX(true); this.isFlipped = true; }
        else if (dx < -10 && this.isFlipped) { this.setFlipX(false); this.isFlipped = false; }
        
        if (distance < 5) { 
            this.body.setVelocity(0, 0); 
            this.currentSpeed = 0;
            return; 
        }
        
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

    takeDamage(amount) {
        this.HP -= amount;
        if (this.HP <= 0) {
            this.HP = 0;
        }
    }
}

// ===== CLASS ANTIBODY BULLET - PELURU Y TERLIHAT =====
class AntibodyBullet extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, angle) {
        // Buat texture Y yang LEBIH TERLIHAT dan BESAR
        const graphics = scene.make.graphics({ x: 0, y: 0, add: false });
        
        // Garis Y KUNING TERANG
        graphics.lineStyle(5, 0xFFFF00, 1);
        graphics.lineBetween(0, 0, 0, -15);
        graphics.lineBetween(0, -15, -8, -22);
        graphics.lineBetween(0, -15, 8, -22);
        
        // Lingkaran CYAN di tengah
        graphics.fillStyle(0x00FFFF, 1);
        graphics.fillCircle(0, -15, 5);
        
        // Glow effect
        graphics.lineStyle(2, 0xFFFFFF, 0.8);
        graphics.strokeCircle(0, -15, 7);
        
        graphics.generateTexture('antibody', 30, 30);
        graphics.destroy();
        
        super(scene, x, y, 'antibody');
        scene.add.existing(this);
        scene.physics.add.existing(this);
        
        this.moveSpeed = 500; // Lebih cepat
        this.direction = angle;
        this.radius = 12;
        
        this.body.setCircle(this.radius);
        this.setDepth(6);
        
        // Rotasi peluru mengikuti arah
        this.setRotation(angle);
        
        this.body.setVelocity(
            Math.cos(angle) * this.moveSpeed,
            Math.sin(angle) * this.moveSpeed
        );
        
        // Hancurkan setelah 3 detik
        scene.time.delayedCall(3000, () => {
            if (this.active) this.destroy();
        });
        
        console.log('🔫 Bullet fired');
    }

    updateBullet() {
        const width = this.scene.cameras.main.width;
        const height = this.scene.cameras.main.height;
        if (this.x < -50 || this.x > width + 50 || this.y < -50 || this.y > height + 50) {
            this.destroy();
        }
    }
}

// ===== CLASS BACTERIA - HANYA SIZE 2 & 3 BISA LEMAH =====
class Bacteria extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, sizeLevel) {
        super(scene, x, y, 'bacteria');
        scene.add.existing(this);
        scene.physics.add.existing(this);
        
        let scale, scoreValue, speed, tint;
        if (sizeLevel === 1) {
            scale = 0.4;
            scoreValue = 10;
            speed = 120;
            tint = 0x66FF66;
        } else if (sizeLevel === 2) {
            scale = 0.65;
            scoreValue = 25;
            speed = 80;
            tint = 0xFF6666;
        } else {
            scale = 1.0;
            scoreValue = 50;
            speed = 50;
            tint = 0x6666FF;
        }
        
        this.sizeLevel = sizeLevel;
        this.scoreValue = scoreValue;
        this.normalSpeed = speed;
        this.moveSpeed = speed;
        this.setScale(scale);
        this.setTint(tint);
        this.setDepth(3);
        
        this.radius = scale * 50;
        this.body.setCircle(this.radius);
        
        this.direction = Phaser.Math.Angle.Between(x, y, 640, 360) + Phaser.Math.FloatBetween(-0.5, 0.5);
        
        this.isWeakened = false;
        this.weakenTimer = 0;
        this.originalTint = tint;
    }

    weaken() {
        // ✅ HANYA SIZE 2 & 3 YANG BISA LEMAH
        if (this.sizeLevel < 2) return;
        
        this.isWeakened = true;
        this.weakenTimer = Date.now();
        this.moveSpeed = this.normalSpeed * 0.2; // Sangat lambat (80% slow)
        this.setTint(0x888888); // Abu-abu
        
        console.log('🐌 Bacteria weakened! Size:', this.sizeLevel);
    }

    updateAI() {
        if (!this.body) return;
        
        if (this.isWeakened) {
            const now = Date.now();
            if (now - this.weakenTimer > 6000) { // ✅ 6 DETIK
                this.isWeakened = false;
                this.moveSpeed = this.normalSpeed;
                this.setTint(this.originalTint);
            }
        }
        
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

// ===== CLASS VIRUS ENEMY - BISA LEMAH =====
class VirusEnemy extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'virus');
        scene.add.existing(this);
        scene.physics.add.existing(this);
        
        this.isVirus = true; // ✅ Flag untuk bisa weaken
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
    }

    weaken() {
        this.isWeakened = true;
        this.weakenTimer = Date.now();
        this.moveSpeed = this.normalSpeed * 0.2; // Sangat lambat
        this.setTint(0x888888);
        
        console.log('🐌 Virus weakened!');
    }

    updateAI() {
        if (!this.body) return;
        
        if (this.isWeakened) {
            const now = Date.now();
            if (now - this.weakenTimer > 6000) { // ✅ 6 DETIK
                this.isWeakened = false;
                this.moveSpeed = this.normalSpeed;
                this.setTint(this.originalTint);
            }
        }
        
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