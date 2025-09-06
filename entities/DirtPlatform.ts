import { Terrain } from "../level/constants";
import { Platform } from "./Platform";
import Phaser from "phaser";

export class DirtPlatform extends Platform {
  constructor(scene: Phaser.Scene, x: number, y: number, width: number, hexSize: number) {
    super(scene, x, y, width, Terrain.DIRT, hexSize);
  }
}
