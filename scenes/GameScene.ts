import Phaser from "phaser";
import { StonePlatform } from "../entities/StonePlatform";
import { DirtPlatform } from "../entities/DirtPlatform";
import { IcePlatform } from "../entities/IcePlatform";
import { MudPlatform } from "../entities/MudPlatform";
import { HexGrid } from "../engine/HexGrid";
import { Player } from "../entities/Player";
import { Terrain } from "../level/constants";

interface PlatformData {
  platform: any;
  y: number;
  level: number;
}

export default class GameScene extends Phaser.Scene {
  private hexGrid!: HexGrid;
  private player!: Player;
  private platforms!: Phaser.Physics.Arcade.StaticGroup;
  private generatedPlatforms: PlatformData[] = [];
  private currentLevel: number = 0;
  private platformSpacing: number = 140; // Optimized vertical distance for balanced jumping
  private hexSize: number = 32;
  private cameraFollowOffset: number = 150; // How far above player the camera follows
  private lastGeneratedY: number = 0;
  private score: number = 0;
  private scoreText!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: "Game" });
  }

  create() {
    // Debug: set background color so scene is visible
    this.cameras.main.setBackgroundColor(0x08141a);

    // Initialize grid system
    const canvasWidth = Number(this.scale.width);
    const canvasHeight = Number(this.scale.height);

    this.hexGrid = new HexGrid(this.hexSize, canvasWidth, canvasHeight);

    // Initialize physics groups
    this.platforms = this.physics.add.staticGroup();

    // Create background elements to highlight the climbing theme
    this.createBackground();

    // Create initial platforms
    this.generateInitialPlatforms();

    // Spawn player
    this.spawnPlayer();

    // Set up camera to follow player with smooth movement
    this.setupCamera();

    // Create UI
    this.createUI();

    console.log("Game scene initialized with separated ledge platforms");
  }

  update() {
    // Update player
    if (this.player) {
      this.player.update();

      // Update camera position to follow player
      this.updateCamera();

      // Generate new platforms as player climbs
      this.checkPlatformGeneration();

      // Clean up platforms that are too far below
      this.cleanupOldPlatforms();

      // Update score based on height
      this.updateScore();
    }
  }

  private generateInitialPlatforms() {
    const canvasHeight = Number(this.scale.height);

    // Generate ground platform (level 0)
    this.createPlatformAtLevel(0, canvasHeight - 60);

    // Generate initial platforms above ground with consistent spacing
    for (let level = 1; level <= 5; level++) {
      const spacing = this.platformSpacing + Phaser.Math.Between(-10, 10);
      const y = canvasHeight - 60 - level * spacing;
      this.createPlatformAtLevel(level, y);
    }

    this.lastGeneratedY = canvasHeight - 60 - 5 * this.platformSpacing;
  }

  private createPlatformAtLevel(level: number, y: number) {
    const canvasWidth = Number(this.scale.width);

    if (level === 0) {
      // Ground level should be a full platform for safety
      const config = this.getPlatformConfig(level);
      const platformStartX = (canvasWidth - config.totalWidth) / 2;
      const platform = this.createPlatform(
        config.terrain,
        platformStartX,
        y,
        config.width,
        config.outOfBoundsIndices
      );

      this.generatedPlatforms.push({
        platform,
        y,
        level,
      });
    } else {
      // Generate separated ledges for levels above ground
      const ledges = this.generateLedgeConfiguration(level, canvasWidth);

      ledges.forEach((ledgeConfig, index) => {
        const platform = this.createPlatform(
          ledgeConfig.terrain,
          ledgeConfig.x,
          y,
          ledgeConfig.width,
          ledgeConfig.outOfBoundsIndices
        );

        this.generatedPlatforms.push({
          platform,
          y,
          level: level + index * 0.1, // Slight offset to distinguish ledges
        });
      });
    }

    console.log(`Created level ${level} with separated ledges at y: ${y}`);
  }

  private getPlatformConfig(level: number) {
    // Platform gets progressively more challenging and varied
    const baseWidth = 20; // Reduced from 28 for more challenge
    const minWidth = 8; // Minimum platform width
    const maxWidth = 25; // Maximum platform width

    // Gradually reduce platform width as level increases
    let width = Math.max(minWidth, baseWidth - Math.floor(level / 3));
    width = Math.min(maxWidth, width);

    // Add some randomization
    if (level > 2) {
      width += Phaser.Math.Between(-2, 2);
      width = Math.max(minWidth, Math.min(maxWidth, width));
    }

    // Calculate spacing and total width
    const hexStep = this.hexSize * 0.75;
    const totalWidth = (width - 1) * hexStep + this.hexSize;

    // Determine terrain based on level and randomness
    let terrain = Terrain.STONE;
    if (level > 0) {
      const random = Math.random();
      if (level > 5 && random < 0.2) {
        terrain = Terrain.ICE; // Slippery platforms at higher levels
      } else if (level > 3 && random < 0.3) {
        terrain = Terrain.MUD; // Mud platforms that slow movement
      } else if (level > 1 && random < 0.4) {
        terrain = Terrain.DIRT; // Standard dirt platforms
      }
    }

    // No out-of-bounds hexes - use entire platform space
    const outOfBoundsIndices = new Set<number>();

    return {
      width,
      totalWidth,
      terrain,
      outOfBoundsIndices,
    };
  }

  private generateLedgeConfiguration(level: number, canvasWidth: number) {
    const ledges = [];
    const minLedgeWidth = 3; // Minimum hexes per ledge
    const maxLedgeWidth = 7; // Reduced max width for more challenge
    
    // More balanced gap configuration for ideal jumping
    let baseMinGap = 90; // Good minimum jumping distance
    let baseMaxGap = 160; // Reasonable maximum for skilled jumping
    
    // Progressive gap scaling based on level
    if (level > 5) {
      baseMinGap += 15; // Slightly harder
      baseMaxGap += 20;
    }
    if (level > 10) {
      baseMinGap += 15; // More challenging
      baseMaxGap += 25;
    }
    if (level > 15) {
      baseMinGap += 20; // Expert level
      baseMaxGap += 30;
    }

    // Determine number of ledges based on level
    let numLedges = 2;
    if (level > 3) numLedges = Phaser.Math.Between(2, 3);
    if (level > 8) numLedges = Phaser.Math.Between(2, 4);
    if (level > 15) numLedges = Phaser.Math.Between(1, 3); // Fewer but more challenging

    const hexStep = this.hexSize * 0.75;
    const totalUsableWidth = canvasWidth - 100; // Leave margins
    let currentX = 50; // Start with left margin

    // Sometimes start from different positions for variety
    if (level > 5 && Math.random() < 0.3) {
      currentX = Phaser.Math.Between(30, 80);
    }

    for (let i = 0; i < numLedges; i++) {
      // Determine ledge width
      let ledgeWidth = Phaser.Math.Between(minLedgeWidth, maxLedgeWidth);

      // Make ledges smaller at higher levels
      if (level > 5) {
        ledgeWidth = Math.max(minLedgeWidth, ledgeWidth - 1);
      }
      if (level > 10) {
        ledgeWidth = Math.max(minLedgeWidth, ledgeWidth - 1);
      }

      // Calculate ledge pixel width
      const ledgePixelWidth = (ledgeWidth - 1) * hexStep + this.hexSize;

      // Make sure we don't exceed canvas bounds
      if (currentX + ledgePixelWidth > totalUsableWidth) {
        break;
      }

      // Determine terrain for this ledge
      const terrain = this.getLedgeTerrain(level, i);

      // No out-of-bounds hexes - use entire platform space
      const outOfBoundsIndices = new Set<number>();

      ledges.push({
        x: currentX,
        width: ledgeWidth,
        terrain,
        outOfBoundsIndices,
      });

      // Calculate ideal gap for this specific jump
      let gap;
      if (i === 0) {
        // First gap should be easier to learn
        gap = Phaser.Math.Between(baseMinGap, baseMinGap + 30);
      } else if (i === numLedges - 1) {
        // Don't calculate gap for last ledge
        break;
      } else {
        // Progressive gap sizing with some variation
        const gapVariation = 25; // ±25px variation for interesting gameplay
        const midGap = (baseMinGap + baseMaxGap) / 2;
        gap = Phaser.Math.Between(midGap - gapVariation, midGap + gapVariation);
      }

      currentX += ledgePixelWidth + gap;
    }

    return ledges;
  }

  private getLedgeTerrain(level: number, ledgeIndex: number): Terrain {
    const random = Math.random();

    // First ledge is usually safer
    if (ledgeIndex === 0 && level < 5) {
      return Math.random() < 0.7 ? Terrain.STONE : Terrain.DIRT;
    }

    // Progressive difficulty
    if (level > 8 && random < 0.25) {
      return Terrain.ICE; // Slippery
    } else if (level > 5 && random < 0.3) {
      return Terrain.MUD; // Slow movement
    } else if (level > 2 && random < 0.4) {
      return Terrain.DIRT; // Standard
    }

    return Terrain.STONE; // Default safe option
  }

  private createBackground() {
    // Create a subtle mountain/cliff background pattern
    const graphics = this.add.graphics();
    graphics.setDepth(-100); // Behind everything

    const canvasWidth = Number(this.scale.width);
    const canvasHeight = Number(this.scale.height);

    // Create vertical guides to show the climbing path
    graphics.lineStyle(1, 0x2a3f5f, 0.3);
    for (let x = 100; x < canvasWidth - 100; x += 150) {
      graphics.moveTo(x, 0);
      graphics.lineTo(x, -10000); // Extend far up for infinite scrolling
    }

    // Add some decorative mountain outline
    graphics.lineStyle(2, 0x4a5f7f, 0.5);
    graphics.moveTo(0, canvasHeight - 40);
    graphics.lineTo(canvasWidth * 0.3, canvasHeight - 200);
    graphics.lineTo(canvasWidth * 0.7, canvasHeight - 150);
    graphics.lineTo(canvasWidth, canvasHeight - 100);

    graphics.stroke();
  }

  private createPlatform(
    terrain: Terrain,
    x: number,
    y: number,
    width: number,
    outOfBoundsIndices: Set<number>
  ) {
    let platform;

    switch (terrain) {
      case Terrain.DIRT:
        platform = new DirtPlatform(
          this,
          x,
          y,
          width,
          this.hexSize,
          outOfBoundsIndices
        );
        break;
      case Terrain.ICE:
        platform = new IcePlatform(
          this,
          x,
          y,
          width,
          this.hexSize,
          outOfBoundsIndices
        );
        break;
      case Terrain.MUD:
        platform = new MudPlatform(
          this,
          x,
          y,
          width,
          this.hexSize,
          outOfBoundsIndices
        );
        break;
      case Terrain.STONE:
      default:
        platform = new StonePlatform(
          this,
          x,
          y,
          width,
          this.hexSize,
          outOfBoundsIndices
        );
        break;
    }

    // Add collision bodies to physics groups
    platform.collisionBodies.forEach((body: Phaser.GameObjects.GameObject) => {
      this.platforms.add(body);
    });

    return platform;
  }

  private spawnPlayer() {
    const canvasWidth = Number(this.scale.width);
    const canvasHeight = Number(this.scale.height);

    // Spawn player above the ground platform
    const middleX = canvasWidth / 2;
    const playerY = canvasHeight - 60 - this.hexSize * 2;

    this.player = new Player(this, middleX, playerY);

    // Set up collisions
    this.physics.add.collider(this.player, this.platforms);

    console.log("Player spawned at:", middleX, playerY);
  }

  private setupCamera() {
    // Make camera follow player with offset
    this.cameras.main.startFollow(this.player, true, 0.05, 0.05);
    this.cameras.main.setFollowOffset(0, this.cameraFollowOffset);

    // Set world bounds for camera
    const worldHeight = 10000; // Large world height for infinite climbing
    this.physics.world.setBounds(
      0,
      -worldHeight,
      Number(this.scale.width),
      worldHeight + Number(this.scale.height)
    );

    // Set camera bounds
    this.cameras.main.setBounds(
      0,
      -worldHeight,
      Number(this.scale.width),
      worldHeight + Number(this.scale.height)
    );
  }

  private updateCamera() {
    // Ensure camera smoothly follows player upward movement
    const playerY = this.player.y;
    const cameraY = this.cameras.main.scrollY;

    // If player is climbing significantly, update camera more aggressively
    if (playerY < cameraY + this.cameraFollowOffset) {
      this.cameras.main.setLerp(0.02, 0.02);
    } else {
      this.cameras.main.setLerp(0.05, 0.05);
    }
  }

  private checkPlatformGeneration() {
    const playerY = this.player.y;
    const generationThreshold = this.lastGeneratedY + this.platformSpacing * 2;

    // Generate new platforms when player gets close to the highest platforms
    if (playerY < generationThreshold) {
      for (let i = 0; i < 3; i++) {
        const newLevel = this.currentLevel + 6 + i;
        // Reduced variation for more consistent jumping rhythm
        const spacing = this.platformSpacing + Phaser.Math.Between(-15, 15);
        const newY = this.lastGeneratedY - spacing;
        this.createPlatformAtLevel(newLevel, newY);
        this.lastGeneratedY = newY;
      }
      this.currentLevel += 3;
    }
  }

  private cleanupOldPlatforms() {
    const playerY = this.player.y;
    const cleanupThreshold = playerY + Number(this.scale.height) * 2;

    // Remove platforms that are far below the player
    this.generatedPlatforms = this.generatedPlatforms.filter((platformData) => {
      if (platformData.y > cleanupThreshold) {
        // Remove platform and its collision bodies
        platformData.platform.collisionBodies.forEach((body: any) => {
          this.platforms.remove(body);
          body.destroy();
        });

        platformData.platform.destroy();
        return false;
      }
      return true;
    });
  }

  private updateScore() {
    const canvasHeight = Number(this.scale.height);
    const groundY = canvasHeight - 60;
    const heightClimbed = Math.max(0, groundY - this.player.y);
    this.score = Math.floor(heightClimbed / 10);

    this.scoreText.setText(`Height: ${this.score}m`);
  }

  private createUI() {
    // Create score display
    this.scoreText = this.add
      .text(16, 16, "Height: 0m", {
        fontSize: "16px",
        color: "#ffffff",
        fontFamily: '"Press Start 2P", monospace',
      })
      .setScrollFactor(0)
      .setDepth(1000);

    // Add instructions with enhanced jumping tips
    this.add
      .text(
        16,
        Number(this.scale.height) - 80,
        "Arrow Keys/WASD: Move & Jump\nHold Jump longer = Higher & Farther!",
        {
          fontSize: "10px",
          color: "#cccccc",
          fontFamily: '"Press Start 2P", monospace',
          lineSpacing: 8,
        }
      )
      .setScrollFactor(0)
      .setDepth(1000);

    // Add ledge tip
    this.add
      .text(
        16,
        Number(this.scale.height) - 40,
        "Perfect your jumps between balanced ledges!",
        {
          fontSize: "9px",
          color: "#88ff88",
          fontFamily: '"Press Start 2P", monospace',
        }
      )
      .setScrollFactor(0)
      .setDepth(1000);
  }
}
