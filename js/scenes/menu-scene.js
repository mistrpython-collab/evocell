// menu-scene.js - Main menu dengan fallback
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
        
        // FALLBACK: Background warna gelap jika gambar tidak load
        this.add.rectangle(width/2, height/2, width, height, 0x0a0a0a);
        
        // Coba load background gambar
        try {
            const bgImage = this.add.image(width/2, height/2, 'bgMain');
            bgImage.setDisplaySize(width, height);
            console.log('Background image loaded');
        } catch (e) {
            console.log('Background image not available, using color fallback');
        }
        
        // Judul EvoCell (TEXT, bukan gambar)
        const title = this.add.text(width/2, height/4 - 20, 'EvoCell', {
            font: '72px Arial',
            fill: '#00ffff',
            stroke: '#00ff00',
            strokeThickness: 6
        });
        title.setOrigin(0.5);
        console.log('Title created');
        
        // Teks nama role
        this.roleText = this.add.text(width/2, height/2 - 120, this.roleNames[this.selectedRole], {
            font: '24px Arial',
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 3
        });
        this.roleText.setOrigin(0.5);
        
        // Karakter di tengah
        try {
            this.characterSprite = this.add.sprite(width/2, height/2 + 20, this.roles[this.selectedRole]);
            this.characterSprite.setScale(2.5);
            console.log('Character sprite created:', this.roles[this.selectedRole]);
        } catch (e) {
            console.error('Error creating character sprite:', e);
            // Fallback: kotak warna
            this.add.rectangle(width/2, height/2 + 20, 100, 100, 0x00ff00);
        }
        
        // Panah Kiri
        const arrowLeft = this.add.text(width/2 - 180, height/2 + 20, '<', {
            font: 'bold 60px Arial',
            fill: '#ffffff'
        });
        arrowLeft.setOrigin(0.5);
        arrowLeft.setInteractive({ useHandCursor: true });
        arrowLeft.on('pointerdown', () => this.changeRole(-1));
        
        // Panah Kanan
        const arrowRight = this.add.text(width/2 + 180, height/2 + 20, '>', {
            font: 'bold 60px Arial',
            fill: '#ffffff'
        });
        arrowRight.setOrigin(0.5);
        arrowRight.setInteractive({ useHandCursor: true });
        arrowRight.on('pointerdown', () => this.changeRole(1));
        
        // Tombol Campaign (TEXT, bukan gambar)
        const campaignBtn = this.add.text(width/2, height - 150, 'CAMPAIGN', {
            font: '28px Arial',
            fill: '#ffffff',
            backgroundColor: '#00aa00',
            padding: { x: 30, y: 15 }
        });
        campaignBtn.setOrigin(0.5);
        campaignBtn.setInteractive({ useHandCursor: true });
        
        campaignBtn.on('pointerover', () => campaignBtn.setStyle({ backgroundColor: '#00ff00' }));
        campaignBtn.on('pointerout', () => campaignBtn.setStyle({ backgroundColor: '#00aa00' }));
        campaignBtn.on('pointerdown', () => {
            console.log('Campaign clicked');
            this.scene.start('ModeSelectScene', { role: this.roles[this.selectedRole] });
        });
        
        console.log('MenuScene create completed - all elements rendered');
    }
    
    changeRole(direction) {
        this.selectedRole += direction;
        
        if (this.selectedRole < 0) this.selectedRole = this.roles.length - 1;
        if (this.selectedRole >= this.roles.length) this.selectedRole = 0;
        
        this.characterSprite.setTexture(this.roles[this.selectedRole]);
        this.roleText.setText(this.roleNames[this.selectedRole]);
        
        console.log('Role changed to:', this.roleNames[this.selectedRole]);
    }
}