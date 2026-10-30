// js/utils/orientation.js

export class OrientationChecker {
    constructor() {
        this.overlay = null;
        this.isLandscape = this.checkOrientation();
    }

    checkOrientation() {
        return window.innerWidth > window.innerHeight;
    }

    createOverlay() {
        if (this.overlay) return;

        // 1. Buat overlay
        this.overlay = document.createElement('div');
        this.overlay.id = 'orientation-overlay';
        this.overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.95);
            z-index: 999999;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            text-align: center;
            pointer-events: auto; /* ✅ Pastikan overlay menerima semua event */
        `;

        // 2. Blok SEMUA pointer events di body kecuali overlay
        document.body.style.pointerEvents = 'none';
        this.overlay.style.pointerEvents = 'auto';

        // 3. Gambar phone-rotation.png
        const icon = document.createElement('img');
        icon.src = 'assets/images/main-menu-evocell/phone-rotation.png';
        icon.alt = 'Putar perangkat ke landscape';
        icon.style.cssText = `
            width: 320px;
            max-width: 80%;
            height: auto;
            margin-bottom: 30px;
            image-rendering: pixelated;
            pointer-events: none; /* Gambar tidak bisa diklik */
            user-select: none;
        `;

        // 4. Judul
        const title = document.createElement('h2');
        title.textContent = 'Putar Perangkat ke Mode Landscape';
        title.style.cssText = `
            color: #00ff00;
            font-size: 28px;
            margin: 0 20px 15px 20px;
            font-family: Arial, sans-serif;
            text-shadow: 0 0 10px #00ff00;
            pointer-events: none;
            user-select: none;
        `;

        // 5. Subtitle
        const subtitle = document.createElement('p');
        subtitle.textContent = 'Game ini hanya dapat dimainkan dalam mode landscape';
        subtitle.style.cssText = `
            color: #cccccc;
            font-size: 18px;
            margin: 0 20px;
            font-family: Arial, sans-serif;
            pointer-events: none;
            user-select: none;
        `;

        this.overlay.appendChild(icon);
        this.overlay.appendChild(title);
        this.overlay.appendChild(subtitle);
        document.body.appendChild(this.overlay);

        // 6. ✅ BLOKIR SEMUA EVENT DI OVERLAY
        // Cegah klik, touch, scroll, dll tembus ke game
        this.overlay.addEventListener('pointerdown', (e) => {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
        }, true);

        this.overlay.addEventListener('touchstart', (e) => {
            e.preventDefault();
            e.stopPropagation();
        }, { passive: false });

        this.overlay.addEventListener('touchmove', (e) => {
            e.preventDefault();
        }, { passive: false });

        this.overlay.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
        }, true);

        // 7. Blok scroll
        document.body.style.overflow = 'hidden';
    }

    removeOverlay() {
        if (this.overlay && this.overlay.parentNode) {
            this.overlay.parentNode.removeChild(this.overlay);
            this.overlay = null;
        }

        // ✅ KEMBALIKAN pointer events ke body
        document.body.style.pointerEvents = 'auto';
        document.body.style.overflow = 'auto';
    }

    checkAndUpdate() {
        const wasLandscape = this.isLandscape;
        this.isLandscape = this.checkOrientation();

        if (!wasLandscape && this.isLandscape) {
            this.removeOverlay();
        } else if (wasLandscape && !this.isLandscape) {
            this.createOverlay();
        }
    }

    startMonitoring() {
        if (!this.isLandscape) {
            this.createOverlay();
        }

        window.addEventListener('orientationchange', () => {
            setTimeout(() => this.checkAndUpdate(), 100);
        });

        window.addEventListener('resize', () => {
            setTimeout(() => this.checkAndUpdate(), 100);
        });
    }
}

export const orientationChecker = new OrientationChecker();