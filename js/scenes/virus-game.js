// virus-game.js - Gameplay Virus (NO WARNING, Background Fixed)
export default class VirusGame extends Phaser.Scene {
    constructor() {
        super('VirusGame');
    }

    init(data) {
        this.selectedRole = data.role || 'virus';
        this.mode = data.mode || 'game';
        this.mission = data.mission || 'Misi 1';
        
        this.WIN_SCORE = 2500;
        this.WBC_SPAWN_DELAY = 450;
        this.MAX_ALLIES = 15;
        this.INFECTION_COOLDOWN = 7000;
        this.DAMAGE_PER_TICK = 1;
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        
        // 1. BACKGROUND - Pastikan muncul
        try {
            const bg = this.add.image(width/2, height/2, 'bgVirus');
            bg.setDepth(0);
            bg.setDisplaySize(width, height); // Paksa full screen
            console.log('Background virus loaded successfully');
        } catch (e) {
            console.log('Background virus tidak load, pakai rectangle merah');
            this.add.rectangle(width/2, height/2, width, height, 0x660000).setDepth(0);
        }
        
        // 2. VARIABEL GAME
        this.player = null;
        this.wbcs = this.add.group();
        this.allies = [];
        this.score = 0;
        this.isGameOver = false;
        this.isPaused = false;
        this.pauseMenuContainer = null;
        this.pauseButton = null;
        
        // 3. UI
        this.add.text(30, 30, 'VIRUS', {
            font: 'bold 28px Arial', fill: '#ff00ff', stroke: '#000000', strokeThickness: 4
        }).setDepth(10);
        
        this.scoreText = this.add.text(width - 30, 30, `Skor: 0 / ${this.WIN_SCORE}`, {
            font: 'bold 28px Arial', fill: '#ffffff', stroke: '#000000', strokeThickness: 4
        }).setOrigin(1, 0).setDepth(10);
        
        this.hpText = this.add.text(30, 70, `HP: 100/100`, {
            font: 'bold 24px Arial', fill: '#00ff00', stroke: '#000000', strokeThickness: 3
        }).setDepth(10);
        
        this.alliesText = this.add.text(30, 100, `Virus Allies: 0/${this.MAX_ALLIES}`, {
            font: 'bold 20px Arial', fill: '#ff00ff', stroke: '#000000', strokeThickness: 3
        }).setDepth(10);
        
        // ✅ HAPUS WARNING TEXT - Tidak perlu lagi
        
        // 4. PLAYER
        this.player = new VirusCell(this, width/2, height/2);
        
        // 5. KONTROL
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
        
        // 6. SPAWN SYSTEM
        this.time.addEvent({
            delay: this.WBC_SPAWN_DELAY,
            callback: this.spawnWBC,
            callbackScope: this,
            loop: true
        });
        
        // 7. COLLISION
        this.physics.add.overlap(this.player, this.wbcs, this.handleInfection, null, this);
        
        // 8. TIMER CHECK (setiap 1 detik)
        this.time.addEvent({
            delay: 1000,
            callback: this.checkDamage,
            callbackScope: this,
            loop: true
        });
        
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
        const missionText = this.add.text(width/2, height/2, 'MISI VIRUS\nInfeksi Sel untuk Bertahan!', {
            font: 'bold 48px Arial', fill: '#ff00ff', stroke: '#000000', strokeThickness: 6, align: 'center'
        }).setOrigin(0.5).setDepth(20);
        this.time.delayedCall(3000, () => missionText.destroy());
    }

    update() {
        if (this.isPaused || this.isGameOver) return;
        
        this.wbcs.children.iterate((wbc) => {
            if (wbc && wbc.active) wbc.updateAI();
        });
        
        this.updateAlliesFormation();
        
        const speed = 320;
        let vx = 0, vy = 0;
        if (this.cursors.left.isDown || this.wasd.left.isDown) { vx = -speed; this.player.setFlipX(true); }
        if (this.cursors.right.isDown || this.wasd.right.isDown) { vx = speed; this.player.setFlipX(false); }
        if (this.cursors.up.isDown || this.wasd.up.isDown) vy = -speed;
        if (this.cursors.down.isDown || this.wasd.down.isDown) vy = speed;
        this.player.body.setVelocity(vx, vy);
        
        // ✅ TIDAK ADA WARNING LAGI
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

    handleInfection(virus, wbc) {
        if (this.isGameOver || this.isPaused || !wbc.active) return;
        
        const scoreValue = wbc.scoreValue;
        this.score += scoreValue;
        this.scoreText.setText(`Skor: ${this.score} / ${this.WIN_SCORE}`);
        
        virus.lastInfectionTime = Date.now();
        
        this.createInfectionParticles(wbc.x, wbc.y);
        wbc.destroy();
        
        if (this.allies.length < this.MAX_ALLIES) {
            const ally = new InfectedCell(this, virus.x, virus.y, wbc.radius, virus);
            this.allies.push(ally);
            this.add.existing(ally);
            this.physics.add.existing(ally);
            
            this.physics.add.overlap(ally, this.wbcs, (ally, wbc) => {
                this.handleAllyInfection(ally, wbc);
            });
            
            this.alliesText.setText(`Virus Allies: ${this.allies.length}/${this.MAX_ALLIES}`);
        }
        
        if (this.score >= this.WIN_SCORE) {
            this.triggerVictory();
        }
    }

    handleAllyInfection(ally, wbc) {
        if (this.isGameOver || this.isPaused || !wbc.active) return;
        
        const scoreValue = wbc.scoreValue;
        this.score += scoreValue;
        this.scoreText.setText(`Skor: ${this.score} / ${this.WIN_SCORE}`);
        
        ally.lastInfectionTime = Date.now();
        
        this.createInfectionParticles(wbc.x, wbc.y);
        wbc.destroy();
        
        if (this.allies.length < this.MAX_ALLIES) {
            const newAlly = new InfectedCell(this, ally.x, ally.y, wbc.radius, this.player);
            this.allies.push(newAlly);
            this.add.existing(newAlly);
            this.physics.add.existing(newAlly);
            
            this.physics.add.overlap(newAlly, this.wbcs, (newAlly, wbc) => {
                this.handleAllyInfection(newAlly, wbc);
            });
        }
        
        this.alliesText.setText(`Virus Allies: ${this.allies.length}/${this.MAX_ALLIES}`);
        
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

    updateAlliesFormation() {
        const totalAllies = this.allies.length;
        if (totalAllies === 0) return;
        
        const distance = 100;
        
        this.allies.forEach((ally, index) => {
            if (!ally.active) return;
            
            const angle = (index / totalAllies) * Math.PI * 2;
            const targetX = this.player.x + Math.cos(angle) * distance;
            const targetY = this.player.y + Math.sin(angle) * distance;
            
            const dx = targetX - ally.x;
            const dy = targetY - ally.y;
            const followSpeed = 0.05;
            
            ally.x += dx * followSpeed;
            ally.y += dy * followSpeed;
        });
    }

    checkDamage() {
        if (this.isPaused || this.isGameOver) return;
        
        const now = Date.now();
        
        this.allies.forEach((ally, index) => {
            if (!ally.active) return;
            
            const allyTimeSinceInfection = now - ally.lastInfectionTime;
            if (allyTimeSinceInfection > this.INFECTION_COOLDOWN) {
                ally.HP -= this.DAMAGE_PER_TICK;
                ally.lastInfectionTime = now;
                
                if (ally.HP <= 0) {
                    ally.destroy();
                    this.allies.splice(index, 1);
                    this.alliesText.setText(`Virus Allies: ${this.allies.length}/${this.MAX_ALLIES}`);
                }
            }
        });
    }

    togglePause() {
        if (this.isGameOver) return;
        this.isPaused = !this.isPaused;
        if (this.isPaused) {
            this.player.body.setVelocity(0, 0);
            this.wbcs.children.iterate((w) => { if (w && w.body) w.body.setVelocity(0, 0); });
            this.allies.forEach(ally => { if (ally.active) ally.body.setVelocity(0, 0); });
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
            font: 'bold 72px Arial', fill: '#00ff00', stroke: '#000000', strokeThickness: 8
        }).setOrigin(0.5).setDepth(20);
        this.time.delayedCall(3000, () => this.scene.start('MenuScene'));
    }

    triggerGameOver() {
        this.isGameOver = true;
        this.add.text(640, 300, 'VIRUS MATI', {
            font: 'bold 72px Arial', fill: '#ff0000', stroke: '#000000', strokeThickness: 8
        }).setOrigin(0.5).setDepth(20);
        this.time.delayedCall(3000, () => this.scene.start('MenuScene'));
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
        this.setScale(1.5);
        this.setTint(0xFF00FF);
        this.setDepth(5);
        this.setCollideWorldBounds(true);
        
        this.lastInfectionTime = Date.now();
        this.currentSpeed = 0;
        this.acceleration = 18;
        this.deceleration = 15;
        
        this.body.setCircle(this.radius);
    }

    moveToPointer(pointer) {
        const dx = pointer.x - this.x;
        const dy = pointer.y - this.y;
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
}

// ===== CLASS INFECTED CELL =====
class InfectedCell extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, radius, mainVirus) {
        super(scene, x, y, 'virus');
        scene.add.existing(this);
        scene.physics.add.existing(this);
        
        this.HP = 25;
        this.radius = radius;
        this.mainVirus = mainVirus;
        this.lastInfectionTime = Date.now();
        
        this.setTint(0xFF00FF);
        this.setDepth(4);
        this.setScale(radius / 35);
        
        this.body.setCircle(this.radius);
        
        // BLINK EFFECT
        this.blinkTween = scene.tweens.addCounter({
            from: 0,
            to: 1,
            duration: 200,
            repeat: -1,
            yoyo: true,
            onUpdate: (tween) => {
                if (!this.active) return;
                const val = tween.getValue();
                if (val > 0.5) {
                    this.setTint(0xFF00FF);
                } else {
                    this.setTint(0xFFFFFF);
                }
            }
        });
    }

    destroy() {
        if (this.blinkTween) {
            this.blinkTween.stop();
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
        
        this.radius = scale * 15;
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