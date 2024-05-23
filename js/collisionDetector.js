import gameInstance from "./game.js";
import { intersects, getCollisionOverlap } from "./tools.js";
// CollisionDetection.js
// COMPLETELY UNTESTED AND UNIMPLEMENTED 😎🐢
export class CollisionDetection {
    constructor() {
        this.state = {
            left: 0,
            right: 0,
            top: 0,
            bottom: 0,
        };
    }

    applyCollisions(object, solidObjects) {
        this.checkOutOfBounds(object);
        let horizontal_collision_count = this.checkHorizontalCollisions(object, solidObjects);
        let vertical_collision_count = this.checkVerticalCollisions(object, solidObjects);

        if (horizontal_collision_count > 0) {
            if (object.velocityY > 0) object.velocityY *= 0.5;
        } else {
            this.state = {
                left: 0,
                right: 0,
                top: this.state.top,
                bottom: this.state.bottom,
            }
        }

        if (vertical_collision_count > 0) {
            if (this.state.bottom > 0 && !object.grounded) {
                object.jumpInProgress = false;
                object.airJumps = 0;
                object.grounded = true;
            }
        } else {
            this.state = {
                left: this.state.left,
                right: this.state.right,
                top: 0,
                bottom: 0,
            }
            object.grounded = false;
            if (object.velocityY > 0 && !object.jumpInProgress) {
                object.coyoteTimeActive = true;
                setTimeout(() => {
                    object.coyoteTimeActive = false;
                }, object.coyoteTime);
            }
        }

        if (vertical_collision_count == 0 && horizontal_collision_count == 0) {
            // this.animationManager.changeAnimation('jump');
            this.state = {
                left: 0,
                right: 0,
                top: 0,
                bottom: 0,
            }

        }
    }

    checkVerticalCollisions(object, solidObjects) {
        const playerRect = object.element.getBoundingClientRect();
        let collisionCount = 0;
        solidObjects.forEach(solidObject => {
            for (let i = 0.25; i < 1; i += 0.25) {
                let playerRectNext = {
                    left: playerRect.left + 20,
                    right: playerRect.right - 20,
                    top: playerRect.top + (object.velocityY * i),
                    bottom: playerRect.bottom + ((object.velocityY - object.physics.gravity) * i),
                    x: playerRect.x,
                    y: playerRect.y,
                    width: playerRect.width,
                    height: playerRect.height,
                }
                if (intersects(playerRectNext, solidObject.rect)) {
                    object.velocityY = 0;
                }
            }
            if (intersects(playerRect, solidObject.rect)) {
                const collision = getCollisionOverlap(playerRect, solidObject.rect);
                if (collision.bottom > 0) {
                    collisionCount++;
                    this.state.bottom = collision.bottom;
                    object.y -= collision.bottom; // Adjust the y position by the overlap
                }
                if (collision.top > 0) {
                    this.state.top = collision.top;
                    object.y += collision.top; // Adjust the y position by the overlap
                    collisionCount++;
                }
            }
        });
        return collisionCount;
    }

    checkHorizontalCollisions(object, solidObjects) {
        const playerRect = object.element.getBoundingClientRect();
        let collisionCount = 0;
        solidObjects.forEach(solidObject => {
            for (let i = 0.25; i < 1; i += 0.25) {
                let playerRectNext = {
                    left: playerRect.left + (object.velocityX * i),
                    right: playerRect.right + (object.velocityX * i),
                    top: playerRect.top,
                    bottom: playerRect.bottom - 25,
                    x: playerRect.x,
                    y: playerRect.y,
                    width: playerRect.width,
                    height: playerRect.height,
                }
                if (intersects(playerRectNext, solidObject.rect)) {
                    object.velocityX = 0;
                }
            }
            if (intersects(playerRect, solidObject.rect)) {
                const collision = getCollisionOverlap(playerRect, solidObject.rect);
                if (collision.left > 0) {
                    this.state.left = collision.left;
                    object.x += collision.left; // Adjust the x position by the overlap
                    collisionCount++;
                }
                if (collision.right > 0) {
                    this.state.right = collision.right;
                    object.x -= collision.right; // Adjust the x position by the overlap
                    collisionCount++;
                }
            }
        });
        return collisionCount;
    }

    checkOutOfBounds(object) {
        const playerRect = object.element.getBoundingClientRect();
        const levelRect = gameInstance.level.element.getBoundingClientRect();
        const outOfBoundEffect = gameInstance.level.outOfBoundEffect;
        if (playerRect.left < levelRect.left) {
            console.log("Out of bounds left");
            if (outOfBoundEffect.left == "contain") {
                object.x -= playerRect.left - levelRect.left;
                console.log(object.x);
            } else if (outOfBoundEffect.left == "respawn") {
                this.respawnAtCheckpoint();
            } else if (outOfBoundEffect.left == "wrap") {
                object.x = levelRect.right - playerRect.width;
            }
        } else if (playerRect.right > levelRect.right) {
            console.log("Out of bounds right");
            if (outOfBoundEffect.right == "contain") {
                object.x -= playerRect.right - levelRect.right;
            } else if (outOfBoundEffect.right == "respawn") {
                this.respawnAtCheckpoint();
            } else if (outOfBoundEffect.right == "wrap") {
                object.x = 0;
            }
        }
        if (playerRect.top < levelRect.top) {
            console.log("Out of bounds top");
            if (outOfBoundEffect.top == "contain") {
                object.y -= playerRect.top - levelRect.top;
            } else if (outOfBoundEffect.top == "respawn") {
                this.respawnAtCheckpoint();
            } else if (outOfBoundEffect.top == "wrap") {
                object.y = levelRect.height - playerRect.height;
            }
        } else if (playerRect.bottom > levelRect.bottom) {
            console.log("Out of bounds bottom");
            if (outOfBoundEffect.bottom == "contain") {
                object.y -= playerRect.bottom - levelRect.bottom;
            } else if (outOfBoundEffect.bottom == "respawn") {
                this.respawnAtCheckpoint();
            } else if (outOfBoundEffect.bottom == "wrap") {
                object.y = 0;
            }

        }
    }
}
