import gameInstance from "./game.js";
import { anyTrue } from "./tools.js";

export default class PlayerMovement {
    constructor(player, physics) {
        this.player = player;
        this.physics = physics;
        this.airJumps = 0;
        this.jumpProcessed = false;
        this.jumpInProgress = false;
        this.coyoteTimeActive = false;
    }

    update() {
        this.processInput();
        this.physics.applyPhysics(this.player, this.player.collision.state);
        this.player.collision.applyCollisions(this.player, this.player.collisionObjects);
        this.processCollisions();
    }

    processInput() {
        const cfg = this.player.config;
        if (gameInstance.keyState['SHIFT'] && this.player.grounded) {
            this.physics.acceleration = cfg.sprintAcceleration;
            this.physics.maxVelocity = cfg.sprintMaxVelocity;
        } else if (!gameInstance.keyState['SHIFT'] && this.player.grounded) {
            this.physics.acceleration = cfg.acceleration;
            this.physics.maxVelocity = cfg.maxVelocity;
        }

        if (gameInstance.keyState['A']) {
            this.player.animation.lookLeft();
            this.physics.move(this.player, -this.physics.acceleration, 0);
        }
        if (gameInstance.keyState['D']) {
            this.player.animation.lookRight();
            this.physics.move(this.player, this.physics.acceleration, 0);
        }
        if (gameInstance.keyState['S']) this.player.velocityY += this.physics.acceleration;
        if (gameInstance.keyState['W'] || gameInstance.keyState['SPACE']) {
            this.jump();
        } else {
            this.jumpProcessed = false;
            if (!this.player.grounded && this.player.velocityY < 0) {
                this.physics.gravity = cfg.fallingGravity;
            } else {
                this.physics.gravity = cfg.gravity;
            }
        }
        if (gameInstance.keyState['R']) {
            this.player.respawnAtCheckpoint();
        }
    }

    jump() {
        const cfg = this.player.config;
        if (!this.jumpProcessed && anyTrue([
            this.player.grounded,
            this.airJumps < cfg.maxAirJumps,
            this.player.collision.state.left > 0,
            this.player.collision.state.right > 0,
            this.coyoteTimeActive,
        ])) {
            this.jumpProcessed = true;
            this.jumpInProgress = true;
            if (!this.player.grounded && !(this.player.collision.state.left > 0 || this.player.collision.state.right > 0 || this.coyoteTimeActive)) {
                this.airJumps += 1;
            }
            if (this.player.collision.state.left > 0) {
                this.player.velocityX += 12;
            } else if (this.player.collision.state.right > 0) {
                this.player.velocityX -= 12;
            }
            this.player.velocityY = -cfg.jumpForce;
        } else if (this.airJumps >= cfg.maxAirJumps && !this.player.grounded) {
            setTimeout(() => {
                if (this.player.grounded) {
                    this.jump();
                }
            }, cfg.preJumpAllowance);
        }
    }

    processCollisions() {
        const collision = this.player.collision.state;
        if (collision.bottom > 0) {
            if (!this.player.grounded) {
                this.jumpInProgress = false;
                this.airJumps = 0;
            }
            this.player.grounded = true;
        }
        if (collision.top == 0 && collision.bottom == 0) {
            this.player.grounded = false;
            if (this.player.velocityY > 0 && !this.jumpInProgress) {
                this.coyoteTimeActive = true;
                setTimeout(() => {
                    this.coyoteTimeActive = false;
                }, this.player.config.coyoteTime);
            }
        }
        if ((collision.left > 0 || collision.right) && this.player.velocityY > 0) this.player.velocityY *= 0.5;
    }
}
