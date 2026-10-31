// js/utils/translations.js
export const translations = {
    id: {
        deviceMode: "Mode Perangkat",
        campaign: "Kampanye",
        back: "Kembali",
        pause: "Jeda",
        resume: "Lanjutkan",
        exit: "Keluar",
        play: "Main",
        selectMission: "Pilih Misi",
        mission: "Misi",
        learnBasics: "Pelajari Dasar",
        challengeBoss: "Tantang Boss",
        avoidObstacles: "Hindari Rintangan",
        score: "Skor",
        lives: "Nyawa",
        hp: "HP",
        prokaryotic: "Prokariotik",
        virus: "Virus",
        whiteBloodCell: "Sel Darah Putih",
        prokaryoticTitle: "PROKARIOTIK",
        virusTitle: "VIRUS",
        wbcTitle: "SEL DARAH PUTIH",
        boss1Appears: "⚠️ BOSS 1 MUNCUL! ⚠️\nBakteri Merah - Capai Skor 1500!",
        boss2Appears: "⚠️ BOSS 2 MUNCUL! ⚠️\nPenembak Ungu - Capai Skor 3000!",
        boss3Appears: "⚠️ BOSS 3 MUNCUL! ⚠️\nBerserker Kuning - Capai Skor 10000!",
        boss1Immune: "BOSS 1: KEBAL (Capai Skor 1500)",
        boss1Vulnerable: "BOSS 1: RENTAN! KEJAR DAN TABRAK!",
        boss2Immune: "BOSS 2: KEBAL (Capai Skor 3000)",
        boss2Vulnerable: "BOSS 2: RENTAN! KEJAR DAN TABRAK!",
        boss3Immune: "BOSS 3: KEBAL (Capai Skor 10000)",
        boss3Vulnerable: "BOSS 3: RENTAN! KEJAR DAN TABRAK!",
        boss3Phase2Immune: "BOSS 3 FASE 2: KEBAL (Capai Skor 15000)",
        boss3Phase2Vulnerable: "BOSS 3 FASE 2: RENTAN! KEJAR DAN TABRAK!",
        prokaryoticVictory: "MISI BERHASIL!",
                mission2Complete: "MISI 2 SELESAI!",
        prokaryoticGameOver: "PERMAINAN BERAKHIR",
        virusVictory: "MISI SELESAI!",
        virusGameOver: "VIRUS MATI",
        wbcVictory: "MISI SELESAI!",
        wbcGameOver: "SEL DARAH PUTIH GAGAL",
        dodgerInstruction: "Gunakan WASD atau tombol panah untuk bergerak!",
        dodgerGameOver: "PERMAINAN BERAKHIR",
        clickToMenu: "Klik untuk kembali ke menu",
        mission2Warning: "MISI 2\nMODE SULIT + 3 PERTARUNGAN BOS",
        virusMissionText: "MISI VIRUS\nInfeksi sel untuk bertahan hidup!",
        wbcMissionText: "MISI SEL DARAH PUTIH\nWASD untuk bergerak. Bidik dan klik untuk menembak!",
        selectDeviceTitle: "PILIH MODE PERANGKAT",
        selectDeviceSubtitle: "Pilih sesuai perangkat yang Anda gunakan",
        pcMode: "PC",
        laptopMode: "Laptop",
        mobileMode: "Ponsel",
        paused: "PERMAINAN DIJEDA"
    },
    en: {
        deviceMode: "Device Mode",
        campaign: "Campaign",
        back: "Back",
        pause: "Pause",
        resume: "Resume",
        exit: "Exit",
        play: "Play",
        selectMission: "Select Mission",
        mission: "Mission",
        learnBasics: "Learn Basics",
        challengeBoss: "Challenge Boss",
        avoidObstacles: "Avoid Obstacles",
        score: "Score",
        lives: "Lives",
        hp: "HP",
        prokaryotic: "Prokaryotic",
        virus: "Virus",
        whiteBloodCell: "White Blood Cell",
        prokaryoticTitle: "PROKARYOTIC",
        virusTitle: "VIRUS",
        wbcTitle: "WHITE BLOOD CELL",
        boss1Appears: "⚠️ BOSS 1 APPEARS! ⚠️\nRed Bacteria - Reach 1500!",
        boss2Appears: "⚠️ BOSS 2 APPEARS! ⚠️\nPurple Shooter - Reach 3000!",
        boss3Appears: "⚠️ BOSS 3 APPEARS! ⚠️\nYellow Berserker - Reach 10000!",
        boss1Immune: "BOSS 1: IMMUNE (Reach Score 1500)",
        boss1Vulnerable: "BOSS 1: VULNERABLE! CHASE AND COLLIDE!",
        boss2Immune: "BOSS 2: IMMUNE (Reach Score 3000)",
        boss2Vulnerable: "BOSS 2: VULNERABLE! CHASE AND COLLIDE!",
        boss3Immune: "BOSS 3: IMMUNE (Reach Score 10000)",
        boss3Vulnerable: "BOSS 3: VULNERABLE! CHASE AND COLLIDE!",
        boss3Phase2Immune: "BOSS 3 PHASE 2: IMMUNE (Reach Score 15000)",
        boss3Phase2Vulnerable: "BOSS 3 PHASE 2: VULNERABLE! CHASE AND COLLIDE!",
        prokaryoticVictory: "MISSION ACCOMPLISHED!",
                mission2Complete: "MISSION 2 COMPLETE!",
        prokaryoticGameOver: "GAME OVER",
        virusVictory: "MISSION COMPLETE!",
        virusGameOver: "VIRUS DESTROYED",
        wbcVictory: "MISSION COMPLETE!",
        wbcGameOver: "WBC DEFEATED",
        dodgerInstruction: "Use WASD or Arrow keys to move!",
        dodgerGameOver: "GAME OVER",
        clickToMenu: "Click to return to menu",
        mission2Warning: "MISSION 2\nHARD MODE + 3 BOSS BATTLES",
        virusMissionText: "VIRUS MISSION\nInfect cells to survive!",
        wbcMissionText: "WBC MISSION\nWASD to move. Aim and click to shoot!",
        selectDeviceTitle: "SELECT DEVICE MODE",
        selectDeviceSubtitle: "Choose according to your device",
        pcMode: "PC",
        laptopMode: "Laptop",
        mobileMode: "Mobile",
        paused: "GAME PAUSED"
    }
};

export function getLang(key) {
    return translations[getCurrentLang()][key] || key;
}

export function getCurrentLang() {
    return localStorage.getItem('evocell_lang') || 'id';
}

export function toggleLanguage() {
    const currentLang = getCurrentLang();
    const newLang = currentLang === 'id' ? 'en' : 'id';
    localStorage.setItem('evocell_lang', newLang);
    return newLang;
}

export function createLanguageSwitch(scene, x, y) {
    const currentLang = getCurrentLang();
    const switchWidth = 120, switchHeight = 36, knobRadius = 14;
    const knobOffset = switchWidth / 2 - knobRadius - 8;
    
    const container = scene.add.container(x, y);
    container.setDepth(1000);
    
    const track = scene.add.graphics();
    track.fillStyle(0x2a2a2a, 1);
    track.fillRoundedRect(-switchWidth/2, -switchHeight/2, switchWidth, switchHeight, 18);
    track.lineStyle(2, 0x555555, 1);
    track.strokeRoundedRect(-switchWidth/2, -switchHeight/2, switchWidth, switchHeight, 18);
    container.add(track);
    
    const enLabel = scene.add.text(-switchWidth/2 + 22, 0, 'ID', { font: 'bold 14px Arial', fill: '#ffffff', stroke: '#000000', strokeThickness: 2 }).setOrigin(0.5);
    container.add(enLabel);
    
    const idLabel = scene.add.text(switchWidth/2 - 22, 0, 'EN', { font: 'bold 14px Arial', fill: '#ffffff', stroke: '#000000', strokeThickness: 2 }).setOrigin(0.5);
    container.add(idLabel);
    
    const knobX = currentLang === 'en' ? -knobOffset : knobOffset;
    const knob = scene.add.graphics();
    knob.fillStyle(0x00ff00, 1);
    knob.fillCircle(knobX, 0, knobRadius);
    knob.lineStyle(2, 0x00cc00, 1);
    knob.strokeCircle(knobX, 0, knobRadius);
    container.add(knob);
    
    const hitArea = new Phaser.Geom.Rectangle(-switchWidth/2, -switchHeight/2, switchWidth, switchHeight);
    container.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains);
    
    container.on('pointerdown', () => {
        const oldLang = getCurrentLang();
        const newLang = toggleLanguage();
        if (oldLang !== newLang) {
            const newKnobX = newLang === 'en' ? knobOffset : -knobOffset;
            scene.tweens.add({ targets: knob, x: newKnobX, duration: 300, ease: 'Power2' });
            scene.time.delayedCall(350, () => scene.scene.restart());
        }
    });
    
    container.on('pointerover', () => {
        track.clear(); track.fillStyle(0x3a3a3a, 1); track.fillRoundedRect(-switchWidth/2, -switchHeight/2, switchWidth, switchHeight, 18);
        track.lineStyle(2, 0x00ff00, 1); track.strokeRoundedRect(-switchWidth/2, -switchHeight/2, switchWidth, switchHeight, 18);
    });
    container.on('pointerout', () => {
        track.clear(); track.fillStyle(0x2a2a2a, 1); track.fillRoundedRect(-switchWidth/2, -switchHeight/2, switchWidth, switchHeight, 18);
        track.lineStyle(2, 0x555555, 1); track.strokeRoundedRect(-switchWidth/2, -switchHeight/2, switchWidth, switchHeight, 18);
    });
    return container;
}