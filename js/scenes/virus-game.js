// virus-game.js - Gameplay Virus dengan Infection Mechanic
export default class VirusGame extends Phaser.Scene {
    constructor() {
        super('VirusGame');
    }

    init(data) {
        this.selectedRole = data.role || 'virus';
        this.mode = data.mode || 'game';
        this.mission = data.mission || 'Misi 1';
        
        // Game settings
        this.WIN_SCORE = 2500;
        this.WBC_SPAWN_DELAY = 450; // Sedikit lebih lambat dari prokaryotic
        this.MAX_ALLIES = 15;
        this.INFECTION_COOLDOWN = 7000; // 7 detik
        this.DAMAGE_PER_TICK = 1;
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        
        // 1. BACKGROUND (darah/blood vessel)
        try {
            this.add.image(width/2, height/2, 'bgVirus').setDepth(0);
        } catch (e) {
            this.add.rectangle(width/2, height/2, width, height, 0x330000).setDepth(0);
        }
        
        // 2. VARIABEL GAME
        this.player = null;
        this.wbcs = this.add.group();
        this.allies = []; // Array untuk InfectedCell allies
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
        
        // Timer warning text (akan muncul saat timer < 2 detik)
        this.timerWarningText = this.add.text(width/2, 150, '⚠️ CARI SEL!', {
            font: 'bold 36px Arial', fill: '#ff0000', stroke: '#000000', strokeThickness: 4
        }).setOrigin(0.5).setDepth(15);
        this.timerWarningText.visible = false;
        
        // 4. PLAYER (Virus Utama)
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
        
        // 7. COLLISION (Virus vs WBC)
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
        
        // 10. NOTIFIKASI MISI
        const missionText = this.add.text(width/2, height/2, 'MISI VIRUS\nInfeksi Sel untuk Bertahan!', {
            font: 'bold 48px Arial', fill: '#ff00ff', stroke: '#000000', strokeThickness: 6, align: 'center'
        }).setOrigin(0.5).setDepth(20);
        this.time.delayedCall(3000, () => missionText.destroy());
    }

    update() {
        if (this.isPaused || this.isGameOver) return;
        
        // Update WBC
        this.wbcs.children.iterate((wbc) => {
            if (wbc && wbc.active) wbc.updateAI();
        });
        
        // Update Allies (formasi lingkaran)
        this.updateAlliesFormation();
        
        // Keyboard movement
        const speed = 320;
        let vx = 0, vy = 0;
        if (this.cursors.left.isDown || this.wasd.left.isDown) { vx = -speed; this.player.setFlipX(true); }
        if (this.cursors.right.isDown || this.wasd.right.isDown) { vx = speed; this.player.setFlipX(false); }
        if (this.cursors.up.isDown || this.wasd.up.isDown) vy = -speed;
        if (this.cursors.down.isDown || this.wasd.down.isDown) vy = speed;
        this.player.body.setVelocity(vx, vy);
        
        // Update UI Timer Warning
        const timeSinceInfection = Date.now() - this.player.lastInfectionTime;
        if (timeSinceInfection > 5000) { // Warning saat < 2 detik
            this.timerWarningText.visible = true;
            this.timerWarningText.setAlpha(0.5 + Math.sin(Date.now() / 100) * 0.5); // Berkedip
        } else {
            this.timerWarningText.visible = false;
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
        if (roll < 0.6) return 1; // 60% kecil
        if (roll < 0.9) return 2; // 30% sedang
        return 3; // 10% besar
    }

    handleInfection(virus, wbc) {
        if (this.isGameOver || this.isPaused || !wbc.active) return;
        if (this.allies.length >= this.MAX_ALLIES) return; // Max allies
        
        // ✅ INFEKSI BERHASIL!
        const scoreValue = wbc.scoreValue;
        this.score += scoreValue;
        this.scoreText.setText(`Skor: ${this.score} / ${this.WIN_SCORE}`);
        
        // Reset timer infection
        virus.lastInfectionTime = Date.now();
        
        // Efek partikel saat infeksi
        this.createInfectionParticles(wbc.x, wbc.y);
        
        // Hancurkan WBC
        wbc.destroy();
        
        // Spawn InfectedCell (ally)
        const ally = new InfectedCell(this, virus.x, virus.y, wbc.radius, virus);
        this.allies.push(ally);
        this.add.existing(ally);
        this.physics.add.existing(ally);
        
        // Update allies counter
        this.alliesText.setText(`Virus Allies: ${this.allies.length}/${this.MAX_ALLIES}`);
        
        // Collision untuk ally
        this.physics.add.overlap(ally, this.wbcs, (ally, wbc) => {
            this.handleAllyInfection(ally, wbc);
        });
        
        // Cek win condition
        if (this.score >= this.WIN_SCORE) {
            this.triggerVictory();
        }
    }

    handleAllyInfection(ally, wbc) {
        if (this.isGameOver || this.isPaused || !wbc.active) return;
        if (this.allies.length >= this.MAX_ALLIES) return;
        
        // ✅ INFEKSI BERHASIL!
        const scoreValue = wbc.scoreValue;
        this.score += scoreValue;
        this.scoreText.setText(`Skor: ${this.score} / ${this.WIN_SCORE}`);
        
        // Reset timer infection ally
        ally.lastInfectionTime = Date.now();
        
        // Efek partikel
        this.createInfectionParticles(wbc.x, wbc.y);
        
        // Hancurkan WBC
        wbc.destroy();
        
        // Spawn InfectedCell baru (jika belum max)
        if (this.allies.length < this.MAX_ALLIES) {
            const newAlly = new InfectedCell(this, ally.x, ally.y, wbc.radius, this.player);
            this.allies.push(newAlly);
            this.add.existing(newAlly);
            this.physics.add.existing(newAlly);
            
            // Collision untuk ally baru
            this.physics.add.overlap(newAlly, this.wbcs, (newAlly, wbc) => {
                this.handleAllyInfection(newAlly, wbc);
            });
        }
        
        // Update allies counter
        this.alliesText.setText(`Virus Allies: ${this.allies.length}/${this.MAX_ALLIES}`);
        
        // Cek win condition
        if (this.score >= this.WIN_SCORE) {
            this.triggerVictory();
        }
    }

    createInfectionParticles(x, y) {
        // Spawn 8 partikel magenta
        for (let i = 0; i < 8; i++) {
            const particle = this.add.circle(x, y, 3, 0xFF00FF);
            particle.setDepth(20);
            
            const angle = (Math.PI * 2 / 8) * i;
            const speed = 100;
            
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
        
        const distance = 100; // Jarak dari main virus
        
        this.allies.forEach((ally, index) => {
            if (!ally.active) return;
            
            // Hitung posisi formasi lingkaran
            const angle = (index / totalAllies) * Math.PI * 2;
            const targetX = this.player.x + Math.cos(angle) * distance;
            const targetY = this.player.y + Math.sin(angle) * distance;
            
            // Smooth follow
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
        
        // Check main virus
        const timeSinceInfection = now - this.player.lastInfectionTime;
        if (timeSinceInfection > this.INFECTION_COOLDOWN) {
            this.player.takeDamage(this.DAMAGE_PER_TICK);
            this.player.lastInfectionTime = now;
            this.updateHPText();
        }
        
        // Check semua allies
        this.allies.forEach((ally, index) => {
            if (!ally.active) return;
            
            const allyTimeSinceInfection = now - ally.lastInfectionTime;
            if (allyTimeSinceInfection > this.INFECTION_COOLDOWN) {
                ally.HP -= this.DAMAGE_PER_TICK;
                ally.lastInfectionTime = now;
                
                // Update HP bar ally
                ally.updateHPBar();
                
                if (ally.HP <= 0) {
                    ally.destroy();
                    this.allies.splice(index, 1);
                    this.alliesText.setText(`Virus Allies: ${this.allies.length}/${this.MAX_ALLIES}`);
                }
            }
        });
    }

    updateHPText() {
        const hp = this.player.HP;
        this.hpText.setText(`HP: ${hp}/100`);
        
        // Warna HP
        if (hp > 50) {
            this.hpText.setStyle({ fill: '#00ff00' });
        } else if (hp > 25) {
            this.hpText.setStyle({ fill: '#ffff00' });
        } else {
            this.hpText.setStyle({ fill: '#ff0000' });
        }
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

// ===== CLASS VIRUS CELL (Player Utama) =====
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
        this.setTint(0xFF00FF); // Magenta
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

    takeDamage(amount) {
        this.HP -= amount;
        if (this.HP <= 0) {
            this.HP = 0;
            this.scene.triggerGameOver();
        }
    }
}

// ===== CLASS INFECTED CELL (Virus Ally) =====
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
        this.setScale(radius / 35); // Scale sesuai ukuran WBC asal
        
        this.body.setCircle(this.radius);
        
        // ✅ BLINK EFFECT (magenta-putih seperti boss)
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
                    this.setTint(0xFF00FF); // Magenta
                } else {
                    this.setTint(0xFFFFFF); // Putih
                }
            }
        });
        
        // HP Bar kecil di atas ally
        this.hpBarBg = scene.add.graphics().setDepth(6);
        this.hpBarFill = scene.add.graphics().setDepth(6);
        this.updateHPBar();
    }

    updateHPBar() {
        const barWidth = 30;
        const barHeight = 5;
        const barX = this.x - barWidth / 2;
        const barY = this.y - this.radius - 10;
        
        this.hpBarBg.clear();
        this.hpBarBg.fillStyle(0x330000, 1);
        this.hpBarBg.fillRect(barX, barY, barWidth, barHeight);
        
        this.hpBarFill.clear();
        const hpPercent = this.HP / 25;
        this.hpBarFill.fillStyle(0x00ff00, 1);
        this.hpBarFill.fillRect(barX, barY, barWidth * hpPercent, barHeight);
    }

    update() {
        // Update posisi HP bar
        const barWidth = 30;
        const barHeight = 5;
        this.hpBarBg.setPosition(this.x - barWidth / 2, this.y - this.radius - 10);
        this.hpBarFill.setPosition(this.x - barWidth / 2, this.y - this.radius - 10);
    }

    destroy() {
        if (this.blinkTween) {
            this.blinkTween.stop();
        }
        if (this.hpBarBg) {
            this.hpBarBg.destroy();
        }
        if (this.hpBarFill) {
            this.hpBarFill.destroy();
        }
        super.destroy();
    }
}

// ===== CLASS WBC (White Blood Cell - Target Infeksi) =====
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
            tint = 0xFFFFFF; // Putih
        } else if (sizeLevel === 2) {
            scale = 0.65;
            scoreValue = 100;
            speed = 80;
            tint = 0xADD8E6; // Biru muda
        } else {
            scale = 1.0;
            scoreValue = 150;
            speed = 50;
            tint = 0x87CEEB; // Biru langit
        }
        
        this.sizeLevel = sizeLevel;
        this.scoreValue = scoreValue;
        this.moveSpeed = speed;
        this.setScale(scale);
        this.setTint(tint);
        this.setDepth(3);
        
        this.radius = scale * 50; // Approximate radius
        this.body.setCircle(this.radius);
        
        this.direction = Phaser.Math.Angle.Between(x, y, 640, 360) + Phaser.Math.FloatBetween(-0.5, 0.5);
    }

    updateAI() {
        if (!this.body) return;
        
        // Random wander
        if (Phaser.Math.Between(0, 100) < 2) {
            this.direction += Phaser.Math.FloatBetween(-0.4, 0.4);
        }
        
        this.body.setVelocity(
            Math.cos(this.direction) * this.moveSpeed,
            Math.sin(this.direction) * this.moveSpeed
        );
        this.setFlipX(Math.cos(this.direction) > 0);
        
        // Boundary check
        const width = this.scene.cameras.main.width;
        const height = this.scene.cameras.main.height;
        if (this.x < -200 || this.x > width + 200 || this.y < -200 || this.y > height + 200) {
            this.destroy();
        }
    }
}