// mode-select-scene.js - Pilih mode Tutorial/Game
export default class ModeSelectScene extends Phaser.Scene {
    constructor() {
        super('ModeSelectScene');
    }

    init(data) {
        this.selectedRole = data.role || 'prokaryotic';
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        
        // Background
        this.add.image(width/2, height/2, 'bgMain');
        
        // Title
        this.add.text(width/2, 100, 'SELECT MODE', {
            font: '36px Arial',
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5);
        
        // Tutorial Card (kiri)
        const tutorialCard = this.createModeCard(
            width/2 - 250,
            height/2,
            'TUTORIAL',
            'Learn the basics',
            0xffa500
        );
        tutorialCard.on('pointerdown', () => this.startGame(true));
        
        // Game Card (kanan)
        const gameCard = this.createModeCard(
            width/2 + 250,
            height/2,
            'GAME',
            'Start playing',
            0x00ff00
        );
        gameCard.on('pointerdown', () => this.startGame(false));
        
        // Back Button
        const backButton = this.add.image(80, 60, 'btnBack');
        backButton.setScale(0.6);
        backButton.setInteractive({ useHandCursor: true });
        
        backButton.on('pointerover', () => backButton.setScale(0.65));
        backButton.on('pointerout', () => backButton.setScale(0.6));
        backButton.on('pointerdown', () => {
            this.scene.start('MenuScene');
        });
        
        // Info role yang dipilih
        this.add.text(width/2, height - 80, `Selected: ${this.selectedRole}`, {
            font: '20px Arial',
            fill: '#00ff00',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5);
    }
    
    createModeCard(x, y, title, description, color) {
        const cardWidth = 350;
        const cardHeight = 300;
        
        const card = this.add.container(x, y);
        
        // Card background
        const bg = this.add.graphics();
        bg.fillStyle(0x1a1a2e, 0.95);
        bg.fillRoundedRect(-cardWidth/2, -cardHeight/2, cardWidth, cardHeight, 20);
        bg.lineStyle(4, color);
        bg.strokeRoundedRect(-cardWidth/2, -cardHeight/2, cardWidth, cardHeight, 20);
        card.add(bg);
        
        // Title
        const titleText = this.add.text(0, -80, title, {
            font: '32px Arial',
            fill: color,
            fontWeight: 'bold',
            stroke: '#000000',
            strokeThickness: 3
        });
        titleText.setOrigin(0.5);
        card.add(titleText);
        
        // Description
        const descText = this.add.text(0, 0, description, {
            font: '20px Arial',
            fill: '#cccccc'
        });
        descText.setOrigin(0.5);
        card.add(descText);
        
        // Icon
        const icon = this.add.text(0, 80, '▶', {
            font: '48px Arial',
            fill: color
        });
        icon.setOrigin(0.5);
        card.add(icon);
        
        // Make interactive
        card.setSize(cardWidth, cardHeight);
        card.setInteractive({ useHandCursor: true });
        
        // Hover effect
        card.on('pointerover', () => {
            bg.clear();
            bg.fillStyle(0x2a2a3e, 0.95);
            bg.fillRoundedRect(-cardWidth/2, -cardHeight/2, cardWidth, cardHeight, 20);
            bg.lineStyle(6, color);
            bg.strokeRoundedRect(-cardWidth/2, -cardHeight/2, cardWidth, cardHeight, 20);
            card.setScale(1.05);
        });
        
        card.on('pointerout', () => {
            bg.clear();
            bg.fillStyle(0x1a1a2e, 0.95);
            bg.fillRoundedRect(-cardWidth/2, -cardHeight/2, cardWidth, cardHeight, 20);
            bg.lineStyle(4, color);
            bg.strokeRoundedRect(-cardWidth/2, -cardHeight/2, cardWidth, cardHeight, 20);
            card.setScale(1);
        });
        
        return card;
    }
    
    startGame(isTutorial) {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        
        this.add.text(width/2, height/2, 
            `Starting ${isTutorial ? 'Tutorial' : 'Game'}...\nRole: ${this.selectedRole}`, {
            font: '28px Arial',
            fill: '#ffffff',
            align: 'center',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5);
    }
}