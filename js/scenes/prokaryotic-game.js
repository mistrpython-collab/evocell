// prokaryotic-game.js - Gameplay Prokaryotic dengan Pause Menu (Card Rock Gepeng)
export default class ProkaryoticGame extends Phaser.Scene {
  constructor() {
    super('ProkaryoticGame');
  }

  init(data) {
    this.selectedRole = data.role || 'prokaryotic';
    this.mode = data.mode || 'game';
    this.WIN_SCORE = this.mode === 'tutorial' ? 500 : 1500;
  }

  create() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // 1. BACKGROUND
    try {
      this.add.image(width / 2, height / 2, 'bgGameplay').setDepth(0);
    } catch (e) {
      this.add.rectangle(width / 2, height / 2, width, height, 0x0a2a2a).setDepth(0);
    }

    // 2. VARIABEL GAME
    this.player = null;
    this.enemies = this.add.group();
    this.score = 0;
    this.lives = 3;
    this.isGameOver = false;
    this.isPaused = false;
    this.lastDamageTime = 0;
    this.pauseMenuContainer = null; // Container menu pause
    this.pauseButton = null;        // Referensi tombol pause

    // 3. UI
    this.add.text(30, 30, 'PROKARYOTIC', {
      font: 'bold 28px Arial', fill: '#00ff00', stroke: '#000000', strokeThickness: 4
    }).setDepth(10);

    this.scoreText = this.add.text(width - 30, 30, `Skor: 0 / ${this.WIN_SCORE}`, {
      font: 'bold 28px Arial', fill: '#ffffff', stroke: '#000000', strokeThickness: 4
    }).setOrigin(1, 0).setDepth(10);

    this.livesText = this.add.text(30, 70, `Nyawa: ❤️❤️❤️`, {
      font: 'bold 28px Arial', fill: '#ff4444', stroke: '#000000', strokeThickness: 4
    }).setDepth(10);

    // 4. PLAYER
    this.player = new ProkaryoticCell(this, width / 2, height / 2);

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
      delay: 400,
      callback: this.spawnBacteria,
      callbackScope: this,
      loop: true
    });

    // 7. COLLISION
    this.physics.add.overlap(this.player, this.enemies, this.handleCollision, null, this);

    // 8. TOMBOL PAUSE (II) di pojok kiri bawah
    // 8. TOMBOL PAUSE (II) di pojok kiri bawah
const pauseBtnSize = 150; // ← Ubah angka ini kalau mau lebih besar/kecil
const pauseBtnMargin = 50; // ← Jarak dari tepi layar

this.pauseButton = this.add.image(
  pauseBtnMargin,
  height - pauseBtnMargin,
  'pause-btn'
);
this.pauseButton.setDisplaySize(pauseBtnSize, pauseBtnSize);
this.pauseButton.setInteractive({ useHandCursor: true });
this.pauseButton.setDepth(10);

// Hover effect
this.pauseButton.on('pointerover', () => {
  this.pauseButton.setDisplaySize(pauseBtnSize * 1.1, pauseBtnSize * 1.1);
});
this.pauseButton.on('pointerout', () => {
  this.pauseButton.setDisplaySize(pauseBtnSize, pauseBtnSize);
});
this.pauseButton.on('pointerdown', () => this.togglePause());
  }

  update() {
    if (this.isPaused || this.isGameOver) return;

    this.enemies.children.iterate((bacteria) => {
      if (bacteria && bacteria.active) bacteria.updateAI();
    });

    const speed = 320;
    let vx = 0, vy = 0;

    if (this.cursors.left.isDown || this.wasd.left.isDown) { vx = -speed; this.player.setFlipX(true); }
    if (this.cursors.right.isDown || this.wasd.right.isDown) { vx = speed; this.player.setFlipX(false); }
    if (this.cursors.up.isDown || this.wasd.up.isDown) vy = -speed;
    if (this.cursors.down.isDown || this.wasd.down.isDown) vy = speed;

    this.player.body.setVelocity(vx, vy);
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

    const sizeLevel = this.getBacteriaSizeLevel();
    this.enemies.add(new Bacteria(this, x, y, sizeLevel));
  }

  getBacteriaSizeLevel() {
    const playerSize = this.player.cellSize;
    const roll = Math.random();

    if (playerSize < 1.5) {
      if (roll < 0.75) return 1;
      if (roll < 0.95) return 2;
      return 3;
    } else if (playerSize < 2.0) {
      if (roll < 0.5) return 1;
      if (roll < 0.85) return 2;
      return 3;
    } else {
      if (roll < 0.3) return 1;
      if (roll < 0.7) return 2;
      return 3;
    }
  }

  handleCollision(player, bacteria) {
    if (this.isGameOver || this.isPaused || !bacteria.active) return;

    const currentTime = Date.now();
    if (currentTime - this.lastDamageTime < 500) return;

    const playerRadius = player.radius;
    const bacteriaRadius = bacteria.radius;

    if (playerRadius > bacteriaRadius * 1.1) {
      this.score += bacteria.scoreValue;
      this.scoreText.setText(`Skor: ${this.score} / ${this.WIN_SCORE}`);
      player.grow();
      bacteria.destroy();
      if (this.score >= this.WIN_SCORE) this.triggerVictory();
    } else if (bacteriaRadius > playerRadius * 1.1) {
      this.loseLife();
      this.lastDamageTime = currentTime;
    }
  }

  loseLife() {
    this.lives--;
    let hearts = '❤️'.repeat(this.lives);
    this.livesText.setText(`Nyawa: ${hearts}`);

    if (this.lives <= 0) {
      this.triggerGameOver();
    } else {
      this.player.setPosition(640, 360);
      this.player.body.setVelocity(0, 0);
    }
  }

  // ===== TOGGLE PAUSE =====
  togglePause() {
    if (this.isGameOver) return;

    this.isPaused = !this.isPaused;

    if (this.isPaused) {
      // Hentikan semua gerakan
      this.player.body.setVelocity(0, 0);
      this.enemies.children.iterate((b) => {
        if (b && b.body) b.body.setVelocity(0, 0);
      });

      this.showPauseMenu();
    } else {
      this.hidePauseMenu();
    }
  }

  // ===== TAMPILKAN MENU PAUSE =====
  showPauseMenu() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Buat container untuk semua elemen menu pause
    this.pauseMenuContainer = this.add.container(0, 0).setDepth(20);

    // 1. Overlay gelap transparan
    const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.7);
    overlay.setInteractive();
    this.pauseMenuContainer.add(overlay);

    // 2. Panel Card Rock (GEPENG — landscape)
    // Card rock aslinya portrait, kita paksa jadi landscape pakai setDisplaySize
    const panel = this.add.image(width / 2, height / 2, 'cardRock');
    panel.setDisplaySize(500, 320); // Lebar 500, tinggi 320 (landscape)
    this.pauseMenuContainer.add(panel);

    // 3. TOMBOL RESUME
    const resumeBtn = this.add.image(width / 2, height / 2 - 40, 'resume-btn');
    resumeBtn.setDisplaySize(300, 80); // Sesuaikan ukuran
    resumeBtn.setInteractive({ useHandCursor: true });

    resumeBtn.on('pointerover', () => resumeBtn.setDisplaySize(320, 85));
    resumeBtn.on('pointerout', () => resumeBtn.setDisplaySize(300, 80));
    resumeBtn.on('pointerdown', () => {
      console.log('Resume clicked');
      this.togglePause();
    });
    this.pauseMenuContainer.add(resumeBtn);

    // 4. TOMBOL EXIT
    const exitBtn = this.add.image(width / 2, height / 2 + 70, 'exit-btn');
    exitBtn.setDisplaySize(300, 80);
    exitBtn.setInteractive({ useHandCursor: true });

    exitBtn.on('pointerover', () => exitBtn.setDisplaySize(320, 85));
    exitBtn.on('pointerout', () => exitBtn.setDisplaySize(300, 80));
    exitBtn.on('pointerdown', () => {
      console.log('Exit clicked');
      this.scene.start('MenuScene');
    });
    this.pauseMenuContainer.add(exitBtn);
  }

  // ===== HAPUS MENU PAUSE =====
  hidePauseMenu() {
    if (this.pauseMenuContainer) {
      this.pauseMenuContainer.destroy();
      this.pauseMenuContainer = null;
    }
  }

  triggerVictory() {
    this.isGameOver = true;
    this.add.text(640, 300, 'VICTORY!', {
      font: 'bold 72px Arial', fill: '#00ff00', stroke: '#000000', strokeThickness: 8
    }).setOrigin(0.5).setDepth(20);
    this.time.delayedCall(3000, () => this.scene.start('MenuScene'));
  }

  triggerGameOver() {
    this.isGameOver = true;
    this.add.text(640, 300, 'GAME OVER', {
      font: 'bold 72px Arial', fill: '#ff0000', stroke: '#000000', strokeThickness: 8
    }).setOrigin(0.5).setDepth(20);
    this.time.delayedCall(3000, () => this.scene.start('MenuScene'));
  }
}

// ===== CLASS PLAYER =====
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

    this.createAnimations(scene);
  }

  createAnimations(scene) {
    const texture = scene.textures.get('prokaryotic');
    if (texture && texture.frameTotal >= 2) {
      if (!scene.anims.exists('prokaryoticIdle')) {
        scene.anims.create({
          key: 'prokaryoticIdle',
          frames: scene.anims.generateFrameNumbers('prokaryotic', { start: 0, end: 1 }),
          frameRate: 4,
          repeat: -1
        });
      }
      this.play('prokaryoticIdle');
    }
  }

  updateBody() {
    const halfSize = Math.min(this.width, this.height) / 2;
    const textureRadius = halfSize * 0.75;
    this.radius = textureRadius * this.scaleX;
    this.body.setCircle(
      textureRadius,
      this.width / 2 - textureRadius,
      this.height / 2 - textureRadius
    );
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
    this.cellSize += 0.1;
    if (this.cellSize > 2.5) this.cellSize = 2.5;
    this.setScale(this.baseScale * this.cellSize);
    this.updateBody();

    this.scene.tweens.add({
      targets: this,
      scaleX: this.scaleX * 1.1,
      scaleY: this.scaleY * 1.1,
      duration: 100,
      yoyo: true,
      ease: 'Back.easeOut'
    });
  }
}

// ===== CLASS ENEMY =====
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
    this.moveSpeed = speed;
    this.setScale(scale);
    this.setTint(tint);
    this.updateBody();
    this.setDepth(4);

    this.direction = Phaser.Math.Angle.Between(x, y, 640, 360) + Phaser.Math.FloatBetween(-0.5, 0.5);
    this.createAnimations(scene);
  }

  createAnimations(scene) {
    const texture = scene.textures.get('bacteria');
    if (texture && texture.frameTotal >= 2) {
      if (!scene.anims.exists('bacteriaSwim')) {
        scene.anims.create({
          key: 'bacteriaSwim',
          frames: scene.anims.generateFrameNumbers('bacteria', { start: 0, end: 1 }),
          frameRate: 6,
          repeat: -1
        });
      }
      this.play('bacteriaSwim');
    }
  }

  updateBody() {
    const halfSize = Math.min(this.width, this.height) / 2;
    const textureRadius = halfSize * 0.65;
    this.radius = textureRadius * this.scaleX;
    this.body.setCircle(
      textureRadius,
      this.width / 2 - textureRadius,
      this.height / 2 - textureRadius
    );
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

    if (this.x < -200 || this.x > width + 200 ||
        this.y < -200 || this.y > height + 200) {
      this.destroy();
    }
  }
}