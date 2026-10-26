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

        // 2. Player
        this.player = this.physics.add.sprite(width / 2, height - 100, "prokaryotic");
        this.player.setScale(2);
        this.player.setCollideWorldBounds(true);

        // 3. Grup Rintangan
        this.obstacles = this.physics.add.group();

        // 4. Spawn Rintangan setiap 1 detik
        this.spawnEvent = this.time.addEvent({
            delay: 1000,
            callback: this.spawnObstacle,
            callbackScope: this,
            loop: true
        });

        // 5. Kontrol Keyboard
        this.cursors = this.input.keyboard.createCursorKeys();
        this.keys = this.input.keyboard.addKeys({
            left: Phaser.Input.Keyboard.KeyCodes.A,
            right: Phaser.Input.Keyboard.KeyCodes.D
        });

        // 6. Instruksi
        this.add.text(width / 2, height - 40, "Gunakan Panah Kiri/Kanan atau A/D untuk menghindar!", {
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

        // Container untuk menu pause
        this.pauseMenu = this.add.container(0, 0).setDepth(500).setVisible(false);

        // Background gelap transparan (overlay)
        const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.75);
        this.pauseMenu.add(overlay);

        // ✅ CARD ROCK - Landscape (seperti di Misi 2)
        const cardRock = this.add.image(width / 2, height / 2, "cardRock");
        cardRock.setDisplaySize(520, 400); // Lebar > Tinggi = Landscape
        this.pauseMenu.add(cardRock);

        // ✅ TOMBOL RESUME
        this.resumeBtn = this.add.image(width / 2, height / 2 - 50, "resume-btn");
        this.resumeBtn.setDisplaySize(280, 80); // Ukuran fixed agar seimbang
        this.resumeBtn.setInteractive({ useHandCursor: true });
        
        this.resumeBtn.on("pointerover", () => this.resumeBtn.setDisplaySize(300, 86));
        this.resumeBtn.on("pointerout", () => this.resumeBtn.setDisplaySize(280, 80));
        this.resumeBtn.on("pointerdown", () => this.togglePause());
        this.pauseMenu.add(this.resumeBtn);

        // ✅ TOMBOL EXIT
        this.exitBtn = this.add.image(width / 2, height / 2 + 60, "exit-btn");
        this.exitBtn.setDisplaySize(280, 80); // SAMAA dengan Resume
        this.exitBtn.setInteractive({ useHandCursor: true });
        
        this.exitBtn.on("pointerover", () => this.exitBtn.setDisplaySize(300, 86));
        this.exitBtn.on("pointerout", () => this.exitBtn.setDisplaySize(280, 80));
        this.exitBtn.on("pointerdown", () => {
            this.scene.start("MenuScene");
        });
        this.pauseMenu.add(this.exitBtn);
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

    update() {
        if (this.isPaused) return;

        if (this.cursors.left.isDown || this.keys.left.isDown) {
            this.player.setVelocityX(-300);
        } else if (this.cursors.right.isDown || this.keys.right.isDown) {
            this.player.setVelocityX(300);
        } else {
            this.player.setVelocityX(0);
        }
    }

    spawnObstacle() {
        const width = this.cameras.main.width;
        const x = Phaser.Math.Between(50, width - 50);
        
        const obstacle = this.obstacles.create(x, -50, "virus"); 
        obstacle.setScale(1.5);
        obstacle.setVelocityY(200);

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
}