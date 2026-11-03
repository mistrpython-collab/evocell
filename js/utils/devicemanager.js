// js/utils/devicemanager.js
// Mengelola mode perangkat (laptop/pc/mobile) secara terpusat

export const DeviceMode = {
    // Kunci penyimpanan di localStorage
    STORAGE_KEY: 'evocell_device',
    
    // Nilai default jika belum pernah dipilih
    DEFAULT_MODE: 'laptop',

    // 1. Mendapatkan mode saat ini ('laptop', 'pc', atau 'mobile')
    getMode() {
        return localStorage.getItem(this.STORAGE_KEY) || this.DEFAULT_MODE;
    },

    // 2. Menyimpan pilihan user
    setMode(mode) {
        if (mode === 'laptop' || mode === 'pc' || mode === 'mobile') {
            localStorage.setItem(this.STORAGE_KEY, mode);
        }
    },

    // 3. Cek apakah sedang di mode mobile
    isMobile() {
        return this.getMode() === 'mobile';
    },

    // 4. Cek apakah sedang di mode laptop (PC + auto-shoot)
    isLaptop() {
        return this.getMode() === 'laptop';
    },

    // 5. Cek apakah sedang di mode PC (manual)
    isPC() {
        return this.getMode() === 'pc';
    },

    // 6. Auto-detect berdasarkan layar sentuh
    autoDetect() {
        const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        const detectedMode = hasTouch ? 'mobile' : 'laptop';
        if (!localStorage.getItem(this.STORAGE_KEY)) {
            this.setMode(detectedMode);
        }
        return this.getMode();
    }
};