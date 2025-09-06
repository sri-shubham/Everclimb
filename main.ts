import Phaser from 'phaser';
import { TitleScene } from './scenes/TitleScene';
import { GameScene } from './scenes/GameScene';

const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    width: 640,
    height: 480,
    scene: [TitleScene, GameScene],
    scale: {
        autoCenter: Phaser.Scale.CENTER_BOTH,
    }
};

new Phaser.Game(config);
