// mode-select-scene.js
import { getLang } from '../utils/translations.js';

export default class ModeSelectScene extends Phaser.Scene {
    constructor() { 
        super("ModeSelectScene"); 
    }

    init(data) {
        this.selectedRole = data.role || "prokaryotic";
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        this.add.image(width/2, height/2, "bgMain");
        this.add.text(width/2, 60, getLang('selectMission'), { 
            font: "bold 42px Arial", 
            fill: "#00ff00", 
            stroke: "#000000", 
            strokeThickness: 4 
        }).setOrigin(0.5);

        if (this.selectedRole === "prokaryotic") {
            this.createModeCard(width/2-380, height/2+20, `${getLang('mission')} 1`, this.selectedRole, getLang('learnBasics'));
            this.createModeCard(width/2, height/2+20, `${getLang('mission')} 2`, this.selectedRole, getLang('challengeBoss'));
            this.createModeCard(width/2+380, height/2+20, `${getLang('mission')} 3`, "prokaryotic", getLang('avoidObstacles'));
        } 
        else if (this.selectedRole === "virus") {
            this.createModeCard(width/2-190, height/2+20, `${getLang('mission')} 1`, this.selectedRole, getLang('learnBasics'));
            this.createModeCard(width/2+190, height/2+20, `${getLang('mission')} 2`, this.selectedRole, getLang('challengeBoss'));
        } 
        else if (this.selectedRole === "wbc") {
            this.createModeCard(width/2, height/2+20, getLang('wbcMission1Name'), this.selectedRole, getLang('learnBasics'));
        }

        const backButton = this.add.image(80, 60, "btnBack");
        backButton.setScale(0.35).setInteractive({ useHandCursor: true });
        backButton.on("pointerover", () => backButton.setScale(0.4));
        backButton.on("pointerout", () => backButton.setScale(0.35));
        backButton.on("pointerdown", () => this.scene.start("MenuScene"));
    }

    // ==========================================
    // ✅ HELPER: TENTUKAN TUJUAN SCENE + MODE
    // ==========================================
    getMissionRoute(character, modeTitle) {
        if (character === 'wbc') {
            return { gameScene: 'WBCGame', mission: "Misi 1", mode: "tutorial" };
        }
        if (character === 'prokaryotic') {
            if (modeTitle.includes("3")) return { gameScene: 'CellDodgerScene', mission: "Misi 3", mode: "game" };
            if (modeTitle.includes("2")) return { gameScene: 'ProkaryoticGame', mission: "Misi 2", mode: "game" };
            return { gameScene: 'ProkaryoticGame', mission: "Misi 1", mode: "tutorial" };
        }
        if (character === 'virus') {
            if (modeTitle.includes("2")) return { gameScene: 'VirusGame2', mission: "Misi 2", mode: "game" };
            return { gameScene: 'VirusGame', mission: "Misi 1", mode: "tutorial" };
        }
        return { gameScene: 'ProkaryoticGame', mission: "Misi 1", mode: "tutorial" };
    }

    // ==========================================
    // ✅ HELPER: KEY GAMBAR ILUSTRASI (null = tanpa gambar)
    // ==========================================
    getMissionImageKey(character, modeTitle) {
        if (character === 'wbc') return 'wbcMisi1Image';
        if (character === 'prokaryotic') {
            if (modeTitle.includes("1")) return 'prokaryoticMisi1Image';
            if (modeTitle.includes("2")) return 'prokaryoticMisi2Image';
            return null; // Misi 3 → sprite + PLAY
        }
        if (character === 'virus') {
            if (modeTitle.includes("1")) return 'virusMisi1Image';
            if (modeTitle.includes("2")) return 'virusMisi2Image';
            return null;
        }
        return null;
    }

    createModeCard(x, y, modeTitle, character, description) {
        const cardWidth = 320, cardHeight = 420;
        const card = this.add.container(x, y);

        const cardBg = this.add.image(0, 0, "cardRock");
        cardBg.setDisplaySize(cardWidth, cardHeight);
        card.add(cardBg);

        const imageKey = this.getMissionImageKey(character, modeTitle);
        const route = this.getMissionRoute(character, modeTitle);

        // ==========================================
        // ✅ BRANCH 1: PUNYA GAMBAR → GAMBAR SAJA, TANPA PLAY BTN
        //    (WBC 1, Prok 1, Prok 2, Virus 1, Virus 2)
        //    Card langsung diklik untuk masuk game.
        // ==========================================
        if (imageKey) {
            const missionImage = this.add.image(0, -3, imageKey);
            missionImage.setDisplaySize(270, 380);
            missionImage.setDepth(2);
            card.add(missionImage);

            card.setSize(cardWidth, cardHeight).setInteractive({ useHandCursor: true });
            card.on("pointerdown", () => {
                this.scene.start(route.gameScene, {
                    role: character,
                    mode: route.mode,
                    mission: route.mission
                });
            });
            card.on("pointerover", () => card.setScale(1.03));
            card.on("pointerout", () => card.setScale(1));
        }
        // ==========================================
        // ✅ BRANCH 2: TANPA GAMBAR → SPRITE + PLAY BTN
        //    (Prokaryotic Misi 3 / Cell Dodger)
        // ==========================================
        else {
            const charPreview = this.add.sprite(0, -80, character);
            charPreview.setScale(3.5);
            card.add(charPreview);

            const playBtn = this.add.image(0, 180, "btnPlay");
            playBtn.setScale(0.13).setInteractive({ useHandCursor: true });
            playBtn.on("pointerover", () => playBtn.setScale(0.14));
            playBtn.on("pointerout", () => playBtn.setScale(0.13));
            playBtn.on("pointerdown", () => {
                this.scene.start(route.gameScene, {
                    role: character,
                    mode: route.mode,
                    mission: route.mission
                });
            });
            card.add(playBtn);

            card.setSize(cardWidth, cardHeight).setInteractive({ useHandCursor: true });
            card.on("pointerdown", () => playBtn.emit("pointerdown"));
            card.on("pointerover", () => card.setScale(1.03));
            card.on("pointerout", () => card.setScale(1));
        }

        return card;
    }
} // ✅ TUTUP CLASS