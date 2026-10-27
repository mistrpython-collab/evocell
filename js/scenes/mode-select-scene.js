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
        this.add.text(width / 2, 60, "Pilih Misi", {
            font: "bold 42px Arial",
            fill: "#00ff00",
            stroke: "#000000",
            strokeThickness: 4,
        }).setOrigin(0.5);

        // ✅ TENTUKAN MISI BERDASARKAN ROLE
        if (this.selectedRole === "prokaryotic") {
            // PROKARYOTIC: Misi 1, 2, dan 3
            this.createModeCard(width / 2 - 380, height / 2 + 20, "Misi 1", this.selectedRole, "Pelajari Dasar");
            this.createModeCard(width / 2, height / 2 + 20, "Misi 2", this.selectedRole, "Tantang Boss");
            this.createModeCard(width / 2 + 380, height / 2 + 20, "Misi 3", "prokaryotic", "Hindari Rintangan");
        } else if (this.selectedRole === "virus") {
            // VIRUS: Hanya Misi 1 dan 2
            this.createModeCard(width / 2 - 190, height / 2 + 20, "Misi 1", this.selectedRole, "Pelajari Dasar");
            this.createModeCard(width / 2 + 190, height / 2 + 20, "Misi 2", this.selectedRole, "Tantang Boss");
        } else if (this.selectedRole === "wbc") {
            // WBC: Hanya Misi 1 dan 2
            this.createModeCard(width / 2 - 190, height / 2 + 20, "Misi 1", this.selectedRole, "Pelajari Dasar");
            this.createModeCard(width / 2 + 190, height / 2 + 20, "Misi 2", this.selectedRole, "Tantang Boss");
        }

        // Back Button
        const backButton = this.add.image(80, 60, "btnBack");
        backButton.setScale(0.35);
        backButton.setInteractive({ useHandCursor: true });
        backButton.on("pointerover", () => backButton.setScale(0.4));
        backButton.on("pointerout", () => backButton.setScale(0.35));
        backButton.on("pointerdown", () => this.scene.start("MenuScene"));

        console.log("ModeSelectScene create completed");
    }

    createModeCard(x, y, modeTitle, character, description) {
        const cardWidth = 320;
        const cardHeight = 420;
        const card = this.add.container(x, y);

        // CARD BATU
        const cardBg = this.add.image(0, 0, "cardRock");
        cardBg.setDisplaySize(cardWidth, cardHeight);
        card.add(cardBg);

        // Character preview
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

        // TOMBOL PLAY
        const playBtn = this.add.image(0, 180, "btnPlay");
        playBtn.setScale(0.13);
        playBtn.setInteractive({ useHandCursor: true });
        playBtn.on("pointerover", () => playBtn.setScale(0.14));
        playBtn.on("pointerout", () => playBtn.setScale(0.13));

        // ✅ Pilih scene berdasarkan character dan modeTitle
        playBtn.on("pointerdown", () => {
            console.log(modeTitle, "mode selected - character:", character);
            
            let gameScene = 'ProkaryoticGame';
            
            // Prioritas: Cek Misi 3 dulu (Cell Dodger)
            if (modeTitle === "Misi 3") {
                gameScene = 'CellDodgerScene';
            } 
            // Baru cek character untuk Misi 1 & 2
            else if (character === 'virus') {
                gameScene = 'VirusGame';
            } else if (character === 'wbc') {
                gameScene = 'WBCGame';
            } else if (character === 'dodger') {
                gameScene = 'CellDodgerScene';
            }

            this.scene.start(gameScene, {
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
        card.on("pointerover", () => card.setScale(1.03));
        card.on("pointerout", () => card.setScale(1));

        return card;
    }
}