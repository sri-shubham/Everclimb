import Phaser from "phaser";
import { StonePlatform } from "../entities/StonePlatform";


export default class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: "Game" });
  }

  create() {
    // Debug: set background color so scene is visible
    this.cameras.main.setBackgroundColor(0x08141a);
    this.add.text(8, 8, 'Game Scene', { fontSize: '14px', color: '#ffffff' }).setDepth(1000);

    // Hex size in pixels (full width)
    const hexSize = 32;

    // Hex geometry
    const w = hexSize; // hex full width
    const h = (Math.sqrt(3) * w) / 2; // hex height for flat-top
    const step = w * 0.75; // horizontal step between adjacent flat-top hex centers

    // Compute how many hex columns fit horizontally so they span left->right
    const canvasWidth = Number(this.scale.width);
    // Use ceil to ensure the last hex reaches the right edge (adds one if needed)
    let cols = Math.max(1, Math.ceil((canvasWidth - w) / step) + 1);

    // Add one extra hex on both left and right to ensure full edge coverage
    cols += 2;

    // Total pixel width occupied by the row of hexes (for debug/centering if needed)
    const totalWidth = (cols - 1) * step + w;

    // Start X so we include one extra hex on the left; first center shifts left by one step
    const startX = w / 2 - step;

    // Place the platform so the bottoms of the hexes sit on the bottom edge of the canvas
    const y = Number(this.scale.height) - h / 2;

    // Create a stone platform spanning the full number of columns at the bottom
    new StonePlatform(this, startX, y, cols, hexSize);
  }

  update() {
    // Game update loop (reserved)
  }
}

