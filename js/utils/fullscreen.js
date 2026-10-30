// js/utils/fullscreen.js

export class FullscreenManager {
    constructor() {
        this.isFullscreen = false;
        this.supportsFullscreen = this.checkFullscreenSupport();
        
        // Listen untuk perubahan status fullscreen dari browser
        document.addEventListener('fullscreenchange', () => this.onFullscreenChange());
        document.addEventListener('webkitfullscreenchange', () => this.onFullscreenChange());
        document.addEventListener('mozfullscreenchange', () => this.onFullscreenChange());
        document.addEventListener('MSFullscreenChange', () => this.onFullscreenChange());
    }

    // Cek apakah browser support fullscreen
    checkFullscreenSupport() {
        return !!(
            document.fullscreenEnabled ||
            document.webkitFullscreenEnabled ||
            document.mozFullScreenEnabled ||
            document.msFullscreenEnabled
        );
    }

    // Fungsi untuk masuk/keluar fullscreen
    toggleFullscreen() {
        if (!this.supportsFullscreen) {
            console.warn('Fullscreen not supported in this browser');
            return false;
        }

        const doc = document.documentElement;

        if (!this.isFullscreen) {
            // Masuk fullscreen
            if (doc.requestFullscreen) doc.requestFullscreen();
            else if (doc.webkitRequestFullscreen) doc.webkitRequestFullscreen();
            else if (doc.mozRequestFullScreen) doc.mozRequestFullScreen();
            else if (doc.msRequestFullscreen) doc.msRequestFullscreen();
        } else {
            // Keluar fullscreen
            if (document.exitFullscreen) document.exitFullscreen();
            else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
            else if (document.mozCancelFullScreen) document.mozCancelFullScreen();
            else if (document.msExitFullscreen) document.msExitFullscreen();
        }

        return true;
    }

    // Handler otomatis saat status berubah
    onFullscreenChange() {
        this.isFullscreen = !!(
            document.fullscreenElement ||
            document.webkitFullscreenElement ||
            document.mozFullScreenElement ||
            document.msFullscreenElement
        );
        console.log('Fullscreen status:', this.isFullscreen);
    }

    getStatus() {
        return this.isFullscreen;
    }
}

// Export instance tunggal
export const fullscreenManager = new FullscreenManager();