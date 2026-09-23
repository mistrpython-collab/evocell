// menu-scene.js - Updated
export default class MenuScene extends Phaser.Scene {
    constructor() {
        super('MenuScene');
        this.selectedRole = 0;
        this.roles = ['prokaryotic', 'virus', 'wbc'];
        this.roleNames = ['Prokaryotic', 'Virus', 'White Blood Cell'];
    }

    create() {
        console.log('MenuScene create - rendering...');
        
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        
        // Background gambar
        this.add.image(width/2, height/2, 'bgMain');
        
        // LOGO GAMBAR (bukan text)
        const logo = this.add.image(width/2, height/4 - 30, 'logo');
        logo.setScale(0.7);
        console.log('Logo image added');
        
        // Teks nama role
        this.roleText = this.add.text(width/2, height/2 - 130, this.roleNames[this.selectedRole], {
            font: '28px Arial',
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4
        });
        this.roleText.setOrigin(0.5);
        
        // Karakter di tengah
        this.characterSprite = this.add.sprite(width/2, height/2 + 10, this.roles[this.selectedRole]);
        this.characterSprite.setScale(3);
        
        // Panah Kiri
        const arrowLeft = this.add.text(width/2 - 180, height/2 + 10, '<', {
            font: 'bold 64px Arial',
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 5
        });
        arrowLeft.setOrigin(0.5);
        arrowLeft.setInteractive({ useHandCursor: true });
        arrowLeft.on('pointerdown', () => this.changeRole(-1));
        arrowLeft.on('pointerover', () => arrowLeft.setScale(1.2));
        arrowLeft.on('pointerout', () => arrowLeft.setScale(1));
        
        // Panah Kanan
        const arrowRight = this.add.text(width/2 + 180, height/2 + 10, '>', {
            font: 'bold 64px Arial',
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 5
        });
        arrowRight.setOrigin(0.5);
        arrowRight.setInteractive({ useHandCursor: true });
        arrowRight.on('pointerdown', () => this.changeRole(1));
        arrowRight.on('pointerover', () => arrowRight.setScale(1.2));
        arrowRight.on('pointerout', () => arrowRight.setScale(1));
        
        // Tombol Campaign dengan gambar
        const campaignBtn = this.add.image(width/2, height - 150, 'btnCampaign');
        campaignBtn.setScale(0.75);
        campaignBtn.setInteractive({ useHandCursor: true });
        
        campaignBtn.on('pointerover', () => campaignBtn.setScale(0.8));
        campaignBtn.on('pointerout', () => campaignBtn.setScale(0.75));
        campaignBtn.on('pointerdown', () => {
            console.log('Campaign clicked - role:', this.roles[this.selectedRole]);
            this.scene.start('ModeSelectScene', { role: this.roles[this.selectedRole] });
        });
        
        console.log('MenuScene create completed');
    }
    
    changeRole(direction) {
        this.selectedRole += direction;
        
        if (this.selectedRole < 0) this.selectedRole = this.roles.length - 1;
        if (this.selectedRole >= this.roles.length) this.selectedRole = 0;
        
        // Animasi ganti karakter
        this.tweens.add({
            targets: this.characterSprite,
            alpha: 0,
            duration: 100,
            onComplete: () => {
                this.characterSprite.setTexture(this.roles[this.selectedRole]);
                this.roleText.setText(this.roleNames[this.selectedRole]);
                this.tweens.add({
                    targets: this.characterSprite,
                    alpha: 1,
                    scale: 3.2,
                    duration: 150,
                    yoyo: true,
                    ease: 'Back.easeOut'
                });
            }
        });
        
        console.log('Role changed to:', this.roleNames[this.selectedRole]);
    }
}