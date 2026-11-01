// js/utils/dualjoystick.js
import VirtualJoystick from './virtualjoystick.js';

export default class DualJoystickManager {
    constructor(scene) {
        this.scene = scene;
        this.leftJoystick = null;
        this.rightJoystick = null;
        
        this.setupZones();
        this.createJoysticks();
        
        this.scene.events.on('joystick-fire', this.handleFire, this);
    }
    
    setupZones() {
        const width = this.scene.cameras.main.width;
        const height = this.scene.cameras.main.height;
        
        this.leftZoneX = width * 0.20;
        this.leftZoneY = height * 0.75;
        this.rightZoneX = width * 0.80;
        this.rightZoneY = height * 0.75;
    }
    
    createJoysticks() {
        this.leftJoystick = new VirtualJoystick(
            this.scene, this.leftZoneX, this.leftZoneY,
            { baseRadius: 80, knobRadius: 30, color: 0x00ffff, isAimJoystick: false, autoFire: false }
        );
        
        this.rightJoystick = new VirtualJoystick(
            this.scene, this.rightZoneX, this.rightZoneY,
            { baseRadius: 80, knobRadius: 30, color: 0x0088ff, isAimJoystick: true, autoFire: true, fireInterval: 300 }
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