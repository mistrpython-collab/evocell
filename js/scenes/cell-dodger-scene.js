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

        // 2. Player (Gunakan sprite 'prokaryotic' atau 'virus' sebagai placeholder)
        this.player = this.physics.add.sprite(width / 2, height - 100, "prokaryotic");
        this.player.setScale(2);
        this.player.setCollideWorldBounds(true);

        // 3. Skor
        this.score = 0;
        this.scoreText = this.add.text(20, 20, "Skor: 0", {
            font: "bold 32px Arial",
            fill: "#00ff00",
            stroke: "#000000",
            strokeThickness: 4
        });

        // 4. Grup Rintangan (Obstacles)
        this.obstacles = this.physics.add.group();

        // 5. Spawn Rintangan setiap 1 detik
        this.time.addEvent({
            delay: 1000,
            callback: this.spawnObstacle,
            callbackScope: this,
            loop: true
        });

        // 6. Kontrol Keyboard (Panah Kiri/Kanan atau A/D)
        this.cursors = this.input.keyboard.createCursorKeys();
        this.keys = this.input.keyboard.addKeys({
            left: Phaser.Input.Keyboard.KeyCodes.A,
            right: Phaser.Input.Keyboard.KeyCodes.D
        });

        // 7. Instruksi
        this.add.text(width / 2, height - 40, "Gunakan Panah Kiri/Kanan atau A/D untuk menghindar!", {
            font: "18px Arial",
            fill: "#ffffff"
        }).setOrigin(0.5);

        // 8. Tombol Kembali ke Menu
        const backBtn = this.add.image(60, 60, "btnBack").setScale(0.35).setInteractive({ useHandCursor: true });
        backBtn.on("pointerdown", () => this.scene.start("MenuScene"));
    }

    update() {
        // Gerakan Player
        if (this.cursors.left.isDown || this.keys.left.isDown) {
            this.player.setVelocityX(-300);
        } else if (this.cursors.right.isDown || this.keys.right.isDown) {
            this.player.setVelocityX(300);
        } else {
            this.player.setVelocityX(0);
        }

        // Cek Tabrakan
        this.physics.collide(this.player, this.obstacles, this.hitObstacle, null, this);
    }

    spawnObstacle() {
        const width = this.cameras.main.width;
        const x = Phaser.Math.Between(50, width - 50);
        
        // Buat rintangan (bisa diganti dengan sprite musuh nanti)
        const obstacle = this.obstacles.create(x, -50, "virus"); 
        obstacle.setScale(1.5);
        obstacle.setVelocityY(200); // Jatuh ke bawah

        // Hapus rintangan jika keluar layar untuk hemat memori
        obstacle.checkWorldBounds = true;
        obstacle.outOfBoundsKill = true;
    }

    hitObstacle(player, obstacle) {
        this.physics.pause();
        player.setTint(0xff0000); // Player jadi merah
        
        this.add.text(this.cameras.main.width / 2, this.cameras.main.height / 2, "GAME OVER\nKlik untuk Kembali", {
            font: "bold 48px Arial",
            fill: "#ff0000",
            stroke: "#000000",
            strokeThickness: 6,
            align: "center"
        }).setOrigin(0.5);

        this.input.once("pointerdown", () => {
            this.scene.start("MenuScene");
        });
    }
}