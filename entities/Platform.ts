import Phaser from "phaser";
import { Terrain } from "../level/constants";

export class Platform extends Phaser.GameObjects.GameObject {
  private graphics: Phaser.GameObjects.Graphics;
  public collisionBodies: Phaser.GameObjects.GameObject[] = [];
  public outOfBoundsCollisionBodies: Phaser.GameObjects.GameObject[] = [];

  constructor(
    scene: Phaser.Scene,
    public x: number,
    public y: number,
    public width: number,
    public terrain: Terrain,
    private hexSize: number,
    private outOfBoundsIndices: Set<number> = new Set()
  ) {
    super(scene, "platform");
    this.graphics = this.scene.add.graphics({ x, y });
    // Set depth to render behind other entities
    this.graphics.setDepth(-1);
    this.draw();
  }

  private draw() {
    const { h, w } = this.computeHexMetrics();

    for (let i = 0; i < this.width; i++) {
      const hexX = i * (w * 0.75);
      // stagger every other hex vertically so edges meet instead of tips overlapping
      const hexY = (i % 2 === 0) ? 0 : h / 2;
      
      const isOutOfBounds = this.outOfBoundsIndices.has(i);
      
      if (isOutOfBounds) {
        // Draw transparent hex with red border for out-of-bounds areas
        this.drawOutOfBoundsHex(hexX, hexY, h);
        // Add collision for out-of-bounds hex to bounce player back
        this.addOutOfBoundsCollision(hexX, hexY, h);
      } else {
        // Draw normal filled hex
        this.graphics.fillStyle(this.getColorForTerrain(this.terrain));
        this.drawHex(hexX, hexY, h);
        
        // create collision body for this hex (approximate with rectangle) if physics available
        this.addHexCollision(hexX, hexY, h);
      }

      // draw connector between this hex and the next one to fill the gap and create a flat surface
      if (i < this.width - 1) {
        const nextIsOutOfBounds = this.outOfBoundsIndices.has(i + 1);
        
        if (!isOutOfBounds && !nextIsOutOfBounds) {
          // Only draw connector if both hexes are normal (not out of bounds)
          this.graphics.fillStyle(this.getColorForTerrain(this.terrain));
          this.drawConnector(i, hexX, hexY, h);
          this.addConnectorCollision(i, hexX, hexY, h);
        }
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

  private drawOutOfBoundsHex(x: number, y: number, h: number) {
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
    
    // Draw transparent fill (no fill, just the outline)
    this.graphics.lineStyle(2, 0xff0000, 1); // Red border, 2px thick
    this.graphics.strokePoints(points, true);
    this.graphics.lineStyle(0, 0x000000, 0); // Reset line style
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
      case Terrain.OUT_OF_BOUNDS:
        return 0x000000; // This won't be used since out-of-bounds hexes are transparent
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

    // Use circle collision for better hex approximation
    const radius = Math.min(this.hexSize, h) * 0.4; // Smaller radius for better fit

    const circle = this.scene.add.circle(worldX, worldY, radius, 0x0000ff, 0)
      .setVisible(false);

    ph.add.existing(circle, true); // static
    
    // Store collision body for group access
    this.collisionBodies.push(circle);
  }

  private addOutOfBoundsCollision(hexX: number, hexY: number, h: number) {
    // Only add physics bodies if the arcade physics plugin exists on the scene
    const ph = (this.scene as any).physics;
    if (!ph || !ph.add) return;

    const worldX = (this.x ?? 0) + hexX;
    const worldY = (this.y ?? 0) + hexY;

    // Use circle collision for out-of-bounds hexes too
    const radius = Math.min(this.hexSize, h) * 0.45; // Slightly larger for better detection

    const circle = this.scene.add.circle(worldX, worldY, radius, 0xff0000, 0)
      .setVisible(false);

    ph.add.existing(circle, true); // static
    
    // Store out-of-bounds collision body separately
    this.outOfBoundsCollisionBodies.push(circle);
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

    // Use circle for connector as well for consistency
    const radius = Math.min(step, h) * 0.3;

    const circle = this.scene.add.circle(worldX, worldY, radius, 0x0000ff, 0)
      .setVisible(false);

    ph.add.existing(circle, true);
    
    // Store collision body for group access
    this.collisionBodies.push(circle);
  }
  
  destroy() {
    this.graphics.destroy();
    super.destroy();
  }
}
