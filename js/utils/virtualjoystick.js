export default class VirtualJoystick {
    constructor(scene, x, y, options = {}) {
        this.scene = scene;
        this.baseX = x;
        this.baseY = y;
        
        this.baseRadius = options.baseRadius || 80;
        this.knobRadius = options.knobRadius || 30;
        this.color = options.color || 0x00ffff;
        this.isAimJoystick = options.isAimJoystick || false;
        this.autoFire = options.autoFire || false;
        this.fireInterval = options.fireInterval || 150; // Dipercepat
        
        this.isActive = false;
        this.outputX = 0;
        this.outputY = 0;
        this.outputAngle = 0;
        this.isFiring = false;
        
        this.graphics = scene.add.graphics().setDepth(1000);
        this.lastFireTime = 0;
        
        this.draw();
        this.setupInput();
    }
    
    setupInput() {
        // Zone deteksi (2.5x radius)
        const zoneSize = this.baseRadius * 2.5;
        
        this.zone = this.scene.add.zone(
            this.baseX, 
            this.baseY, 
            zoneSize, 
            zoneSize
        ).setOrigin(0.5).setDepth(1001).setInteractive();
        
        // ✅ INI KUNCINYA: Gunakan sistem DRAG bawaan Phaser
        // Sistem ini secara otomatis menangani multi-touch dengan sempurna
        this.scene.input.setDraggable(this.zone);
        
        // Saat jari mulai menyentuh zone ini
        this.zone.on('dragstart', (pointer, x, y) => {
            this.isActive = true;
            this.updateKnob(x, y);
        });
        
        // Saat jari bergerak di dalam zone
        this.zone.on('drag', (pointer, x, y) => {
            if (this.isActive) {
                this.updateKnob(x, y);
            }
        });
        
        // Saat jari diangkat
        this.zone.on('dragend', () => {
            this.resetKnob();
        });
    }
    
    updateKnob(pointerX, pointerY) {
        const dx = pointerX - this.baseX;
        const dy = pointerY - this.baseY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        const clampedDistance = Math.min(distance, this.baseRadius);
        const angle = Math.atan2(dy, dx);
        
        const knobX = this.baseX + Math.cos(angle) * clampedDistance;
        const knobY = this.baseY + Math.sin(angle) * clampedDistance;
        
        this.outputX = (knobX - this.baseX) / this.baseRadius;
        this.outputY = (knobY - this.baseY) / this.baseRadius;
        this.outputAngle = angle;
        
        if (this.isAimJoystick && this.autoFire) {
            this.isFiring = true;
        }
        
        this.drawWithKnob(knobX, knobY);
    }
    
    resetKnob() {
        this.isActive = false;
        this.isFiring = false;
        this.outputX = 0;
        this.outputY = 0;
        this.outputAngle = 0;
        this.draw();
    }
    
    draw() {
        this.graphics.clear();
        this.graphics.lineStyle(3, this.color, 0.6);
        this.graphics.strokeCircle(this.baseX, this.baseY, this.baseRadius);
        this.graphics.fillStyle(this.color, 0.1);
        this.graphics.fillCircle(this.baseX, this.baseY, this.baseRadius);
        this.graphics.fillStyle(this.color, 0.5);
        this.graphics.fillCircle(this.baseX, this.baseY, this.knobRadius);
        this.graphics.lineStyle(2, 0xffffff, 0.9);
        this.graphics.strokeCircle(this.baseX, this.baseY, this.knobRadius);
    }
    
    drawWithKnob(knobX, knobY) {
        this.graphics.clear();
        this.graphics.lineStyle(3, this.color, 0.6);
        this.graphics.strokeCircle(this.baseX, this.baseY, this.baseRadius);
        this.graphics.fillStyle(this.color, 0.1);
        this.graphics.fillCircle(this.baseX, this.baseY, this.baseRadius);
        this.graphics.fillStyle(this.color, 0.8);
        this.graphics.fillCircle(knobX, knobY, this.knobRadius);
        this.graphics.lineStyle(2, 0xffffff, 0.9);
        this.graphics.strokeCircle(knobX, knobY, this.knobRadius);
        
        if (this.isAimJoystick && this.isFiring) {
            const endX = this.baseX + Math.cos(this.outputAngle) * (this.baseRadius + 20);
            const endY = this.baseY + Math.sin(this.outputAngle) * (this.baseRadius + 20);
            this.graphics.lineStyle(2, 0xff0000, 0.8);
            this.graphics.lineBetween(this.baseX, this.baseY, endX, endY);
            this.graphics.fillStyle(0xff0000, 1);
            this.graphics.fillCircle(endX, endY, 5);
        }
    }
    
    update(time) {
        if (this.isAimJoystick && this.isFiring && this.autoFire) {
            if (time - this.lastFireTime > this.fireInterval) {
                this.lastFireTime = time;
                this.scene.events.emit('joystick-fire', {
                    angle: this.outputAngle,
                    x: this.baseX,
                    y: this.baseY
                });
            }
        }
    }
    
    destroy() {
        this.isActive = false;
        this.isFiring = false;
        this.outputX = 0;
        this.outputY = 0;
        this.outputAngle = 0;
        this.graphics.clear();
        if (this.zone) {
            this.zone.destroy();
        }
    }
}