// mode-select-scene.js - Scene untuk memilih mode game
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
        this.add.rectangle(width/2, height/2, width, height, 0x0a0a0a);
        
        // Title
        this.add.text(width/2, 100, 'SELECT MODE', {
            font: '36px Arial',
            fill: '#00ffff',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5);
        
        // Tutorial card (kiri)
        const tutorialCard = this.createModeCard(
            width/2 - 250,
            height/2,
            'TUTORIAL',
            'Learn the basics',
            '#ffa500'
        );
        tutorialCard.on('pointerdown', () => this.startGame(true));
        
        // Game card (kanan)
        const gameCard = this.createModeCard(
            width/2 + 250,
            height/2,
            'GAME',
            'Start playing',
            '#00ff00'
        );
        gameCard.on('pointerdown', () => this.startGame(false));
        
        // Back button
        const backButton = this.add.text(50, 50, '< BACK', {
            font: '20px Arial',
            fill: '#ffffff'
        });
        backButton.setInteractive({ useHandCursor: true });
        backButton.on('pointerdown', () => {
            this.scene.start('RoleSelectScene');
        });
        
        // Selected role info
        this.add.text(width/2, height - 80, `Selected: ${this.selectedRole}`, {
            font: '20px Arial',
            fill: '#00ff00'
        }).setOrigin(0.5);
    }
    
    createModeCard(x, y, title, description, color) {
        const width = 350;
        const height = 300;
        
        const card = this.add.container(x, y);
        
        // Card background
        const bg = this.add.graphics();
        bg.fillStyle(0x1a1a2e, 0.95);
        bg.fillRoundedRect(-width/2, -height/2, width, height, 20);
        bg.lineStyle(4, color);
        bg.strokeRoundedRect(-width/2, -height/2, width, height, 20);
        card.add(bg);
        
        // Title
        const titleText = this.add.text(0, -80, title, {
            font: '32px Arial',
            fill: color,
            fontWeight: 'bold'
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
        card.setSize(width, height);
        card.setInteractive({ useHandCursor: true });
        
        // Hover effect
        card.on('pointerover', () => {
            bg.clear();
            bg.fillStyle(0x2a2a3e, 0.95);
            bg.fillRoundedRect(-width/2, -height/2, width, height, 20);
            bg.lineStyle(6, color);
            bg.strokeRoundedRect(-width/2, -height/2, width, height, 20);
            card.setScale(1.05);
        });
        
        card.on('pointerout', () => {
            bg.clear();
            bg.fillStyle(0x1a1a2e, 0.95);
            bg.fillRoundedRect(-width/2, -height/2, width, height, 20);
            bg.lineStyle(4, color);
            bg.strokeRoundedRect(-width/2, -height/2, width, height, 20);
            card.setScale(1);
        });
        
        return card;
    }
    
    startGame(isTutorial) {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        
        // Placeholder - nanti akan diganti dengan transisi ke GameScene
        this.add.text(width/2, height/2, 
            `Starting ${isTutorial ? 'Tutorial' : 'Game'}...\nRole: ${this.selectedRole}`, {
            font: '28px Arial',
            fill: '#ffffff',
            align: 'center'
        }).setOrigin(0.5);
        
        // Nanti ganti dengan:
        // this.scene.start('GameScene', { 
        //     role: this.selectedRole, 
        //     isTutorial: isTutorial 
        // });
    }
}
