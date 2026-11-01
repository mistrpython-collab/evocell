// js/utils/virtualjoystick.js
export default class VirtualJoystick {
    constructor(scene, x, y, options = {}) {
        this.scene = scene;
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
        
        this.setupInput();
    }
    
    setupInput() {
        const zoneSize = this.baseRadius * 3;
        
        this.zone = this.scene.add.zone(
            this.currentX, 
            this.currentY, 
            zoneSize, 
            zoneSize
        ).setOrigin(0.5).setDepth(1001);
        
        this.zone.setInteractive({ useHandCursor: false });
        
        this.zone.on('pointerdown', (pointer) => {
            this.spawn(pointer.x, pointer.y, pointer.id);
        });
        
        this.scene.input.on('pointermove', (pointer) => {
            if (this.isActive && pointer.id === this.pointerId) {
                this.updateKnob(pointer.x, pointer.y);
            }
        });
        
        this.scene.input.on('pointerup', (pointer) => {
            if (this.isActive && pointer.id === this.pointerId) {
                this.destroy();
            }
        });
    }
    
    spawn(x, y, pointerId) {
        this.isActive = true;
        this.pointerId = pointerId;
        this.currentX = x;
        this.currentY = y;
        this.zone.setPosition(x, y);
    }
    
    updateKnob(pointerX, pointerY) {
        const dx = pointerX - this.currentX;
        const dy = pointerY - this.currentY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        const clampedDistance = Math.min(distance, this.baseRadius);
        const angle = Math.atan2(dy, dx);
        
        const knobX = this.currentX + Math.cos(angle) * clampedDistance;
        const knobY = this.currentY + Math.sin(angle) * clampedDistance;
        
        this.outputX = (knobX - this.currentX) / this.baseRadius;
        this.outputY = (knobY - this.currentY) / this.baseRadius;
        this.outputAngle = angle;
        
        if (this.isAimJoystick && this.autoFire) {
            this.isFiring = true;
        }
        
        this.draw(knobX, knobY);
    }
    
    draw(knobX, knobY) {
        this.graphics.clear();
        
        this.graphics.lineStyle(3, this.color, 0.6);
        this.graphics.strokeCircle(this.currentX, this.currentY, this.baseRadius);
        
        this.graphics.fillStyle(this.color, 0.1);
        this.graphics.fillCircle(this.currentX, this.currentY, this.baseRadius);
        
        this.graphics.fillStyle(this.color, 0.8);
        this.graphics.fillCircle(knobX, knobY, this.knobRadius);
        
        this.graphics.lineStyle(2, 0xffffff, 0.9);
        this.graphics.strokeCircle(knobX, knobY, this.knobRadius);
        
        if (this.isAimJoystick && this.isFiring) {
            const endX = this.currentX + Math.cos(this.outputAngle) * (this.baseRadius + 20);
            const endY = this.currentY + Math.sin(this.outputAngle) * (this.baseRadius + 20);
            
            this.graphics.lineStyle(2, 0xff0000, 0.8);
            this.graphics.lineBetween(this.currentX, this.currentY, endX, endY);
            
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
                    x: this.currentX,
                    y: this.currentY
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