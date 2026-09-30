// mode-select-scene.js - Mode selection dengan card frame batu
export default class ModeSelectScene extends Phaser.Scene {
    constructor() {
        super("ModeSelectScene");
    }

    init(data) {
        this.selectedRole = data.role || "prokaryotic";
        console.log("ModeSelectScene init - role:", this.selectedRole);
    }

    create() {
        console.log("ModeSelectScene create started");
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // Background
        this.add.image(width / 2, height / 2, "bgMain");

        // Title
        this.add.text(width / 2, 80, "Campaign", {
            font: "36px Arial",
            fill: "#00ff00",
            stroke: "#000000",
            strokeThickness: 4,
        }).setOrigin(0.5);

        // CARD 1 - TUTORIAL (Kiri)
        this.createModeCard(width / 2 - 280, height / 2 + 20, "Misi 1", "prokaryotic", "Learn the basics");

        // CARD 2 - GAME (Kanan)
        this.createModeCard(width / 2 + 280, height / 2 + 20, "Misi 2", "prokaryotic", "Start playing");

        // Back Button - PAKAI GAMBAR
        const backButton = this.add.image(80, 60, "btnBack");
        backButton.setScale(0.35);
        backButton.setInteractive({ useHandCursor: true });
        backButton.on("pointerover", () => backButton.setScale(0.4));
        backButton.on("pointerout", () => backButton.setScale(0.35));
        backButton.on("pointerdown", () => {
            console.log("Back button clicked");
            this.scene.start("MenuScene");
        });

        console.log("ModeSelectScene create completed");
    }

    createModeCard(x, y, modeTitle, character, description) {
        const cardWidth = 320;
        const cardHeight = 420;
        const card = this.add.container(x, y);

        // CARD BATU - PAKAI GAMBAR
        const cardBg = this.add.image(0, 0, "cardRock");
        cardBg.setDisplaySize(cardWidth, cardHeight);
        card.add(cardBg);

        // Character preview di dalam card
        const charPreview = this.add.sprite(0, -80, character);
        charPreview.setScale(3.5);
        card.add(charPreview);

        // Mode title
        const titleText = this.add.text(0, 120, modeTitle, {
            font: "bold 32px Arial",
            fill: "#00ff00",
            stroke: "#000000",
            strokeThickness: 3,
        });
        titleText.setOrigin(0.5);
        card.add(titleText);

        // TOMBOL PLAY - PAKAI GAMBAR
        const playBtn = this.add.image(0, 180, "btnPlay");
        playBtn.setScale(0.13);
        playBtn.setInteractive({ useHandCursor: true });

        playBtn.on("pointerover", () => playBtn.setScale(0.14));
        playBtn.on("pointerout", () => playBtn.setScale(0.13));
        
        // ✅ PERBAIKAN: Arahkan langsung ke ProkaryoticGame
        playBtn.on("pointerdown", () => {
            console.log(modeTitle, "mode selected");
            this.scene.start("ProkaryoticGame", {
                role: character,
                mode: modeTitle === "Misi 1" ? "tutorial" : "game",
                mission: modeTitle
            });
        });

        card.add(playBtn);

        // Make entire card clickable
        card.setSize(cardWidth, cardHeight);
        card.setInteractive({ useHandCursor: true });
        card.on("pointerdown", () => playBtn.emit("pointerdown"));

        // ✅ PERBAIKAN: Hover effect hanya scale (tanpa variabel frame yang error)
        card.on("pointerover", () => card.setScale(1.03));
        card.on("pointerout", () => card.setScale(1));

        return card;
    }
}