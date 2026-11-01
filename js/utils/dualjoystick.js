// js/utils/dualjoystick.js
import VirtualJoystick from './virtualjoystick.js';

export default class DualJoystickManager {
    constructor(scene) {
        this.scene = scene;
        this.leftJoystick = null;   // ← JOYSTICK GERAK (KIRI)
        this.rightJoystick = null;  // ← JOYSTICK TEMBAK (KANAN)
        
        this.setupZones();
        this.createJoysticks();
        
        this.scene.events.on('joystick-fire', this.handleFire, this);
    }
    
    setupZones() {
        const width = this.scene.cameras.main.width;
        const height = this.scene.cameras.main.height;
        
        // Joystick Kiri (Gerak) - Kiri Bawah
        this.leftZoneX = width * 0.10;
        this.leftZoneY = height * 0.80;
        
        // Joystick Kanan (Tembak) - Kanan Bawah
        this.rightZoneX = width * 0.65;
        this.rightZoneY = height * 0.80;
    }
    
    createJoysticks() {
        // JOYSTICK KIRI - Untuk Gerak (Cyan)
        this.leftJoystick = new VirtualJoystick(
            this.scene, this.leftZoneX, this.leftZoneY,
            { 
                baseRadius: 80, 
                knobRadius: 30, 
                color: 0x00ffff, // Cyan
                isAimJoystick: false, 
                autoFire: false 
            }
        );
        
        // JOYSTICK KANAN - Untuk Aim + Auto Shoot (Ungu/Magenta)
        this.rightJoystick = new VirtualJoystick(
            this.scene, this.rightZoneX, this.rightZoneY,
            { 
                baseRadius: 80, 
                knobRadius: 30, 
                color: 0xff00ff, // Magenta
                isAimJoystick: true, 
                autoFire: true, 
                fireInterval: 150 // Cepat
            }
        );
    }
    
    handleFire(data) {
        this.scene.events.emit('wbc-auto-fire', data);
    }
    
    update(time) {
        if (this.leftJoystick) this.leftJoystick.update(time);
        if (this.rightJoystick) this.rightJoystick.update(time);
    }
    
    destroy() {
        if (this.leftJoystick) this.leftJoystick.destroy();
        if (this.rightJoystick) this.rightJoystick.destroy();
        this.scene.events.removeListener('joystick-fire');
    }
}