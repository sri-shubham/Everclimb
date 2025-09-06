import Phaser from "phaser";
import { HexGrid, HexOrientation, HexGridUtils, HexCoordinate, PixelCoordinate } from "../engine/Grid";

export class TitleScene extends Phaser.Scene {
    private hexGrid!: HexGrid;
    private graphics!: Phaser.GameObjects.Graphics;
    private animatedHexes: Phaser.GameObjects.Graphics[] = [];
    private hexSpawnTimer!: Phaser.Time.TimerEvent;

    constructor() {
        super({ key: 'TitleScene' });
    }

    create() {
        const { width, height } = this.sys.game.config;

        // Initialize hex grid system
        this.hexGrid = new HexGrid(28, HexOrientation.FLAT_TOP);
        
        // Create graphics object for drawing hexes
        this.graphics = this.add.graphics();

        // Draw hex grid background
        this.drawHexGridBackground();

        // Add semi-transparent overlay
        this.add.rectangle(Number(width)/2, Number(height)/2, Number(width), Number(height), 0x222222, 0.85);

        // Start the animated hex spawning system (after overlay so they appear on top)
        this.startHexAnimation();

        // Wait for the Press Start 2P font to be loaded before creating text
        this.loadFontAndCreateText(width, height);

        // Set up keyboard input to start the game
        this.input.keyboard?.on('keydown-SPACE', () => {
            this.scene.start('Game');
        });

        // Alternative input method for broader compatibility (click to start)
        this.input.on('pointerdown', () => {
            this.scene.start('Game');
        });
    }

    /**
     * Draw the hex grid background pattern
     */
    private drawHexGridBackground(): void {
        const { width, height } = this.sys.game.config;
        const gameWidth = Number(width);
        const gameHeight = Number(height);

        // Set drawing style for hex grid
        this.graphics.lineStyle(1, 0xffffff, 0.8);

        // Calculate visible area with some padding
        const padding = this.hexGrid.getSize() * 2;
        const topLeft: PixelCoordinate = { x: -padding, y: -padding };
        const bottomRight: PixelCoordinate = { x: gameWidth + padding, y: gameHeight + padding };

        // Get visible hexes using the new grid system
        const visibleHexes = HexGridUtils.getVisibleHexes(topLeft, bottomRight, this.hexGrid);

        // Draw each hex
        visibleHexes.forEach(hex => {
            this.drawHex(hex);
        });
    }

    /**
     * Draw a single hexagon
     */
    private drawHex(hex: HexCoordinate): void {
        const corners = this.hexGrid.getHexCorners(hex);
        
        // Start drawing the hex shape
        this.graphics.beginPath();
        this.graphics.moveTo(corners[0].x, corners[0].y);
        
        for (let i = 1; i < corners.length; i++) {
            this.graphics.lineTo(corners[i].x, corners[i].y);
        }
        
        this.graphics.closePath();
        this.graphics.strokePath();
    }

    /**
     * Load the Press Start 2P font and create text elements
     */
    private async loadFontAndCreateText(width: string | number, height: string | number): Promise<void> {
        try {
            // Load the Press Start 2P font with multiple sizes to ensure it's fully loaded
            await Promise.all([
                document.fonts.load('12px "Press Start 2P"'),
                document.fonts.load('14px "Press Start 2P"'),
                document.fonts.load('32px "Press Start 2P"')
            ]);

            // Font loaded successfully, create text with Press Start 2P
            this.createTextElements(width, height, '"Press Start 2P", monospace');
            
        } catch (error) {
            console.warn('Press Start 2P font failed to load, using fallback font');
            // Fallback to monospace if Press Start 2P fails to load
            this.createTextElements(width, height, 'monospace');
        }
    }

    /**
     * Create text elements with the specified font
     */
    private createTextElements(width: string | number, height: string | number, fontFamily: string): void {
        const centerX = Number(width) / 2;
        const centerY = Number(height) / 2;

        // Main title
        this.add.text(centerX, centerY - 60, 'Everclimb', { 
            fontSize: '32px', 
            color: '#fff', 
            fontFamily: fontFamily
        }).setOrigin(0.5);
        
        // Instructions
        this.add.text(centerX, centerY + 10, 'Arrow Keys: Jump between platforms\nCollect Food (F) for stamina\nCollect Boots (B) to avoid slipping on ice\nCollect Coins ($) for score\n\nJump up to 3 hexes high & 4 hexes across!', { 
            fontSize: '10px', 
            color: '#ccc', 
            fontFamily: fontFamily, 
            align: 'center',
            fontStyle: 'normal'
        }).setOrigin(0.5);
        
        // Start prompt
        this.add.text(centerX, centerY + 80, 'Press SPACE to Start', { 
            fontSize: '12px', 
            color: '#aaa', 
            fontFamily: fontFamily
        }).setOrigin(0.5);
    }

    /**
     * Start the continuous hex appearing/disappearing animation
     */
    private startHexAnimation(): void {
        const { width, height } = this.sys.game.config;
        const gameWidth = Number(width);
        const gameHeight = Number(height);

        // Create timer that spawns new hexes periodically
        this.hexSpawnTimer = this.time.addEvent({
            delay: 200, // spawn a new hex every 200ms (faster)
            callback: () => {
                this.spawnAnimatedHex(gameWidth, gameHeight);
            },
            loop: true
        });

        // Initial spawn of more hexes
        for (let i = 0; i < 8; i++) {
            this.time.delayedCall(i * 50, () => {
                this.spawnAnimatedHex(gameWidth, gameHeight);
            });
        }
    }

    /**
     * Spawn a single animated hex that appears and disappears
     */
    private spawnAnimatedHex(gameWidth: number, gameHeight: number): void {
        // Get a random hex coordinate within the visible area
        const padding = this.hexGrid.getSize() * 3;
        const randomX = Phaser.Math.Between(-padding, gameWidth + padding);
        const randomY = Phaser.Math.Between(-padding, gameHeight + padding);
        
        const randomHex = this.hexGrid.pixelToHex({ x: randomX, y: randomY });
        const hexCenter = this.hexGrid.hexToPixel(randomHex);
        
        // Skip if too close to screen center (where text is)
        const centerX = gameWidth / 2;
        const centerY = gameHeight / 2;
        const distanceFromCenter = Math.sqrt(
            Math.pow(hexCenter.x - centerX, 2) + Math.pow(hexCenter.y - centerY, 2)
        );
        
        if (distanceFromCenter < 100) { // Reduced from 150 to 100
            return; // Skip this hex to avoid overlap with text
        }

        // Create graphics object for this hex
        const hexGraphics = this.add.graphics();
        hexGraphics.setDepth(10); // Ensure it appears above everything else
        
        // Choose random color from a palette
        const colors = [0x44ff44, 0x4444ff, 0xff4444, 0xffff44, 0xff44ff, 0x44ffff];
        const color = colors[Math.floor(Math.random() * colors.length)];
        
        hexGraphics.lineStyle(3, color, 0.8); // Thicker, more visible line
        hexGraphics.fillStyle(color, 0.3); // More visible fill
        
        // Draw the hex
        const corners = this.hexGrid.getHexCorners(randomHex);
        hexGraphics.beginPath();
        hexGraphics.moveTo(corners[0].x, corners[0].y);
        
        for (let i = 1; i < corners.length; i++) {
            hexGraphics.lineTo(corners[i].x, corners[i].y);
        }
        
        hexGraphics.closePath();
        hexGraphics.fillPath();
        hexGraphics.strokePath();

        // Add to tracking array
        this.animatedHexes.push(hexGraphics);

        // Animate the hex appearing
        hexGraphics.setScale(0);
        hexGraphics.setAlpha(0);
        
        const appearDuration = Phaser.Math.Between(800, 1200);
        const holdDuration = Phaser.Math.Between(1500, 3000);
        const disappearDuration = Phaser.Math.Between(600, 1000);
        
        // Appear animation
        this.tweens.add({
            targets: hexGraphics,
            scaleX: 1,
            scaleY: 1,
            alpha: 0.9, // Higher alpha for better visibility
            duration: appearDuration,
            ease: 'Back.easeOut',
            onComplete: () => {
                // Hold animation (subtle pulsing)
                this.tweens.add({
                    targets: hexGraphics,
                    alpha: { from: 0.9, to: 1.0 }, // Higher alpha range
                    scaleX: { from: 1, to: 1.2 },
                    scaleY: { from: 1, to: 1.2 },
                    duration: holdDuration,
                    yoyo: true,
                    ease: 'Sine.easeInOut',
                    onComplete: () => {
                        // Disappear animation
                        this.tweens.add({
                            targets: hexGraphics,
                            scaleX: 0,
                            scaleY: 0,
                            alpha: 0,
                            duration: disappearDuration,
                            ease: 'Back.easeIn',
                            onComplete: () => {
                                // Remove from tracking array and destroy
                                const index = this.animatedHexes.indexOf(hexGraphics);
                                if (index > -1) {
                                    this.animatedHexes.splice(index, 1);
                                }
                                hexGraphics.destroy();
                            }
                        });
                    }
                });
            }
        });

        // Limit the number of active animated hexes
        if (this.animatedHexes.length > 15) {
            const oldestHex = this.animatedHexes.shift();
            if (oldestHex) {
                // Force fade out the oldest hex
                this.tweens.add({
                    targets: oldestHex,
                    alpha: 0,
                    scaleX: 0,
                    scaleY: 0,
                    duration: 500,
                    onComplete: () => {
                        oldestHex.destroy();
                    }
                });
            }
        }
    }

    /**
     * Clean up animations when scene is shutdown
     */
    shutdown(): void {
        if (this.hexSpawnTimer) {
            this.hexSpawnTimer.destroy();
        }
        
        this.animatedHexes.forEach(hex => {
            if (hex && hex.active) {
                hex.destroy();
            }
        });
        
        this.animatedHexes = [];
    }
}

