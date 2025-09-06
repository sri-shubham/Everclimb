import Phaser from "phaser";
import { Terrain } from "../level/constants";

export interface GridPosition {
  col: number;
  row: number;
}

export class HexGrid {
  private hexSize: number;
  private canvasWidth: number;
  private canvasHeight: number;
  private cols: number;
  private rows: number;
  private hexWidth: number;
  private hexHeight: number;
  private horizontalStep: number;
  private verticalStep: number;

  constructor(hexSize: number, canvasWidth: number, canvasHeight: number) {
    this.hexSize = hexSize;
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    
    // Hex geometry calculations
    this.hexWidth = hexSize;
    this.hexHeight = (Math.sqrt(3) * hexSize) / 2;
    this.horizontalStep = hexSize * 0.75;
    this.verticalStep = this.hexHeight;
    
    // Calculate grid dimensions - keep it simple
    this.cols = Math.ceil(canvasWidth / this.horizontalStep) + 4; // Extra columns for out-of-bounds
    this.rows = Math.ceil(canvasHeight / this.verticalStep) + 2; // Extra rows for coverage
  }

  // Convert grid position to world coordinates
  gridToWorld(col: number, row: number): { x: number, y: number } {
    const x = col * this.horizontalStep; // Remove the negative offset
    const y = row * this.verticalStep;
    
    // Stagger every other column vertically for proper hex tessellation
    const staggerOffset = (col % 2 === 1) ? this.hexHeight / 2 : 0;
    
    return { x, y: y + staggerOffset };
  }

  // Get grid dimensions
  getGridSize(): { cols: number, rows: number } {
    return { cols: this.cols, rows: this.rows };
  }

  // Check if a grid position is out of bounds (outside visible canvas)
  isOutOfBounds(col: number, row: number): boolean {
    const { x, y } = this.gridToWorld(col, row);
    
    // Check if hex center is outside visible area with some tolerance
    const tolerance = this.hexWidth / 2;
    return x < -tolerance || x > this.canvasWidth + tolerance || y < -tolerance || y > this.canvasHeight + tolerance;
  }

  // Get bottom row positions for the ground platform
  getBottomRowPositions(): GridPosition[] {
    const positions: GridPosition[] = [];
    
    // Find the row that's closest to the bottom of the canvas
    let bottomRow = 0;
    for (let row = 0; row < this.rows; row++) {
      const { y } = this.gridToWorld(0, row);
      if (y <= this.canvasHeight - this.hexHeight / 2 && y >= this.canvasHeight - this.hexHeight * 1.5) {
        bottomRow = row;
        break;
      }
    }
    
    // Add all columns for this row
    for (let col = 0; col < this.cols; col++) {
      positions.push({ col, row: bottomRow });
    }
    
    return positions;
  }

  // Get left and right edge positions for out-of-bounds
  getEdgeOutOfBoundsPositions(): GridPosition[] {
    const positions: GridPosition[] = [];
    
    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        const { x, y } = this.gridToWorld(col, row);
        
        // Check if this hex is on the left or right edge (outside visible canvas)
        if ((x < 0 || x > this.canvasWidth) && y >= 0 && y <= this.canvasHeight + this.hexHeight) {
          positions.push({ col, row });
        }
      }
    }
    
    return positions;
  }
}
