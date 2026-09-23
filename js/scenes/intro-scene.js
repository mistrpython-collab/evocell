// intro-scene.js - Intro scene dengan Earth + EvoCell logo (6 detik)
export default class IntroScene extends Phaser.Scene {
    constructor() {
        super('IntroScene');
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        
        // Background hitam
        this.add.rectangle(width/2, height/2, width, height, 0x000000);
        
        // Earth di tengah (background logo)
        const earth = this.add.image(width/2, height/2, 'earth');
        earth.setScale(0.9);
        
        // Animasi Earth (zoom in perlahan)
        earth.setScale(0.7);
        this.tweens.add({
            targets: earth,
            scale: 0.95,
            duration: 6000,
            ease: 'Sine.easeInOut'
        });
        
        // Logo EvoCell di atas Earth
        const logo = this.add.image(width/2, height/2, 'logo');
        logo.setScale(0.85);
        
        // Animasi logo (fade in)
        logo.setAlpha(0);
        this.tweens.add({
            targets: logo,
            alpha: 1,
            duration: 1500,
            ease: 'Power2'
        });
        
        // Setelah 6 detik, pindah ke Menu Scene
        this.time.delayedCall(6000, () => {
            // Fade out effect
            this.cameras.main.fadeOut(800, 0, 0, 0);
            
            this.cameras.main.once('camera-fade-out-complete', () => {
                this.scene.start('MenuScene');
            });
        });
    }
}