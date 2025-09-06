import Phaser from "phaser";
import { TitleScene } from "./scenes/TitleScene";
import GameScene from "./scenes/GameScene";

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 640,
  height: 480,
  scene: [TitleScene, GameScene],
  scale: {
    autoCenter: Phaser.Scale.CENTER_BOTH,
    parent: "app",
  },
  backgroundColor: "#222222",
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false
    }
  }
};

const game = new Phaser.Game(config);

// Electron API integration
declare global {
  interface Window {
    electronAPI?: {
      onNewGame: (callback: () => void) => void;
      onTogglePause: (callback: () => void) => void;
      removeAllListeners: (channel: string) => void;
    };
  }
}

// Set up Electron menu callbacks if running in Electron
if (window.electronAPI) {
  window.electronAPI.onNewGame(() => {
    // Restart the game
    if (game.scene.isActive("Game")) {
      game.scene.stop("Game");
    }
    game.scene.start("TitleScene");
  });

  window.electronAPI.onTogglePause(() => {
    // Toggle pause for active scenes
    if (game.scene.isActive("Game")) {
      const gameScene = game.scene.getScene("Game");
      if (gameScene.scene.isPaused()) {
        gameScene.scene.resume();
      } else {
        gameScene.scene.pause();
      }
    }
  });
}

// Clean up Electron listeners when page unloads
window.addEventListener("beforeunload", () => {
  if (window.electronAPI) {
    window.electronAPI.removeAllListeners("new-game");
    window.electronAPI.removeAllListeners("toggle-pause");
  }
});
