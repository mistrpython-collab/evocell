// prokaryotic-game.js - Gameplay Prokaryotic (Adaptasi dari mekanik ikan-makan)
export default class ProkaryoticGame extends Phaser.Scene {
    constructor() {
        super('ProkaryoticGame');
    }

    init(data) {
        this.selectedRole = data.role || 'prokaryotic';
        this.mode = data.mode || 'game'; // 'tutorial' atau 'game'
        this.WIN_SCORE = this.mode === 'tutorial' ? 500 : 1500;
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        
        // ===== 1. BACKGROUND GAMEPLAY =====
        // Coba load gambar, jika gagal pakai warna fallback hijau gelap (sitoplasma)
        try {
            this.add.image(width/2, height/2, 'bgGameplay').setDepth(0);
        } catch (e) {
            this.add.rectangle(width/2, height/2, width, height, 0x0a2a2a).setDepth(0);
        }

        // ===== 2. VARIABEL GAME =====
        this.player = null;
        this.enemies = this.add.group();
        this.score = 0;
        this.lives = 3;
        this.isGameOver = false;
        this.isPaused = false;

        // ===== 3. UI (Skor, Nyawa, Target) =====
        this.add.text(30, 30, 'PROKARYOTIC', {
            font: 'bold 28px Arial', fill: '#00ff00', stroke: '#000000', strokeThickness: 4
        }).setDepth(10);

        this.scoreText = this.add.text(width - 30, 30, `Skor: 0 / ${this.WIN_SCORE}`, {
            font: 'bold 28px Arial', fill: '#ffffff', stroke: '#000000', strokeThickness: 4
        }).setOrigin(1, 0).setDepth(10);

        this.livesText = this.add.text(30, 70, `Nyawa: ❤️❤️❤️`, {
            font: 'bold 28px Arial', fill: '#ff4444', stroke: '#000000', strokeThickness: 4
        }).setDepth(10);

        // ===== 4. PLAYER (Sel Prokaryotic) =====
        this.player = new ProkaryoticCell(this, width/2, height/2);

        // ===== 5. KONTROL (Mouse & Keyboard) =====
        this.input.on('pointermove', (pointer) => {
            if (!this.isPaused && !this.isGameOver) {
                this.player.moveToPointer(pointer);
            }
        });

        this.cursors = this.input.keyboard.createCursorKeys();
        this.wasd = this.input.keyboard.addKeys({
            up: Phaser.Input.Keyboard.KeyCodes.W, down: Phaser.Input.Keyboard.KeyCodes.S,
            left: Phaser.Input.Keyboard.KeyCodes.A, right: Phaser.Input.Keyboard.KeyCodes.D
        });

        this.input.keyboard.on('keydown-ESC', () => this.togglePause());

        // ===== 6. SPAWN SYSTEM (Muncul dari 4 sisi layar) =====
        this.time.addEvent({
            delay: 400, // Spawn setiap 400ms (bisa dipercepat/diperlambat)
            callback: this.spawnBacteria,
            callbackScope: this,
            loop: true
        });

        // ===== 7. COLLISION (Mekanik Makan) =====
        this.physics.add.overlap(this.player, this.enemies, this.handleCollision, null, this);

        // ===== 8. TOMBOL BACK =====
        const backBtn = this.add.text(30, height - 50, '← Kembali ke Menu', {
            font: 'bold 20px Arial', fill: '#00ffff', stroke: '#000000', strokeThickness: 3
        }).setInteractive({ useHandCursor: true }).setDepth(10);
        
        backBtn.on('pointerdown', () => this.scene.start('MenuScene'));
    }

    update() {
        if (this.isPaused || this.isGameOver) return;

        // Update AI musuh
        this.enemies.children.iterate((bacteria) => {
            if (bacteria) bacteria.updateAI();
        });

        // Keyboard movement override
        const speed = 320;
        let vx = 0, vy = 0;
        if (this.cursors.left.isDown || this.wasd.left.isDown) { vx = -speed; this.player.setFlipX(true); }
        if (this.cursors.right.isDown || this.wasd.right.isDown) { vx = speed; this.player.setFlipX(false); }
        if (this.cursors.up.isDown || this.wasd.up.isDown) vy = -speed;
        if (this.cursors.down.isDown || this.wasd.down.isDown) vy = speed;

        if (vx !== 0 || vy !== 0) {
            this.player.body.setVelocity(vx, vy);
        }
    }

    spawnBacteria() {
        if (this.isPaused || this.isGameOver) return;
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        const side = Phaser.Math.Between(0, 3);
        let x, y;

        if (side === 0) { x = -60; y = Phaser.Math.Between(60, height - 60); } // Kiri
        else if (side === 1) { x = width + 60; y = Phaser.Math.Between(60, height - 60); } // Kanan
        else if (side === 2) { x = Phaser.Math.Between(60, width - 60); y = -60; } // Atas
        else { x = Phaser.Math.Between(60, width - 60); y = height + 60; } // Bawah

        const sizeLevel = this.getBacteriaSizeLevel();
        this.enemies.add(new Bacteria(this, x, y, sizeLevel));
    }

    getBacteriaSizeLevel() {
        const playerSize = this.player.cellSize;
        const roll = Math.random();
        if (playerSize < 1.5) return roll < 0.7 ? 1 : (roll < 0.95 ? 2 : 3);
        if (playerSize < 2.5) return roll < 0.4 ? 1 : (roll < 0.8 ? 2 : 3);
        return roll < 0.2 ? 1 : (roll < 0.6 ? 2 : 3);
    }

    handleCollision(player, bacteria) {
        if (this.isGameOver || this.isPaused || !bacteria.active) return;

        if (player.radius > bacteria.radius * 1.05) {
            // MAKAN: Player lebih besar
            this.score += bacteria.scoreValue;
            this.scoreText.setText(`Skor: ${this.score} / ${this.WIN_SCORE}`);
            player.grow();
            bacteria.destroy();

            if (this.score >= this.WIN_SCORE) this.triggerVictory();
        } else if (bacteria.radius > player.radius * 1.05) {
            // DAMAGE: Bakteri lebih besar
            this.loseLife();
        }
    }

    loseLife() {
        this.lives--;
        let hearts = '❤️'.repeat(this.lives);
        this.livesText.setText(`Nyawa: ${hearts}`);
        
        this.cameras.main.shake(200, 0.01);
        this.cameras.main.flash(200, 255, 0, 0);

        if (this.lives <= 0) {
            this.triggerGameOver();
        } else {
            this.player.setPosition(640, 360);
            this.player.body.setVelocity(0, 0);
        }
    }

    togglePause() {
        this.isPaused = !this.isPaused;
        if (this.isPaused) {
            this.add.text(640, 360, 'PAUSED', { font: 'bold 64px Arial', fill: '#ffffff', stroke: '#000000', strokeThickness: 6 }).setOrigin(0.5).setDepth(20).setName('pauseText');
            this.player.body.setVelocity(0, 0);
        } else {
            const p = this.children.getByName('pauseText');
            if (p) p.destroy();
        }
    }

    triggerVictory() {
        this.isGameOver = true;
        this.add.text(640, 300, 'VICTORY!', { font: 'bold 72px Arial', fill: '#00ff00', stroke: '#000000', strokeThickness: 8 }).setOrigin(0.5).setDepth(20);
        this.time.delayedCall(3000, () => this.scene.start('MenuScene'));
    }

    triggerGameOver() {
        this.isGameOver = true;
        this.add.text(640, 300, 'GAME OVER', { font: 'bold 72px Arial', fill: '#ff0000', stroke: '#000000', strokeThickness: 8 }).setOrigin(0.5).setDepth(20);
        this.time.delayedCall(3000, () => this.scene.start('MenuScene'));
    }
}

// ===== CLASS PLAYER (PROKARYOTIC CELL) =====
class ProkaryoticCell extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'prokaryotic');
        scene.add.existing(this);
        scene.physics.add.existing(this);
        this.cellSize = 1;
        this.baseScale = 0.6;
        this.radius = 30;
        this.baseSpeed = 320;
        this.isFlipped = false;
        this.setScale(this.baseScale);
        this.updateBody();
        this.setCollideWorldBounds(true);
        this.setDepth(5);
    }

    updateBody() {
        const halfSize = Math.min(this.width, this.height) / 2;
        const textureRadius = halfSize * 0.55;
        this.radius = textureRadius * this.scaleX;
        this.body.setCircle(textureRadius, this.width / 2 - textureRadius, this.height / 2 - textureRadius);
    }

    moveToPointer(pointer) {
        const dx = pointer.x - this.x;
        const dy = pointer.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (dx > 5 && !this.isFlipped) { this.setFlipX(true); this.isFlipped = true; }
        else if (dx < -5 && this.isFlipped) { this.setFlipX(false); this.isFlipped = false; }

        if (distance < 5) { this.body.setVelocity(0, 0); return; }

        const minSpeed = 80;
        const speedFactor = Math.min(distance / 100, 1);
        const speed = minSpeed + (this.baseSpeed - minSpeed) * speedFactor;
        this.body.setVelocity((dx / distance) * speed, (dy / distance) * speed);
    }

    grow() {
        this.cellSize += 0.15;
        if (this.cellSize > 3) this.cellSize = 3;
        this.setScale(this.baseScale * this.cellSize);
        this.updateBody();
    }
}

// ===== CLASS ENEMY (BACTERIA) =====
class Bacteria extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, sizeLevel) {
        super(scene, x, y, 'bacteria');
        scene.add.existing(this);
        scene.physics.add.existing(this);

        let scale, scoreValue, speed, tint;
        if (sizeLevel === 1) { scale = 0.4; scoreValue = 10; speed = 120; tint = 0x66FF66; }
        else if (sizeLevel === 2) { scale = 0.7; scoreValue = 25; speed = 80; tint = 0xFF6666; }
        else { scale = 1.1; scoreValue = 50; speed = 50; tint = 0x6666FF; }

        this.sizeLevel = sizeLevel;
        this.scoreValue = scoreValue;
        this.moveSpeed = speed;
        this.setScale(scale);
        this.setTint(tint);
        this.updateBody();
        this.setCollideWorldBounds(true);
        this.setBounce(1, 1);
        this.setDepth(4);

        this.direction = Phaser.Math.Angle.Between(x, y, 640, 360) + Phaser.Math.FloatBetween(-0.5, 0.5);
    }

    updateBody() {
        const halfSize = Math.min(this.width, this.height) / 2;
        const textureRadius = halfSize * 0.55;
        this.radius = textureRadius * this.scaleX;
        this.body.setCircle(textureRadius, this.width / 2 - textureRadius, this.height / 2 - textureRadius);
    }

    updateAI() {
        if (Phaser.Math.Between(0, 100) < 2) this.direction += Phaser.Math.FloatBetween(-0.4, 0.4);
        this.body.setVelocity(Math.cos(this.direction) * this.moveSpeed, Math.sin(this.direction) * this.moveSpeed);
        this.setFlipX(Math.cos(this.direction) > 0);
    }
}