import Phaser from "phaser";

export class Player extends Phaser.Physics.Arcade.Sprite {
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasdKeys!: {
    W: Phaser.Input.Keyboard.Key;
    A: Phaser.Input.Keyboard.Key;
    S: Phaser.Input.Keyboard.Key;
    D: Phaser.Input.Keyboard.Key;
  };
  private spaceKey!: Phaser.Input.Keyboard.Key;
  private moveSpeed: number = 250; // Increased for better ledge traversal
  private jumpSpeed: number = 600; // Significantly increased for long jumps
  private maxJumpTime: number = 400; // Longer variable jump for height
  private jumpTime: number = 0;
  private isJumping: boolean = false;
  private coyoteTime: number = 200; // Even longer grace period for ledge jumping
  private lastGroundTime: number = 0;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, "");

    // Add to scene and enable physics
    scene.add.existing(this);
    scene.physics.add.existing(this);

    // Create a simple colored rectangle as the player sprite
    this.setDisplaySize(24, 32); // Slightly taller for better visibility
    this.setTint(0x00ff00); // Green color

    // Set physics properties
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setCollideWorldBounds(true);
    body.setSize(20, 28); // Collision box size
    body.setOffset(2, 4);
    body.setGravityY(700); // Reduced gravity for longer jumps
    body.setMaxVelocity(300, 700); // Higher max velocities for long jumps
    body.setDragX(300); // Reduced air resistance for better momentum

    // Create a simple rectangle texture for the player
    this.createPlayerTexture();

    // Set up keyboard input
    this.setupInput();
  }

  private createPlayerTexture() {
    const graphics = this.scene.add.graphics();

    // Create a more detailed player sprite
    graphics.fillStyle(0x00ff00); // Green body
    graphics.fillRect(0, 0, 20, 28);

    // Add simple face
    graphics.fillStyle(0x000000); // Black for eyes
    graphics.fillRect(6, 6, 2, 2);
    graphics.fillRect(12, 6, 2, 2);

    graphics.generateTexture("player", 20, 28);
    graphics.destroy();

    this.setTexture("player");
  }

  private setupInput() {
    // Set up cursor keys (arrow keys)
    this.cursors = this.scene.input.keyboard!.createCursorKeys();

    // Set up WASD keys
    this.wasdKeys = this.scene.input.keyboard!.addKeys("W,S,A,D") as any;

    // Set up space key for jumping
    this.spaceKey = this.scene.input.keyboard!.addKey(
      Phaser.Input.Keyboard.KeyCodes.SPACE
    );
  }

  update() {
    const body = this.body as Phaser.Physics.Arcade.Body;
    const isOnGround = body.touching.down || body.blocked.down;

    // Update ground time for coyote time
    if (isOnGround) {
      this.lastGroundTime = this.scene.time.now;
    }

    // Horizontal movement with better air control for ledge traversal
    const isMovingLeft = this.cursors.left.isDown || this.wasdKeys.A.isDown;
    const isMovingRight = this.cursors.right.isDown || this.wasdKeys.D.isDown;

    if (isMovingLeft) {
      if (isOnGround) {
        body.setVelocityX(-this.moveSpeed);
      } else {
        // Enhanced air control for long-distance jumping
        body.setVelocityX(Math.max(-this.moveSpeed, body.velocity.x - 20));
      }
      this.setFlipX(true); // Face left
    } else if (isMovingRight) {
      if (isOnGround) {
        body.setVelocityX(this.moveSpeed);
      } else {
        // Enhanced air control for long-distance jumping
        body.setVelocityX(Math.min(this.moveSpeed, body.velocity.x + 20));
      }
      this.setFlipX(false); // Face right
    } else {
      // Apply different drag based on ground state
      if (isOnGround) {
        body.setVelocityX(body.velocity.x * 0.85); // Slower stopping on ground for momentum
      } else {
        body.setVelocityX(body.velocity.x * 0.98); // Preserve more momentum in air
      }
    } // Jumping with variable height and coyote time
    const isJumpPressed =
      this.cursors.up.isDown || this.wasdKeys.W.isDown || this.spaceKey.isDown;
    const canJump =
      isOnGround || this.scene.time.now - this.lastGroundTime < this.coyoteTime;

    if (isJumpPressed && canJump && !this.isJumping) {
      // Start jump
      this.isJumping = true;
      this.jumpTime = 0;
      body.setVelocityY(-this.jumpSpeed);
    } else if (
      isJumpPressed &&
      this.isJumping &&
      this.jumpTime < this.maxJumpTime
    ) {
      // Continue jump for variable height
      this.jumpTime += this.scene.game.loop.delta;
      const jumpForce =
        this.jumpSpeed * (1 - this.jumpTime / this.maxJumpTime) * 0.3;
      body.setVelocityY(Math.min(body.velocity.y, -jumpForce));
    } else if (!isJumpPressed || this.jumpTime >= this.maxJumpTime) {
      // End jump
      this.isJumping = false;
      this.jumpTime = 0;
    }

    // Reset jump state when landing
    if (isOnGround && body.velocity.y >= 0) {
      this.isJumping = false;
      this.jumpTime = 0;
    }

    // Add visual feedback for movement
    this.updateVisuals(isOnGround, body);
  }

  private updateVisuals(isOnGround: boolean, body: Phaser.Physics.Arcade.Body) {
    // Change tint based on state
    if (!isOnGround) {
      this.setTint(0x88ff88); // Lighter green when in air
    } else if (Math.abs(body.velocity.x) > 10) {
      this.setTint(0x44ff44); // Darker green when moving
    } else {
      this.setTint(0x00ff00); // Normal green when idle
    }

    // Simple scale animation for landing
    if (isOnGround && body.velocity.y >= 0 && this.scaleY !== 1) {
      this.setScale(1.1, 0.9);
      this.scene.tweens.add({
        targets: this,
        scaleX: 1,
        scaleY: 1,
        duration: 100,
        ease: "Back.easeOut",
      });
    }
  }
}
