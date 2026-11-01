// js/utils/dualjoystick.js
import VirtualJoystick from './virtualjoystick.js';

export default class DualJoystickManager {
    constructor(scene) {
        this.scene = scene;
        this.leftJoystick = null;  // ← TIDAK DIPAKAI
        this.rightJoystick = null; // ← JOYSTICK AIM
        
        this.setupZones();
        this.createJoysticks();
        
        this.scene.events.on('joystick-fire', this.handleFire, this);
    }
    
    setupZones() {
        const width = this.scene.cameras.main.width;
        const height = this.scene.cameras.main.height;
        
        // ← HANYA JOYSTICK KANAN (AIM)
        this.rightZoneX = width * 0.80;
        this.rightZoneY = height * 0.80;
    }
    
    createJoysticks() {
        // ← TIDAK BUAT JOYSTICK KIRI
        this.leftJoystick = null;
        
        // ← HANYA BUAT JOYSTICK KANAN (AIM)
        this.rightJoystick = new VirtualJoystick(
            this.scene, this.rightZoneX, this.rightZoneY,
            { 
                baseRadius: 80, 
                knobRadius: 30, 
                color: 0xff00ff, // Ungu/Magenta
                isAimJoystick: true, 
                autoFire: true, 
                fireInterval: 150 // Lebih cepat
            }
        );
    }
    
    handleFire(data) {
        this.scene.events.emit('wbc-auto-fire', data);
    }
    
    update(time) {
        // ← HANYA UPDATE JOYSTICK KANAN
        if (this.rightJoystick) this.rightJoystick.update(time);
    }
    
    destroy() {
        if (this.rightJoystick) this.rightJoystick.destroy();
        this.scene.events.removeListener('joystick-fire');
    }
}