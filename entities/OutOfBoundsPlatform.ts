import { Terrain } from "../level/constants";
import { Platform } from "./Platform";
import Phaser from "phaser";

export class OutOfBoundsPlatform extends Platform {
  constructor(scene: Phaser.Scene, x: number, y: number, width: number, hexSize: number) {
    // Create a set with all indices to make all hexagons out-of-bounds
    const allOutOfBounds = new Set<number>();
    for (let i = 0; i < width; i++) {
      allOutOfBounds.add(i);
    }
    
    super(scene, x, y, width, Terrain.OUT_OF_BOUNDS, hexSize, allOutOfBounds);
  }
}
