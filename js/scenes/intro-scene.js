// intro-scene.js - Pakai logo dengan virus & bakteri
export default class IntroScene extends Phaser.Scene {
    constructor() {
        super('IntroScene');
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        
        // Background hitam
        this.add.rectangle(width/2, height/2, width, height, 0x000000);
        
        // Earth di tengah
        const earth = this.add.image(width/2, height/2, 'earth');
        earth.setScale(0.7);
        
        // LOGO INTRO (ada virus & bakteri di sekeliling)
        const logo = this.add.image(width/2, height/2, 'introLogo');
        logo.setScale(0.85);
        logo.setAlpha(0);
        
        // Animasi logo fade in
        this.tweens.add({
            targets: logo,
            alpha: 1,
            duration: 1500,
            ease: 'Power2'
        });
        
        // Animasi Earth zoom in
        this.tweens.add({
            targets: earth,
            scale: 0.95,
            duration: 6000,
            ease: 'Sine.easeInOut'
        });
        
        // Setelah 6 detik, pindah ke MenuScene
        this.time.delayedCall(6000, () => {
            this.scene.start('MenuScene');
        });
    }
}