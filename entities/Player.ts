import Phaser from "phaser";

export class Player extends Phaser.Physics.Arcade.Sprite {
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasdKeys!: { W: Phaser.Input.Keyboard.Key, A: Phaser.Input.Keyboard.Key, S: Phaser.Input.Keyboard.Key, D: Phaser.Input.Keyboard.Key };
  private spaceKey!: Phaser.Input.Keyboard.Key;
  private moveSpeed: number = 160;
  private jumpSpeed: number = 330;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, '');
    
    // Add to scene and enable physics
    scene.add.existing(this);
    scene.physics.add.existing(this);
    
    // Create a simple colored rectangle as the player sprite
    this.setDisplaySize(16, 24); // Player size
    this.setTint(0x00ff00); // Green color
    
    // Set physics properties
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setCollideWorldBounds(true);
    body.setSize(16, 24); // Collision box size
    body.setOffset(0, 0);
    body.setGravityY(800); // Add gravity
    
    // Create a simple rectangle texture for the player
    this.createPlayerTexture();
    
    // Set up keyboard input
    this.setupInput();
  }
  
  private createPlayerTexture() {
    const graphics = this.scene.add.graphics();
    graphics.fillStyle(0x00ff00);
    graphics.fillRect(0, 0, 16, 24);
    graphics.generateTexture('player', 16, 24);
    graphics.destroy();
    
    this.setTexture('player');
  }
  
  private setupInput() {
    // Set up cursor keys (arrow keys)
    this.cursors = this.scene.input.keyboard!.createCursorKeys();
    
    // Set up WASD keys
    this.wasdKeys = this.scene.input.keyboard!.addKeys('W,S,A,D') as any;
    
    // Set up space key for jumping
    this.spaceKey = this.scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
  }
  
  update() {
    const body = this.body as Phaser.Physics.Arcade.Body;
    
    // Left and right movement
    if (this.cursors.left.isDown || this.wasdKeys.A.isDown) {
      body.setVelocityX(-this.moveSpeed);
    } else if (this.cursors.right.isDown || this.wasdKeys.D.isDown) {
      body.setVelocityX(this.moveSpeed);
    } else {
      body.setVelocityX(0);
    }
    
    // Jumping - only if on ground
    if ((this.cursors.up.isDown || this.wasdKeys.W.isDown || this.spaceKey.isDown) && body.touching.down) {
      body.setVelocityY(-this.jumpSpeed);
    }
  }
}