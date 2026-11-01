export default class VirtualJoystick {
    constructor(scene, x, y, options = {}) {
        this.scene = scene;
        this.baseX = x;
        this.baseY = y;
        this.currentX = x;
        this.currentY = y;
        
        this.baseRadius = options.baseRadius || 80;
        this.knobRadius = options.knobRadius || 30;
        this.color = options.color || 0x00ffff;
        this.isAimJoystick = options.isAimJoystick || false;
        this.autoFire = options.autoFire || false;
        this.fireInterval = options.fireInterval || 300;
        
        this.isActive = false;
        this.pointerId = null;
        this.outputX = 0;
        this.outputY = 0;
        this.outputAngle = 0;
        this.isFiring = false;
        
        this.graphics = scene.add.graphics().setDepth(1000);
        this.lastFireTime = 0;
        
        // ✅ LANGSUNG GAMBAR JOYSTICK (FIXED - SELALU TERLIHAT)
        this.drawFixed();
        
        this.setupInput();
    }
    
    setupInput() {
        const zoneSize = this.baseRadius * 3;
        
        this.zone = this.scene.add.zone(
            this.baseX, 
            this.baseY, 
            zoneSize, 
            zoneSize
        ).setOrigin(0.5).setDepth(1001);
        
        this.zone.setInteractive({ useHandCursor: false });
        
        this.zone.on('pointerdown', (pointer) => {
            this.isActive = true;
            this.pointerId = pointer.id;
        });
        
        this.scene.input.on('pointermove', (pointer) => {
            if (this.isActive && pointer.id === this.pointerId) {
                this.updateKnob(pointer.x, pointer.y);
            }
        });
        
        this.scene.input.on('pointerup', (pointer) => {
            if (this.isActive && pointer.id === this.pointerId) {
                this.resetKnob();
            }
        });
    }
    
    drawFixed() {
        // Gambar base dan knob di posisi FIXED (tidak bergerak)
        this.graphics.clear();
        
        // Base circle (outline)
        this.graphics.lineStyle(3, this.color, 0.6);
        this.graphics.strokeCircle(this.baseX, this.baseY, this.baseRadius);
        
        // Base fill (transparan)
        this.graphics.fillStyle(this.color, 0.1);
        this.graphics.fillCircle(this.baseX, this.baseY, this.baseRadius);
        
        // Knob circle (di tengah saat tidak aktif)
        this.graphics.fillStyle(this.color, 0.5);
        this.graphics.fillCircle(this.baseX, this.baseY, this.knobRadius);
        
        this.graphics.lineStyle(2, 0xffffff, 0.9);
        this.graphics.strokeCircle(this.baseX, this.baseY, this.knobRadius);
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
        
        // Redraw dengan knob yang bergerak
        this.graphics.clear();
        
        this.graphics.lineStyle(3, this.color, 0.6);
        this.graphics.strokeCircle(this.baseX, this.baseY, this.baseRadius);
        
        this.graphics.fillStyle(this.color, 0.1);
        this.graphics.fillCircle(this.baseX, this.baseY, this.baseRadius);
        
        this.graphics.fillStyle(this.color, 0.8);
        this.graphics.fillCircle(knobX, knobY, this.knobRadius);
        
        this.graphics.lineStyle(2, 0xffffff, 0.9);
        this.graphics.strokeCircle(knobX, knobY, this.knobRadius);
        
        // Garis arah untuk aim joystick
        if (this.isAimJoystick && this.isFiring) {
            const endX = this.baseX + Math.cos(this.outputAngle) * (this.baseRadius + 20);
            const endY = this.baseY + Math.sin(this.outputAngle) * (this.baseRadius + 20);
            
            this.graphics.lineStyle(2, 0xff0000, 0.8);
            this.graphics.lineBetween(this.baseX, this.baseY, endX, endY);
            
            this.graphics.fillStyle(0xff0000, 1);
            this.graphics.fillCircle(endX, endY, 5);
        }
    }
    
    resetKnob() {
        this.isActive = false;
        this.isFiring = false;
        this.pointerId = null;
        this.outputX = 0;
        this.outputY = 0;
        this.outputAngle = 0;
        
        // Kembalikan ke gambar fixed
        this.drawFixed();
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
        this.pointerId = null;
        this.outputX = 0;
        this.outputY = 0;
        this.outputAngle = 0;
        
        this.graphics.clear();
        if (this.zone) {
            this.zone.destroy();
        }
    }
}