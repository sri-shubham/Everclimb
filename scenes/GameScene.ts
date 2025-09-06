import Phaser from "phaser";
import { HexChunkLayer } from "../render/HexChunkLayer";
import { generateChunkInfinite, generateNextChunkInfinite, Chunk } from "../level/InfiniteGen";
import { computeGrid } from "../engine/Grid";

export class GameScene extends Phaser.Scene {
  private curr!: Chunk;
  private next!: Chunk | null;
  private currLayer!: HexChunkLayer;
  private nextLayer!: HexChunkLayer | null;
  private scrollSpeed = 60; // px/sec upward
  private level = 1;

  constructor(){ super("Game"); }

  create() {
    const hexSize = 24;
    this.curr = generateChunkInfinite({ hexSize, seed: 0xDEADBEEF, level: this.level });
    this.currLayer = new HexChunkLayer(this, this.curr, 0);
    this.add.existing(this.currLayer);
    this.next = null; this.nextLayer = null;

    // debug text
    this.add.text(8,8, `Level ${this.level}`, { color:'#fff' }).setScrollFactor(0);
  }

  update(time:number, delta:number) {
    const dy = -this.scrollSpeed * (delta/1000); // move up
    this.currLayer.moveBy(dy);
    if (this.nextLayer) this.nextLayer.moveBy(dy);

    const topThreshold = 120; // when top few rows approach screen top, pregen next
    if (!this.next) {
      // pre-generate when top is within threshold
      if (this.currLayer.getTopY() + 100 < topThreshold) {
        this.next = generateNextChunkInfinite(this.curr);
        // place next above current
        const { vStep } = computeGrid(this.curr.hexSize);
        const offsetY = this.currLayer.getTopY() - (this.next.rows)*vStep;
        this.nextLayer = new HexChunkLayer(this, this.next, 0);
        this.nextLayer.y = offsetY;
        this.add.existing(this.nextLayer);
      }
    } else {
      // swap when current is mostly off-screen
      if (this.currLayer.getBottomY() < -100) {
        this.curr = this.next!;
        this.currLayer.destroy();
        this.currLayer = this.nextLayer!;
        this.next = null; this.nextLayer = null;
        this.level++;
      }
    }
  }
}
