// mode-select-scene.js
import { getLang } from '../utils/translations.js';

export default class ModeSelectScene extends Phaser.Scene {
    constructor() { super("ModeSelectScene"); }

    init(data) {
        this.selectedRole = data.role || "prokaryotic";
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        this.add.image(width/2, height/2, "bgMain");
        this.add.text(width/2, 60, getLang('selectMission'), { font: "bold 42px Arial", fill: "#00ff00", stroke: "#000000", strokeThickness: 4 }).setOrigin(0.5);

        if (this.selectedRole === "prokaryotic") {
            this.createModeCard(width/2-380, height/2+20, `${getLang('mission')} 1`, this.selectedRole, getLang('learnBasics'));
            this.createModeCard(width/2, height/2+20, `${getLang('mission')} 2`, this.selectedRole, getLang('challengeBoss'));
            this.createModeCard(width/2+380, height/2+20, `${getLang('mission')} 3`, "prokaryotic", getLang('avoidObstacles'));
        } else if (this.selectedRole === "virus") {
            this.createModeCard(width/2-190, height/2+20, `${getLang('mission')} 1`, this.selectedRole, getLang('learnBasics'));
            this.createModeCard(width/2+190, height/2+20, `${getLang('mission')} 2`, this.selectedRole, getLang('challengeBoss'));
        } else if (this.selectedRole === "wbc") {
            this.createModeCard(width/2-190, height/2+20, `${getLang('mission')} 1`, this.selectedRole, getLang('learnBasics'));
            this.createModeCard(width/2+190, height/2+20, `${getLang('mission')} 2`, this.selectedRole, getLang('challengeBoss'));
        }

        const backButton = this.add.image(80, 60, "btnBack");
        backButton.setScale(0.35).setInteractive({ useHandCursor: true });
        backButton.on("pointerover", () => backButton.setScale(0.4));
        backButton.on("pointerout", () => backButton.setScale(0.35));
        backButton.on("pointerdown", () => this.scene.start("MenuScene"));
    }

    createModeCard(x, y, modeTitle, character, description) {
        const cardWidth = 320, cardHeight = 420;
        const card = this.add.container(x, y);

        const cardBg = this.add.image(0, 0, "cardRock");
        cardBg.setDisplaySize(cardWidth, cardHeight);
        card.add(cardBg);

        const charPreview = this.add.sprite(0, -80, character);
        charPreview.setScale(3.5);
        card.add(charPreview);

        const titleText = this.add.text(0, 120, modeTitle, { font: "bold 32px Arial", fill: "#00ff00", stroke: "#000000", strokeThickness: 3 }).setOrigin(0.5);
        card.add(titleText);

        const playBtn = this.add.image(0, 180, "btnPlay");
        playBtn.setScale(0.13).setInteractive({ useHandCursor: true });
        playBtn.on("pointerover", () => playBtn.setScale(0.14));
        playBtn.on("pointerout", () => playBtn.setScale(0.13));
        playBtn.on("pointerdown", () => {
            let gameScene = 'ProkaryoticGame';
            if (modeTitle.includes("3")) gameScene = 'CellDodgerScene';
            else if (character === 'virus') gameScene = 'VirusGame';
            else if (character === 'wbc') gameScene = 'WBCGame';
            
            this.scene.start(gameScene, { role: character, mode: modeTitle.includes("1") ? "tutorial" : "game", mission: modeTitle });
        });
        card.add(playBtn);

        card.setSize(cardWidth, cardHeight).setInteractive({ useHandCursor: true });
        card.on("pointerdown", () => playBtn.emit("pointerdown"));
        card.on("pointerover", () => card.setScale(1.03));
        card.on("pointerout", () => card.setScale(1));
        return card;
    }
}