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
        this.fireInterval = options.fireInterval || 300;
        
        this.isActive = false;
        this.pointerId = null;
        this.outputX = 0;
        this.outputY = 0;
        this.outputAngle = 0;
        this.isFiring = false;
        
        this.graphics = scene.add.graphics().setDepth(1000);
        this.lastFireTime = 0;
        
        // Gambar joystick awal
        this.draw();
        
        // Setup input dengan zone yang lebih besar
        this.setupInput();
    }
    
    setupInput() {
        // Zone deteksi lebih besar
        const zoneSize = this.baseRadius * 2.5;
        
        this.zone = this.scene.add.zone(
            this.baseX, 
            this.baseY, 
            zoneSize, 
            zoneSize
        ).setOrigin(0.5).setDepth(1001);
        
        this.zone.setInteractive({ useHandCursor: false });
        
        // ✅ POINTER DOWN - Aktifkan joystick ini dengan pointer ID unik
        this.zone.on('pointerdown', (pointer) => {
            // Hanya aktif jika belum ada yang pakai
            if (!this.isActive) {
                this.isActive = true;
                this.pointerId = pointer.id;
                this.updateKnob(pointer.x, pointer.y);
            }
        });
        
        // ✅ POINTER MOVE - Update hanya jika pointer ID cocok
        this.scene.input.on('pointermove', (pointer) => {
            if (this.isActive && pointer.id === this.pointerId) {
                this.updateKnob(pointer.x, pointer.y);
            }
        });
        
        // ✅ POINTER UP - Reset hanya jika pointer ID cocok
        this.scene.input.on('pointerup', (pointer) => {
            if (this.isActive && pointer.id === this.pointerId) {
                this.resetKnob();
            }
        });
    }
    
    updateKnob(pointerX, pointerY) {
        const dx = pointerX - this.baseX;
        const dy = pointerY - this.baseY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Clamp jarak
        const clampedDistance = Math.min(distance, this.baseRadius);
        const angle = Math.atan2(dy, dx);
        
        const knobX = this.baseX + Math.cos(angle) * clampedDistance;
        const knobY = this.baseY + Math.sin(angle) * clampedDistance;
        
        // Update output
        this.outputX = (knobX - this.baseX) / this.baseRadius;
        this.outputY = (knobY - this.baseY) / this.baseRadius;
        this.outputAngle = angle;
        
        // Auto-fire untuk aim joystick
        if (this.isAimJoystick && this.autoFire) {
            this.isFiring = true;
        }
        
        // Redraw dengan knob
        this.drawWithKnob(knobX, knobY);
    }
    
    resetKnob() {
        this.isActive = false;
        this.isFiring = false;
        this.pointerId = null;
        this.outputX = 0;
        this.outputY = 0;
        this.outputAngle = 0;
        
        // Kembalikan ke posisi tengah
        this.draw();
    }
    
    draw() {
        // Gambar joystick dengan knob di tengah
        this.graphics.clear();
        
        // Base circle
        this.graphics.lineStyle(3, this.color, 0.6);
        this.graphics.strokeCircle(this.baseX, this.baseY, this.baseRadius);
        
        // Base fill
        this.graphics.fillStyle(this.color, 0.1);
        this.graphics.fillCircle(this.baseX, this.baseY, this.baseRadius);
        
        // Knob di tengah
        this.graphics.fillStyle(this.color, 0.5);
        this.graphics.fillCircle(this.baseX, this.baseY, this.knobRadius);
        
        this.graphics.lineStyle(2, 0xffffff, 0.9);
        this.graphics.strokeCircle(this.baseX, this.baseY, this.knobRadius);
    }
    
    drawWithKnob(knobX, knobY) {
        // Gambar joystick dengan knob di posisi jari
        this.graphics.clear();
        
        // Base circle
        this.graphics.lineStyle(3, this.color, 0.6);
        this.graphics.strokeCircle(this.baseX, this.baseY, this.baseRadius);
        
        // Base fill
        this.graphics.fillStyle(this.color, 0.1);
        this.graphics.fillCircle(this.baseX, this.baseY, this.baseRadius);
        
        // Knob mengikuti jari
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
    
    update(time) {
        // Auto-fire logic
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