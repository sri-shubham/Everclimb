import Phaser from "phaser";
import { StonePlatform } from "../entities/StonePlatform";
import { OutOfBoundsPlatform } from "../entities/OutOfBoundsPlatform";
import { HexGrid } from "../engine/HexGrid";
import { Player } from "../entities/Player";


export default class GameScene extends Phaser.Scene {
  private hexGrid!: HexGrid;
  private player!: Player;
  private platforms!: Phaser.Physics.Arcade.StaticGroup;
  private outOfBoundsPlatforms!: Phaser.Physics.Arcade.StaticGroup;
  private mainPlatform!: StonePlatform;

  constructor() {
    super({ key: "Game" });
  }

  create() {
    // Debug: set background color so scene is visible
    this.cameras.main.setBackgroundColor(0x08141a);
    this.add.text(8, 8, 'Game Scene', { fontSize: '14px', color: '#ffffff' }).setDepth(1000);

    // Initialize grid system
    const hexSize = 32;
    const canvasWidth = Number(this.scale.width);
    const canvasHeight = Number(this.scale.height);
    
    this.hexGrid = new HexGrid(hexSize, canvasWidth, canvasHeight);
    
    // Initialize physics group for platforms
    this.platforms = this.physics.add.staticGroup();
    this.outOfBoundsPlatforms = this.physics.add.staticGroup();
    
    console.log('Grid created:', this.hexGrid.getGridSize());
    console.log('Canvas size:', canvasWidth, 'x', canvasHeight);
    
    // Create the bottom platform
    const platformData = this.createBottomPlatform(hexSize);
    
    // Create out-of-bounds areas
    this.createOutOfBoundsAreas(hexSize);
    
    // Spawn player in the middle of the platform
    this.spawnPlayer(platformData, hexSize);
  }

  update() {
    // Update player
    if (this.player) {
      this.player.update();
    }
  }

  private createBottomPlatform(hexSize: number) {
    const canvasWidth = Number(this.scale.width);
    const canvasHeight = Number(this.scale.height);
    
    // Set platform to exactly 28 hexagons wide
    const platformWidth = 28;
    
    // Calculate starting position to center the platform
    const hexStep = hexSize * 0.75;
    const totalPlatformWidth = (platformWidth - 1) * hexStep + hexSize;
    const startX = (canvasWidth - totalPlatformWidth) / 2;
    const y = canvasHeight - (Math.sqrt(3) * hexSize) / 4;
    
    // Mark first 2 and last 2 hexes as out-of-bounds
    const outOfBoundsIndices = new Set<number>();
    outOfBoundsIndices.add(0); // First hex
    outOfBoundsIndices.add(1); // Second hex
    outOfBoundsIndices.add(platformWidth - 1); // Last hex
    
    console.log('Creating 28-hex platform at:', startX, y);
    console.log('Out of bounds indices:', Array.from(outOfBoundsIndices));
    
    this.mainPlatform = new StonePlatform(this, startX, y, platformWidth, hexSize, outOfBoundsIndices);
    
    // Return platform data for player spawning
    return {
      startX,
      y,
      width: platformWidth,
      hexStep,
      totalWidth: totalPlatformWidth,
      platform: this.mainPlatform
    };
  }

  private createOutOfBoundsAreas(hexSize: number) {
    const canvasWidth = Number(this.scale.width);
    const canvasHeight = Number(this.scale.height);
    const hexHeight = (Math.sqrt(3) * hexSize) / 2;
    
    // Calculate platform boundaries for positioning out-of-bounds areas
    const platformWidth = 28;
    const hexStep = hexSize * 0.75;
    const totalPlatformWidth = (platformWidth - 1) * hexStep + hexSize;
    const platformStartX = (canvasWidth - totalPlatformWidth) / 2;
    
    // Calculate vertical spacing and number of rows needed
    const verticalRows = Math.ceil(canvasHeight / hexHeight) + 1;
    
    // Create left column of out-of-bounds hexagons (just outside the platform's left edge)
    const leftX = platformStartX - hexStep;
    for (let row = 0; row < verticalRows; row++) {
      const y = row * hexHeight;
      if (y < canvasHeight + hexHeight) {
        new OutOfBoundsPlatform(this, leftX, y, 1, hexSize);
      }
    }
    
    // Create right column of out-of-bounds hexagons (just outside the platform's right edge)
    const rightX = platformStartX + totalPlatformWidth + hexStep * 0.25;
    for (let row = 0; row < verticalRows; row++) {
      const y = row * hexHeight;
      if (y < canvasHeight + hexHeight) {
        new OutOfBoundsPlatform(this, rightX, y, 1, hexSize);
      }
    }
    
    console.log('Created out-of-bounds columns at:', leftX, 'and', rightX);
    console.log('Platform spans from', platformStartX, 'to', platformStartX + totalPlatformWidth);
  }
  
  private handleOutOfBoundsCollision(player: any, outOfBoundsBody: any) {
    // Get player body for velocity manipulation
    const playerBody = player.body as Phaser.Physics.Arcade.Body;
    
    // Calculate bounce direction based on collision position
    const playerCenterX = player.x;
    const outOfBoundsCenterX = outOfBoundsBody.x;
    
    // Determine if player hit from left or right side
    const bounceDirection = playerCenterX < outOfBoundsCenterX ? -1 : 1;
    
    // Apply bounce force
    const bounceForce = 200;
    playerBody.setVelocityX(bounceDirection * bounceForce);
    
    // Optional: Add slight upward bounce
    if (playerBody.velocity.y > -50) { // Only if not already jumping high
      playerBody.setVelocityY(-100);
    }
    
    console.log('Player bounced by out-of-bounds collision!');
  }
  
  private spawnPlayer(platformData: any, hexSize: number) {
    // Calculate the middle of the platform
    const middleX = platformData.startX + platformData.totalWidth / 2;
    const playerY = platformData.y - hexSize; // Spawn above the platform
    
    // Create the player
    this.player = new Player(this, middleX, playerY);
    
    // Set up collision between player and world bounds
    this.physics.world.setBounds(0, 0, Number(this.scale.width), Number(this.scale.height));
    
    // Add collision bodies to physics group and set up collision with player
    platformData.platform.collisionBodies.forEach((body: Phaser.GameObjects.GameObject) => {
      this.platforms.add(body);
    });
    
    // Add out-of-bounds collision bodies to separate group
    platformData.platform.outOfBoundsCollisionBodies.forEach((body: Phaser.GameObjects.GameObject) => {
      this.outOfBoundsPlatforms.add(body);
    });
    
    // Set up collision between player and platform collision bodies
    this.physics.add.collider(this.player, this.platforms);
    
    // Set up collision between player and out-of-bounds areas with bounce effect
    this.physics.add.collider(this.player, this.outOfBoundsPlatforms, this.handleOutOfBoundsCollision, undefined, this);
    
    console.log('Player spawned at:', middleX, playerY);
    console.log('Platform collision bodies:', platformData.platform.collisionBodies.length);
    console.log('Out-of-bounds collision bodies:', platformData.platform.outOfBoundsCollisionBodies.length);
  }
}

