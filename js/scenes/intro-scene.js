// intro-scene.js - Intro scene sederhana dan reliable
export default class IntroScene extends Phaser.Scene {
    constructor() {
        super('IntroScene');
        console.log('IntroScene: constructor called');
    }

    create() {
        console.log('IntroScene: create started');
        
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        
        // Background hitam
        this.add.rectangle(width/2, height/2, width, height, 0x000000);
        console.log('IntroScene: background added');
        
        // Earth di tengah
        const earth = this.add.image(width/2, height/2, 'earth');
        earth.setScale(0.7);
        console.log('IntroScene: earth added');
        
        // Logo EvoCell
        const logo = this.add.image(width/2, height/2, 'logo');
        logo.setScale(0.85);
        logo.setAlpha(0);
        console.log('IntroScene: logo added');
        
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
        
        console.log('IntroScene: animations started, waiting 6 seconds...');
        
        // Setelah 6 detik, LANGSUNG pindah ke MenuScene (TANPA fadeOut)
        this.time.delayedCall(6000, () => {
            console.log('IntroScene: timeout reached, starting MenuScene NOW!');
            this.scene.start('MenuScene');
        });
    }
}