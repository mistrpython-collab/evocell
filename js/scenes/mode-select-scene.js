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

    createModeCard(x, y, modeTitle, character, description) {
        const cardWidth = 320, cardHeight = 420;
        const card = this.add.container(x, y);

        const cardBg = this.add.image(0, 0, "cardRock");
        cardBg.setDisplaySize(cardWidth, cardHeight);
        card.add(cardBg);

        const charPreview = this.add.sprite(0, -80, character);
        charPreview.setScale(3.5);
        card.add(charPreview);

        // ✅ GAMBAR ILUSTRASI MISI (hanya untuk WBC)
               if (character === 'wbc') {
            const missionImage = this.add.image(0, -3, 'wbcMisi1Image');
            missionImage.setDisplaySize(270, 380);
            missionImage.setDepth(2);
            
            // // ✅ BUAT MASK ROUNDED RECTANGLE
            // const maskGraphics = this.make.graphics().fillStyle(0xffffff).fillRoundedRect(0, 0, 270, 380, 20);
            // const mask = maskGraphics.createGeometryMask();
            // missionImage.setMask(mask);
            
            card.add(missionImage);

                    // ✅ CARD BISA DIKLIK LANGSUNG (tanpa tombol PLAY)
        card.setSize(cardWidth, cardHeight).setInteractive({ useHandCursor: true });
        card.on("pointerdown", () => {
            this.scene.start('WBCGame', {
                role: character,
                mode: "tutorial",
                mission: "Misi 1"
            });
        });
        card.on("pointerover", () => card.setScale(1.03));
        card.on("pointerout", () => card.setScale(1));
            
            // Tombol PLAY di bawah untuk WBC
            // const playBtn = this.add.image(0, 230, "btnPlay");
            // playBtn.setScale(0.13).setInteractive({ useHandCursor: true });
            // playBtn.on("pointerover", () => playBtn.setScale(0.14));
            // playBtn.on("pointerout", () => playBtn.setScale(0.13));
            // playBtn.on("pointerdown", () => {
            //     this.scene.start('WBCGame', {
            //         role: character,
            //         mode: "tutorial",
            //         mission: "Misi 1"
            //     });
            // });
            // card.add(playBtn);
        }
        else {
            // Card biasa (Prokaryotic & Virus) - tombol di posisi normal
            const playBtn = this.add.image(0, 180, "btnPlay");
            playBtn.setScale(0.13).setInteractive({ useHandCursor: true });
            playBtn.on("pointerover", () => playBtn.setScale(0.14));
            playBtn.on("pointerout", () => playBtn.setScale(0.13));
            
            // ✅ LOGIKA ROUTING SCENE
            playBtn.on("pointerdown", () => {
                let gameScene = 'ProkaryoticGame';
                let internalMission = "Misi 1";
                
                if (modeTitle.includes("3")) {
                    internalMission = "Misi 3";
                    gameScene = 'CellDodgerScene';
                } else if (modeTitle.includes("2")) {
                    internalMission = "Misi 2";
                }

                if (character === 'virus') {
                    if (internalMission === "Misi 2") {
                        gameScene = 'VirusGame2';
                    } else {
                        gameScene = 'VirusGame';
                    }
                } 
                // Prokaryotic tetap ProkaryoticGame
                
                this.scene.start(gameScene, { 
                    role: character, 
                    mode: internalMission === "Misi 1" ? "tutorial" : "game", 
                    mission: internalMission
                });
            });
            
            card.add(playBtn);
        } // ✅ TUTUP ELSE

        card.setSize(cardWidth, cardHeight).setInteractive({ useHandCursor: true });
        card.on("pointerdown", () => {
            // Trigger playBtn click
            const playBtn = card.list.find(obj => obj.type === 'Image' && obj.texture.key === 'btnPlay');
            if (playBtn) playBtn.emit("pointerdown");
        });
        card.on("pointerover", () => card.setScale(1.03));
        card.on("pointerout", () => card.setScale(1));
        
        return card;
    }
} // ✅ TUTUP CLASS