// menu-scene.js - Main menu dengan LOGO GAMBAR EvoCell
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
        
        // LOGO GAMBAR EVOCELL (bukan text!)
        const logo = this.add.image(width/2, height/4 - 30, 'logo');
logo.setScale(0.3);  // Lebih kecil lagi
        console.log('Logo image loaded and displayed');
        
        // Teks nama role di bawah logo
        this.roleText = this.add.text(width/2, 290, this.roleNames[this.selectedRole], {
            font: '28px Arial',
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4
        });
        this.roleText.setOrigin(0.5);
        
        // Karakter di tengah
        this.characterSprite = this.add.sprite(width/2, height/2 + 60, this.roles[this.selectedRole]);
        this.characterSprite.setScale(6);
        
        // Panah Kiri
        const arrowLeft = this.add.text(width/2 - 180, height/2 + 80, '<', {
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
        const arrowRight = this.add.text(width/2 + 180, height/2 + 80, '>', {
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
        
        // Tombol Campaign
        const campaignBtn = this.add.image(width/2, height - 120, 'btnCampaign');
        campaignBtn.setScale(0.43);
        campaignBtn.setInteractive({ useHandCursor: true });
        
        campaignBtn.on('pointerover', () => campaignBtn.setScale(0.45));
        campaignBtn.on('pointerout', () => campaignBtn.setScale(0.43));
        campaignBtn.on('pointerdown', () => {
            console.log('Campaign clicked - role:', this.roles[this.selectedRole]);
            this.scene.start('ModeSelectScene', { role: this.roles[this.selectedRole] });
        });
        
        console.log('MenuScene create completed');
    }
    
    changeRole(direction) {
    this.selectedRole += direction;
    
    // Wrap around
    if (this.selectedRole < 0) this.selectedRole = this.roles.length - 1;
    if (this.selectedRole >= this.roles.length) this.selectedRole = 0;
    
    // Update sprite karakter LANGSUNG (tanpa animasi fade yang bermasalah)
    this.characterSprite.setTexture(this.roles[this.selectedRole]);
    this.roleText.setText(this.roleNames[this.selectedRole]);
    
    // Animasi bounce sederhana (hanya scale, tidak ada alpha)
    this.tweens.add({
        targets: this.characterSprite,
        scaleX: 3.3,
        scaleY: 3.3,
        duration: 100,
        yoyo: true,
        ease: 'Back.easeOut'
    });
    
    console.log('Role changed to:', this.roleNames[this.selectedRole]);
}
}