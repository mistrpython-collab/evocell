// config.js - Konfigurasi game Phaser
import BootScene from "./scenes/boot-scene.js";
import IntroScene from "./scenes/intro-scene.js";
import MenuScene from "./scenes/menu-scene.js";
import ModeSelectScene from "./scenes/mode-select-scene.js";
import ProkaryoticGame from "./scenes/prokaryotic-game.js";

console.log("Loading config...");

const config = {
  type: Phaser.AUTO,
  width: 1280,
  height: 720,
  backgroundColor: "#000000",
  parent: "game-container",
  scene: [
    BootScene,
    IntroScene, // IntroScene ditambahkan di sini!
    MenuScene,
    ModeSelectScene,
    ProkaryoticGame,
  ],
  physics: {
    default: "arcade",
    arcade: {
      gravity: { y: 0 },
      debug: false,
    },
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
};

console.log(
  "Config loaded with scenes:",
  config.scene.map((s) => s.name || s.key),
);

export default config;
