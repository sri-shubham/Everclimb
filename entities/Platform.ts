import Phaser from "phaser";
import { Terrain } from "../level/constants";

export class Platform extends Phaser.GameObjects.GameObject {
  private graphics: Phaser.GameObjects.Graphics;

  constructor(
    scene: Phaser.Scene,
    public x: number,
    public y: number,
    public width: number,
    public terrain: Terrain,
    private hexSize: number
  ) {
    super(scene, "platform");
    this.graphics = this.scene.add.graphics({ x, y });
    this.draw();
  }

  private draw() {
    const { h, w } = this.computeHexMetrics();

    this.graphics.fillStyle(this.getColorForTerrain(this.terrain));

    for (let i = 0; i < this.width; i++) {
      const hexX = i * (w * 0.75);
      // stagger every other hex vertically so edges meet instead of tips overlapping
      const hexY = (i % 2 === 0) ? 0 : h / 2;
      this.drawHex(hexX, hexY, h);

      // create collision body for this hex (approximate with rectangle) if physics available
      this.addHexCollision(hexX, hexY, h);

      // draw connector between this hex and the next one to fill the gap and create a flat surface
      if (i < this.width - 1) {
        this.drawConnector(i, hexX, hexY, h);
        this.addConnectorCollision(i, hexX, hexY, h);
      }
    }

  }

  private drawHex(x: number, y: number, h: number) {
    // Use the pixel width as provided by this.hexSize
    const w = this.hexSize; // full pixel width
    const s = w / 2; // half width
    const halfH = h / 2;

    const points = [
      new Phaser.Geom.Point(x + s, y),
      new Phaser.Geom.Point(x + s / 2, y - halfH),
      new Phaser.Geom.Point(x - s / 2, y - halfH),
      new Phaser.Geom.Point(x - s, y),
      new Phaser.Geom.Point(x - s / 2, y + halfH),
      new Phaser.Geom.Point(x + s / 2, y + halfH),
    ];
    this.graphics.fillPoints(points, true);
  }

  // Draw a connector polygon between hex i and i+1 to fill the gap between their inner edges
  private drawConnector(i: number, hexX: number, hexY: number, h: number) {
    const w = this.hexSize;
    const step = w * 0.75;
    const nextX = hexX + step;
    const nextY = ((i + 1) % 2 === 0) ? 0 : h / 2;

    const s = w / 2;
    const halfH = h / 2;

    const topLeft = new Phaser.Geom.Point(hexX + s / 2, hexY - halfH);
    const topRight = new Phaser.Geom.Point(nextX - s / 2, nextY - halfH);
    const bottomRight = new Phaser.Geom.Point(nextX - s / 2, nextY + halfH);
    const bottomLeft = new Phaser.Geom.Point(hexX + s / 2, hexY + halfH);

    this.graphics.fillPoints([topLeft, topRight, bottomRight, bottomLeft], true);
  }

  private computeHexMetrics() {
    // Interpret this.hexSize as the full pixel width of the hexagon
    const w = this.hexSize;
    // For a regular flat-top hex: height = sqrt(3) * (w/2)
    const h = (Math.sqrt(3) * w) / 2;
    return { h, w };
  }

  private getColorForTerrain(terrain: Terrain): number {
    switch (terrain) {
      case Terrain.DIRT:
        return 0x9b7653;
      case Terrain.STONE:
        return 0x808080;
      case Terrain.MUD:
        return 0x654321;
      case Terrain.ICE:
        return 0xa0d6f0;
      default:
        return 0xffffff;
    }
  }

  private addHexCollision(hexX: number, hexY: number, h: number) {
    // Only add physics bodies if the arcade physics plugin exists on the scene
    const ph = (this.scene as any).physics;
    if (!ph || !ph.add) return;

    const worldX = (this.x ?? 0) + hexX; // graphics origin already accounts for scene offset
    const worldY = (this.y ?? 0) + hexY;

    const bodyWidth = this.hexSize * 0.9;
    const bodyHeight = h * 0.9;

    const rect = this.scene.add.rectangle(worldX, worldY, bodyWidth, bodyHeight, 0x0000ff, 0)
      .setOrigin(0.5)
      .setVisible(false);

    ph.add.existing(rect, true); // static
  }

  private addConnectorCollision(i: number, hexX: number, hexY: number, h: number) {
    const ph = (this.scene as any).physics;
    if (!ph || !ph.add) return;

    const w = this.hexSize;
    const step = w * 0.75;
    const nextX = hexX + step;
    const nextY = ((i + 1) % 2 === 0) ? 0 : h / 2;

    const worldX = (this.x ?? 0) + (hexX + nextX) / 2;
    const worldY = (this.y ?? 0) + (hexY + nextY) / 2;

    const bodyWidth = Math.abs(nextX - hexX);
    const bodyHeight = h * 0.9;

    const rect = this.scene.add.rectangle(worldX, worldY, bodyWidth, bodyHeight, 0x0000ff, 0)
      .setOrigin(0.5)
      .setVisible(false);

    ph.add.existing(rect, true);
  }
  
  destroy() {
    this.graphics.destroy();
    super.destroy();
  }
}
