/**
 * Hex Grid System for Everclimb
 * 
 * This module provides comprehensive hex grid functionality including:
 * - Coordinate conversions (hex <-> pixel)
 * - Grid calculations and utilities
 * - Rendering helpers
 * - Neighbor calculations
 * - Path finding utilities
 */

export enum HexOrientation {
    POINTY_TOP = 'pointy',
    FLAT_TOP = 'flat'
}

export interface HexCoordinate {
    q: number; // column
    r: number; // row
    s: number; // diagonal (q + r + s = 0)
}

export interface PixelCoordinate {
    x: number;
    y: number;
}

export interface HexMetrics {
    size: number;
    width: number;
    height: number;
    orientation: HexOrientation;
}

export class HexGrid {
    private size: number;
    private orientation: HexOrientation;
    private metrics: HexMetrics;

    constructor(size: number = 32, orientation: HexOrientation = HexOrientation.POINTY_TOP) {
        this.size = size;
        this.orientation = orientation;
        this.metrics = this.calculateMetrics();
    }

    /**
     * Calculate hex grid metrics based on size and orientation
     */
    private calculateMetrics(): HexMetrics {
        const size = this.size;
        
        if (this.orientation === HexOrientation.POINTY_TOP) {
            return {
                size,
                width: Math.sqrt(3) * size,
                height: 2 * size,
                orientation: this.orientation
            };
        } else {
            return {
                size,
                width: 2 * size,
                height: Math.sqrt(3) * size,
                orientation: this.orientation
            };
        }
    }

    /**
     * Create a hex coordinate
     */
    public createHexCoordinate(q: number, r: number): HexCoordinate {
        return {
            q,
            r,
            s: -q - r
        };
    }

    /**
     * Convert hex coordinates to pixel coordinates
     */
    public hexToPixel(hex: HexCoordinate): PixelCoordinate {
        if (this.orientation === HexOrientation.POINTY_TOP) {
            const x = this.size * (Math.sqrt(3) * hex.q + Math.sqrt(3) / 2 * hex.r);
            const y = this.size * (3 / 2 * hex.r);
            return { x, y };
        } else {
            const x = this.size * (3 / 2 * hex.q);
            const y = this.size * (Math.sqrt(3) / 2 * hex.q + Math.sqrt(3) * hex.r);
            return { x, y };
        }
    }

    /**
     * Convert pixel coordinates to hex coordinates
     */
    public pixelToHex(pixel: PixelCoordinate): HexCoordinate {
        if (this.orientation === HexOrientation.POINTY_TOP) {
            const q = (Math.sqrt(3) / 3 * pixel.x - 1 / 3 * pixel.y) / this.size;
            const r = (2 / 3 * pixel.y) / this.size;
            return this.roundHex({ q, r, s: -q - r });
        } else {
            const q = (2 / 3 * pixel.x) / this.size;
            const r = (-1 / 3 * pixel.x + Math.sqrt(3) / 3 * pixel.y) / this.size;
            return this.roundHex({ q, r, s: -q - r });
        }
    }

    /**
     * Round fractional hex coordinates to the nearest valid hex coordinate
     */
    private roundHex(hex: HexCoordinate): HexCoordinate {
        let rq = Math.round(hex.q);
        let rr = Math.round(hex.r);
        let rs = Math.round(hex.s);

        const qDiff = Math.abs(rq - hex.q);
        const rDiff = Math.abs(rr - hex.r);
        const sDiff = Math.abs(rs - hex.s);

        if (qDiff > rDiff && qDiff > sDiff) {
            rq = -rr - rs;
        } else if (rDiff > sDiff) {
            rr = -rq - rs;
        } else {
            rs = -rq - rr;
        }

        return { q: rq, r: rr, s: rs };
    }

    /**
     * Calculate distance between two hex coordinates
     */
    public hexDistance(a: HexCoordinate, b: HexCoordinate): number {
        return Math.max(
            Math.abs(a.q - b.q),
            Math.abs(a.r - b.r),
            Math.abs(a.s - b.s)
        );
    }

    /**
     * Get all 6 neighbors of a hex coordinate
     */
    public getNeighbors(hex: HexCoordinate): HexCoordinate[] {
        const directions = [
            { q: 1, r: 0, s: -1 },  // East
            { q: 1, r: -1, s: 0 },  // Northeast
            { q: 0, r: -1, s: 1 },  // Northwest
            { q: -1, r: 0, s: 1 },  // West
            { q: -1, r: 1, s: 0 },  // Southwest
            { q: 0, r: 1, s: -1 }   // Southeast
        ];

        return directions.map(dir => ({
            q: hex.q + dir.q,
            r: hex.r + dir.r,
            s: hex.s + dir.s
        }));
    }

    /**
     * Get neighbor in specific direction (0-5)
     */
    public getNeighbor(hex: HexCoordinate, direction: number): HexCoordinate {
        const directions = [
            { q: 1, r: 0, s: -1 },  // 0: East
            { q: 1, r: -1, s: 0 },  // 1: Northeast
            { q: 0, r: -1, s: 1 },  // 2: Northwest
            { q: -1, r: 0, s: 1 },  // 3: West
            { q: -1, r: 1, s: 0 },  // 4: Southwest
            { q: 0, r: 1, s: -1 }   // 5: Southeast
        ];

        const dir = directions[direction % 6];
        return {
            q: hex.q + dir.q,
            r: hex.r + dir.r,
            s: hex.s + dir.s
        };
    }

    /**
     * Get all hexes within a certain range
     */
    public getHexesInRange(center: HexCoordinate, range: number): HexCoordinate[] {
        const results: HexCoordinate[] = [];
        
        for (let q = -range; q <= range; q++) {
            const r1 = Math.max(-range, -q - range);
            const r2 = Math.min(range, -q + range);
            
            for (let r = r1; r <= r2; r++) {
                results.push({
                    q: center.q + q,
                    r: center.r + r,
                    s: center.s - q - r
                });
            }
        }
        
        return results;
    }

    /**
     * Get hexes in a ring at specific distance
     */
    public getHexRing(center: HexCoordinate, radius: number): HexCoordinate[] {
        if (radius === 0) return [center];
        
        const results: HexCoordinate[] = [];
        let hex = this.getNeighbor(center, 4); // Start from southwest
        
        // Move to the starting position
        for (let i = 0; i < radius; i++) {
            hex = this.getNeighbor(hex, 4);
        }
        
        // Walk around the ring
        for (let direction = 0; direction < 6; direction++) {
            for (let step = 0; step < radius; step++) {
                results.push({ ...hex });
                hex = this.getNeighbor(hex, direction);
            }
        }
        
        return results;
    }

    /**
     * Linear interpolation between two hex coordinates
     */
    public hexLerp(a: HexCoordinate, b: HexCoordinate, t: number): HexCoordinate {
        return {
            q: a.q * (1 - t) + b.q * t,
            r: a.r * (1 - t) + b.r * t,
            s: a.s * (1 - t) + b.s * t
        };
    }

    /**
     * Get line of hexes between two coordinates
     */
    public getHexLine(a: HexCoordinate, b: HexCoordinate): HexCoordinate[] {
        const distance = this.hexDistance(a, b);
        const results: HexCoordinate[] = [];
        
        for (let i = 0; i <= distance; i++) {
            const t = i / distance;
            results.push(this.roundHex(this.hexLerp(a, b, t)));
        }
        
        return results;
    }

    /**
     * Get the corner coordinates of a hex in pixel space
     */
    public getHexCorners(hex: HexCoordinate): PixelCoordinate[] {
        const center = this.hexToPixel(hex);
        const corners: PixelCoordinate[] = [];
        
        for (let i = 0; i < 6; i++) {
            const angle = (this.orientation === HexOrientation.POINTY_TOP ? 60 * i - 30 : 60 * i) * Math.PI / 180;
            corners.push({
                x: center.x + this.size * Math.cos(angle),
                y: center.y + this.size * Math.sin(angle)
            });
        }
        
        return corners;
    }

    /**
     * Check if two hex coordinates are equal
     */
    public hexEquals(a: HexCoordinate, b: HexCoordinate): boolean {
        return a.q === b.q && a.r === b.r && a.s === b.s;
    }

    /**
     * Convert hex coordinate to string for use as map key
     */
    public hexToString(hex: HexCoordinate): string {
        return `${hex.q},${hex.r}`;
    }

    /**
     * Convert string back to hex coordinate
     */
    public stringToHex(str: string): HexCoordinate {
        const [q, r] = str.split(',').map(Number);
        return this.createHexCoordinate(q, r);
    }

    /**
     * Rotate hex coordinate around origin
     */
    public rotateHex(hex: HexCoordinate, steps: number): HexCoordinate {
        // Normalize steps to 0-5 range
        steps = ((steps % 6) + 6) % 6;
        
        let { q, r, s } = hex;
        
        for (let i = 0; i < steps; i++) {
            [q, r, s] = [-r, -s, -q];
        }
        
        return { q, r, s };
    }

    /**
     * Get grid metrics
     */
    public getMetrics(): HexMetrics {
        return { ...this.metrics };
    }

    /**
     * Update grid size
     */
    public setSize(size: number): void {
        this.size = size;
        this.metrics = this.calculateMetrics();
    }

    /**
     * Get current size
     */
    public getSize(): number {
        return this.size;
    }

    /**
     * Set orientation
     */
    public setOrientation(orientation: HexOrientation): void {
        this.orientation = orientation;
        this.metrics = this.calculateMetrics();
    }

    /**
     * Get current orientation
     */
    public getOrientation(): HexOrientation {
        return this.orientation;
    }
}

/**
 * Utility functions for hex grid operations
 */
export class HexGridUtils {
    /**
     * Create a hexagonal map pattern
     */
    static createHexagonalMap(radius: number, grid: HexGrid): HexCoordinate[] {
        const center = grid.createHexCoordinate(0, 0);
        return grid.getHexesInRange(center, radius);
    }

    /**
     * Create a rectangular map pattern
     */
    static createRectangularMap(width: number, height: number, grid: HexGrid): HexCoordinate[] {
        const hexes: HexCoordinate[] = [];
        
        for (let r = 0; r < height; r++) {
            const offset = Math.floor(r / 2);
            for (let q = -offset; q < width - offset; q++) {
                hexes.push(grid.createHexCoordinate(q, r));
            }
        }
        
        return hexes;
    }

    /**
     * Create a triangular map pattern
     */
    static createTriangularMap(size: number, grid: HexGrid): HexCoordinate[] {
        const hexes: HexCoordinate[] = [];
        
        for (let q = 0; q <= size; q++) {
            for (let r = 0; r <= size - q; r++) {
                hexes.push(grid.createHexCoordinate(q, r));
            }
        }
        
        return hexes;
    }

    /**
     * Get hexes visible in a rectangular viewport
     */
    static getVisibleHexes(
        topLeft: PixelCoordinate,
        bottomRight: PixelCoordinate,
        grid: HexGrid
    ): HexCoordinate[] {
        const tlHex = grid.pixelToHex(topLeft);
        const brHex = grid.pixelToHex(bottomRight);
        
        const hexes: HexCoordinate[] = [];
        const minQ = Math.min(tlHex.q, brHex.q) - 1;
        const maxQ = Math.max(tlHex.q, brHex.q) + 1;
        const minR = Math.min(tlHex.r, brHex.r) - 1;
        const maxR = Math.max(tlHex.r, brHex.r) + 1;
        
        for (let q = minQ; q <= maxQ; q++) {
            for (let r = minR; r <= maxR; r++) {
                const hex = grid.createHexCoordinate(q, r);
                const pixel = grid.hexToPixel(hex);
                
                if (pixel.x >= topLeft.x - grid.getSize() && 
                    pixel.x <= bottomRight.x + grid.getSize() &&
                    pixel.y >= topLeft.y - grid.getSize() && 
                    pixel.y <= bottomRight.y + grid.getSize()) {
                    hexes.push(hex);
                }
            }
        }
        
        return hexes;
    }
}

// Export default instance for convenience
export const defaultHexGrid = new HexGrid();

/**
 * Legacy utility functions for backward compatibility
 */

/**
 * Calculate array index from hex coordinates
 */
export function idx(q: number, r: number, cols: number): number {
    return r * cols + q;
}

/**
 * Convert axial coordinates to pixel coordinates (legacy function)
 */
export function axialToPixel(q: number, r: number, hexSize: number): { x: number, y: number } {
    const grid = new HexGrid(hexSize, HexOrientation.FLAT_TOP);
    const hex = grid.createHexCoordinate(q, r);
    const pixel = grid.hexToPixel(hex);
    return { x: pixel.x, y: pixel.y };
}

/**
 * Compute grid layout parameters (legacy function)
 */
export function computeGrid(hexSize: number, width?: number, height?: number): { 
    cols: number, 
    rows: number, 
    hStep: number, 
    vStep: number 
} {
    const grid = new HexGrid(hexSize, HexOrientation.FLAT_TOP);
    const metrics = grid.getMetrics();
    
    // Calculate steps between hexes for flat-top orientation
    const hStep = metrics.width * 0.75; // horizontal step for flat-top
    const vStep = metrics.height * 0.5;  // vertical step for flat-top
    
    if (width !== undefined && height !== undefined) {
        // Calculate how many hexes fit in the given dimensions
        const cols = Math.ceil(width / hStep) + 1;
        const rows = Math.ceil(height / vStep) + 1;
        return { cols, rows, hStep, vStep };
    }
    
    // Default grid size if no dimensions provided
    return { 
        cols: 20, 
        rows: 15, 
        hStep, 
        vStep 
    };
}