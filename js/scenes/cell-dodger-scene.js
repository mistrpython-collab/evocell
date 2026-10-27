// js/scenes/cell-dodger-scene.js
export default class CellDodgerScene extends Phaser.Scene {
    constructor() {
        super("CellDodgerScene");
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // 1. Background
        this.add.image(width / 2, height / 2, "bgMain").setAlpha(0.5);

        // 2. ✅ PLAYER - Gerakan 4 Arah
        this.player = this.physics.add.sprite(width / 2, height / 2, "prokaryotic");
        this.player.setScale(2);
        this.player.setCollideWorldBounds(true);

        // 3. ✅ GRUP RINTANGAN - Pakai Bakteri
        this.obstacles = this.physics.add.group();

        // 4. Spawn Rintangan setiap 800ms (lebih cepat)
        this.spawnEvent = this.time.addEvent({
            delay: 800,
            callback: this.spawnObstacle,
            callbackScope: this,
            loop: true
        });

        // 5. ✅ KONTROL 4 ARAH (Keyboard)
        this.cursors = this.input.keyboard.createCursorKeys();
        this.keys = this.input.keyboard.addKeys({
            up: Phaser.Input.Keyboard.KeyCodes.W,
            down: Phaser.Input.Keyboard.KeyCodes.S,
            left: Phaser.Input.Keyboard.KeyCodes.A,
            right: Phaser.Input.Keyboard.KeyCodes.D
        });

        // 6. Instruksi
        this.add.text(width / 2, height - 40, "Gunakan WASD atau Panah untuk bergerak!", {
            font: "18px Arial",
            fill: "#ffffff",
            stroke: "#000000",
            strokeThickness: 3
        }).setOrigin(0.5);

        // 7. Tombol Pause (Kanan Atas)
        this.createPauseButton();

        // 8. Pause Menu
        this.createPauseMenu();

        // 9. Cek Tabrakan
        this.physics.add.collider(this.player, this.obstacles, this.hitObstacle, null, this);

        // State pause
        this.isPaused = false;

        // 10. ✅ Skor & Difficulty
        this.score = 0;
        this.difficultyTimer = 0;
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
            this.scene.start("MenuScene");
        });
        this.pauseMenu.add(this.exitBtn);
    }

    update() {
        if (this.isPaused) return;

        // ✅ GERAKAN 4 ARAH
        const speed = 300;
        let velocityX = 0;
        let velocityY = 0;

        // Kiri/Kanan
        if (this.cursors.left.isDown || this.keys.left.isDown) {
            velocityX = -speed;
        } else if (this.cursors.right.isDown || this.keys.right.isDown) {
            velocityX = speed;
        }

        // Atas/Bawah
        if (this.cursors.up.isDown || this.keys.up.isDown) {
            velocityY = -speed;
        } else if (this.cursors.down.isDown || this.keys.down.isDown) {
            velocityY = speed;
        }

        // Set velocity
        this.player.setVelocity(velocityX, velocityY);

        // ✅ Tingkatkan kesulitan seiring waktu
        this.difficultyTimer++;
        if (this.difficultyTimer % 600 === 0) { // Setiap 10 detik (60fps * 10)
            this.spawnEvent.delay = Math.max(300, this.spawnEvent.delay - 100); // Spawn lebih cepat, min 300ms
        }
    }

    spawnObstacle() {
        const width = this.cameras.main.width;
        const x = Phaser.Math.Between(50, width - 50);
        
        // ✅ PAKAI BAKTERI (bukan virus)
        const obstacle = this.obstacles.create(x, -50, "bacteria"); 
        obstacle.setScale(1.5);
        obstacle.setVelocityY(Phaser.Math.Between(150, 300)); // Kecepatan acak

        obstacle.checkWorldBounds = true;
        obstacle.outOfBoundsKill = true;
    }

    hitObstacle(player, obstacle) {
        this.physics.pause();
        this.spawnEvent.paused = true;
        player.setTint(0xff0000);
        
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        this.add.text(width / 2, height / 2 - 50, "GAME OVER", {
            font: "bold 64px Arial",
            fill: "#ff0000",
            stroke: "#000000",
            strokeThickness: 8
        }).setOrigin(0.5);

        this.add.text(width / 2, height / 2 + 50, "Klik untuk Kembali ke Menu", {
            font: "24px Arial",
            fill: "#00ff00",
            stroke: "#000000",
            strokeThickness: 3
        }).setOrigin(0.5);

        this.input.once("pointerdown", () => {
            this.scene.start("MenuScene");
        });
    }

    togglePause() {
        this.isPaused = !this.isPaused;

        if (this.isPaused) {
            this.physics.pause();
            this.spawnEvent.paused = true;
            this.pauseMenu.setVisible(true);
            this.pauseBtn.setVisible(false);
        } else {
            this.physics.resume();
            this.spawnEvent.paused = false;
            this.pauseMenu.setVisible(false);
            this.pauseBtn.setVisible(true);
        }
    }
}