// menu-scene.js - Main menu sesuai desain Figma
export default class MenuScene extends Phaser.Scene {
    constructor() {
        super('MenuScene');
        this.selectedRole = 0;
        this.roles = ['prokaryotic', 'virus', 'wbc'];
        this.roleNames = ['Prokaryotic', 'Virus', 'White Blood Cell'];
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        
        // Background
        this.add.image(width/2, height/2, 'bgMain');
        
        // Logo EvoCell di atas (STATIS, tidak bergerak)
        const logo = this.add.image(width/2, height/4 - 20, 'logo');
        logo.setScale(0.75);
        
        // Teks nama role di bawah logo
        this.roleText = this.add.text(width/2, height/2 - 120, this.roleNames[this.selectedRole], {
            font: '24px Arial',
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 3
        });
        this.roleText.setOrigin(0.5);
        
        // Karakter di tengah
        this.characterSprite = this.add.sprite(width/2, height/2 + 20, this.roles[this.selectedRole]);
        this.characterSprite.setScale(2.5);
        
        // Panah Kiri
        const arrowLeft = this.add.text(width/2 - 180, height/2 + 20, '<', {
            font: 'bold 60px Arial',
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4
        });
        arrowLeft.setOrigin(0.5);
        arrowLeft.setInteractive({ useHandCursor: true });
        arrowLeft.on('pointerdown', () => this.changeRole(-1));
        arrowLeft.on('pointerover', () => arrowLeft.setScale(1.2));
        arrowLeft.on('pointerout', () => arrowLeft.setScale(1));
        
        // Panah Kanan
        const arrowRight = this.add.text(width/2 + 180, height/2 + 20, '>', {
            font: 'bold 60px Arial',
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4
        });
        arrowRight.setOrigin(0.5);
        arrowRight.setInteractive({ useHandCursor: true });
        arrowRight.on('pointerdown', () => this.changeRole(1));
        arrowRight.on('pointerover', () => arrowRight.setScale(1.2));
        arrowRight.on('pointerout', () => arrowRight.setScale(1));
        
        // Tombol Campaign
        const campaignBtn = this.add.image(width/2, height - 150, 'btnCampaign');
        campaignBtn.setScale(0.7);
        campaignBtn.setInteractive({ useHandCursor: true });
        
        campaignBtn.on('pointerover', () => campaignBtn.setScale(0.75));
        campaignBtn.on('pointerout', () => campaignBtn.setScale(0.7));
        campaignBtn.on('pointerdown', () => {
            this.scene.start('ModeSelectScene', { role: this.roles[this.selectedRole] });
        });
        
        // Tombol Settings (pojok kiri atas, kecil)
        const settingsBtn = this.add.image(60, 50, 'btnSettings');
        settingsBtn.setScale(0.5);
        settingsBtn.setInteractive({ useHandCursor: true });
        
        settingsBtn.on('pointerover', () => settingsBtn.setScale(0.55));
        settingsBtn.on('pointerout', () => settingsBtn.setScale(0.5));
        
        // Input keyboard (panah kiri/kanan)
        this.input.keyboard.on('keydown-LEFT', () => this.changeRole(-1));
        this.input.keyboard.on('keydown-RIGHT', () => this.changeRole(1));
    }
    
    changeRole(direction) {
        this.selectedRole += direction;
        
        // Wrap around
        if (this.selectedRole < 0) this.selectedRole = this.roles.length - 1;
        if (this.selectedRole >= this.roles.length) this.selectedRole = 0;
        
        // Update sprite karakter
        this.characterSprite.setTexture(this.roles[this.selectedRole]);
        this.roleText.setText(this.roleNames[this.selectedRole]);
        
        // Animasi bounce saat ganti karakter
        this.tweens.add({
            targets: this.characterSprite,
            scaleX: 2.8,
            scaleY: 2.8,
            duration: 150,
            yoyo: true,
            ease: 'Back.easeOut'
        });
    }
}