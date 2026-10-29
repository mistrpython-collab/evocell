// menu-scene.js - Main menu dengan LOGO GAMBAR EvoCell
export default class MenuScene extends Phaser.Scene {
    constructor() {
        super('MenuScene');
        this.selectedRole = 0;
        this.roles = ['prokaryotic', 'virus', 'wbc'];
        this.roleNames = ['Prokaryotic', 'Virus', 'Sel Darah Putih'];
    }

    create() {
        console.log('MenuScene dibuat - merender...');
        
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

        // ✅ PASTE KODE DEVICE MODE DI SINI (tepat di bawah campaignBtn)
        const deviceModeBtn = this.add.text(60, 60, '⚙️ Device Mode', {
            font: 'bold 28px Arial',
            fill: '#00ff00',  
            stroke: '#00cc00', 
            strokeThickness: 3,
            backgroundColor: '#001a00',
            padding: { x: 25, y: 18 }
        });
        deviceModeBtn.setOrigin(0, 0.5);
        deviceModeBtn.setInteractive({ useHandCursor: true });
        
        deviceModeBtn.on('pointerover', () => {
            deviceModeBtn.setStyle({ 
                fill: '#aaffaa',
                backgroundColor: '#003300', 
                strokeThickness: 5
            });
        });
        deviceModeBtn.on('pointerout', () => {
            deviceModeBtn.setStyle({ 
                fill: '#00ff00', 
                backgroundColor: '#001a00',
                strokeThickness: 3
            });
        });
        
        deviceModeBtn.on('pointerdown', () => {
            this.scene.start('DeviceModeScene');
        });

        console.log('MenuScene create completed');   // ← Biarkan ini di bawah
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