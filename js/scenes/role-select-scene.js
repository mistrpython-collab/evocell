// role-select-scene.js - Scene untuk memilih character
export default class RoleSelectScene extends Phaser.Scene {
    constructor() {
        super('RoleSelectScene');
        this.selectedRole = 0;
        this.roles = ['prokaryotic']; // Akan ditambah virus dan WBC nanti
        this.roleNames = ['Prokaryotic'];
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        
        // Background
        this.add.rectangle(width/2, height/2, width, height, 0x0a0a0a);
        
        // Title
        this.add.text(width/2, 80, 'SELECT YOUR ROLE', {
            font: '36px Arial',
            fill: '#00ffff',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5);
        
        // Character placeholder (kotak warna untuk sementara)
        const charPlaceholder = this.add.rectangle(width/2, height/2 - 50, 150, 150, 0x00ff00);
        charPlaceholder.setStrokeStyle(4, 0x00ffff);
        
        // Character name
        this.roleText = this.add.text(width/2, height/2 + 100, this.roleNames[this.selectedRole], {
            font: '28px Arial',
            fill: '#00ff00'
        });
        this.roleText.setOrigin(0.5);
        
        // Instructions
        this.add.text(width/2, height/2 + 150, 'Use LEFT/RIGHT arrows to change', {
            font: '18px Arial',
            fill: '#aaaaaa'
        }).setOrigin(0.5);
        
        // Arrow buttons
        const arrowLeft = this.add.text(200, height/2, '◄', {
            font: '48px Arial',
            fill: '#00ffff'
        });
        arrowLeft.setOrigin(0.5);
        arrowLeft.setInteractive({ useHandCursor: true });
        arrowLeft.on('pointerdown', () => this.changeRole(-1));
        
        const arrowRight = this.add.text(width - 200, height/2, '►', {
            font: '48px Arial',
            fill: '#00ffff'
        });
        arrowRight.setOrigin(0.5);
        arrowRight.setInteractive({ useHandCursor: true });
        arrowRight.on('pointerdown', () => this.changeRole(1));
        
        // Keyboard input
        this.input.keyboard.on('keydown-LEFT', () => this.changeRole(-1));
        this.input.keyboard.on('keydown-RIGHT', () => this.changeRole(1));
        
        // Play button
        const playButton = this.add.text(width/2, height - 120, 'CONTINUE', {
            font: '28px Arial',
            fill: '#ffffff',
            backgroundColor: '#00aa00',
            padding: { x: 25, y: 12 }
        });
        playButton.setOrigin(0.5);
        playButton.setInteractive({ useHandCursor: true });
        
        playButton.on('pointerover', () => playButton.setStyle({ backgroundColor: '#00ff00' }));
        playButton.on('pointerout', () => playButton.setStyle({ backgroundColor: '#00aa00' }));
        playButton.on('pointerdown', () => {
            this.scene.start('ModeSelectScene', { role: this.roles[this.selectedRole] });
        });
        
        // Back button
        const backButton = this.add.text(50, 50, '< BACK', {
            font: '20px Arial',
            fill: '#ffffff'
        });
        backButton.setInteractive({ useHandCursor: true });
        backButton.on('pointerdown', () => {
            this.scene.start('MenuScene');
        });
    }
    
    changeRole(direction) {
        this.selectedRole += direction;
        
        // Wrap around
        if (this.selectedRole < 0) this.selectedRole = this.roles.length - 1;
        if (this.selectedRole >= this.roles.length) this.selectedRole = 0;
        
        // Update text
        this.roleText.setText(this.roleNames[this.selectedRole]);
        
        // Animasi
        this.tweens.add({
            targets: this.roleText,
            scaleX: 1.2,
            scaleY: 1.2,
            duration: 100,
            yoyo: true
        });
    }
}
