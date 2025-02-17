import gameInstance from "./game.js";
import { intersects, getCollisionOverlap, debugLog } from "./tools.js";

export class CollisionDetection {
    constructor() {
        this.state = {
            left: 0,
            right: 0,
            top: 0,
            bottom: 0,
        };
    }

    applyCollisions(object, collisionObjects) {
        this.checkOutOfBounds(object);
        this.checkTriggerCollisions(object, collisionObjects);
        let horizontal_collision_count = this.checkHorizontalCollisions(object, collisionObjects);
        let vertical_collision_count = this.checkVerticalCollisions(object, collisionObjects);
        if (horizontal_collision_count < 0) {
            this.state = {
                left: 0,
                right: 0,
                top: this.state.top,
                bottom: this.state.bottom,
            }
        }
        if (vertical_collision_count < 0) {
            this.state = {
                left: this.state.left,
                right: this.state.right,
                top: 0,
                bottom: 0,
            }
        }
        if (vertical_collision_count == 0 && horizontal_collision_count == 0) {
            this.state = {
                left: 0,
                right: 0,
                top: 0,
                bottom: 0,
            }
        }
    }

    checkTriggerCollisions(object, collisionObjects) {
        const playerRect = object.element.getBoundingClientRect();
        collisionObjects.forEach(collisionObject => {
            if (!collisionObject.enabled) return;
            if (intersects(playerRect, collisionObject.element.getBoundingClientRect())) {
                if (collisionObject.element.classList.contains('trigger')) {
                    collisionObject.trigger();
                }
            }
        });
    }

    checkVerticalCollisions(object, collisionObjects) {
        const playerRect = object.element.getBoundingClientRect();
        let collisionCount = 0;
        collisionObjects.forEach(collisionObject => {
            if (!collisionObject.enabled) return;
            if (collisionObject.element.classList.contains('trigger')) return;
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
                if (intersects(playerRectNext, collisionObject.element.getBoundingClientRect())) {
                    if (collisionObject.element.classList.contains('solid')) {
                        object.velocityY = 0;
                    }
                }
            }
            if (intersects(playerRect, collisionObject.element.getBoundingClientRect())) {
                const collision = getCollisionOverlap(playerRect, collisionObject.element.getBoundingClientRect());
                if (collision.bottom > 0 && collisionObject.element.classList.contains('solid')) {
                    collisionCount++;
                    this.state.bottom = collision.bottom;
                    object.y -= collision.bottom;
                }
                if (collision.top > 0 && collisionObject.element.classList.contains('solid')) {
                    collisionCount++;
                    this.state.top = collision.top;
                    object.y += collision.top;
                }
            }
        });
        return collisionCount;
    }
    
    checkHorizontalCollisions(object, collisionObjects) {
        const playerRect = object.element.getBoundingClientRect();
        let collisionCount = 0;
        collisionObjects.forEach(collisionObject => {
            if (!collisionObject.enabled) return;
            if (collisionObject.element.classList.contains('trigger')) return;
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
                if (intersects(playerRectNext, collisionObject.element.getBoundingClientRect())) {
                    if (collisionObject.element.classList.contains('solid')) {
                        object.velocityX = 0;
                    }
                }
            }
            if (intersects(playerRect, collisionObject.element.getBoundingClientRect())) {
                const collision = getCollisionOverlap(playerRect, collisionObject.element.getBoundingClientRect());
                if (collision.left > 0 && collisionObject.element.classList.contains('solid')) {
                    this.state.left = collision.left;
                    object.x += collision.left;
                    collisionCount++;
                }
                if (collision.right > 0 && collisionObject.element.classList.contains('solid')) {
                    collisionCount++;
                    this.state.right = collision.right;
                    object.x -= collision.right;
                }
            }
        });
        return collisionCount;
    }

    checkOutOfBounds(object) {
        const playerRect = object.element.getBoundingClientRect();
        const levelRect = gameInstance.level.element.getBoundingClientRect();
        debugLog(levelRect.width)
        const outOfBoundEffect = gameInstance.level.outOfBoundEffect;
        if (playerRect.left < levelRect.left) {
            debugLog("Out of bounds left");
            if (outOfBoundEffect.left == "contain") {
                object.x -= playerRect.left - levelRect.left;
            } else if (outOfBoundEffect.left == "respawn") {
                this.respawnAtCheckpoint();
            } else if (outOfBoundEffect.left == "wrap") {
                object.x = levelRect.width - (playerRect.width * 1.25);
                gameInstance.camera.snapToPlayer();
            }
        } else if (playerRect.right > levelRect.right) {
            debugLog("Out of bounds right");
            if (outOfBoundEffect.right == "contain") {
                object.x -= playerRect.right - levelRect.right;
            } else if (outOfBoundEffect.right == "respawn") {
                this.respawnAtCheckpoint();
            } else if (outOfBoundEffect.right == "wrap") {
                object.x = 0 + (playerRect.width / 4)
                gameInstance.camera.snapToPlayer();
            }
        }
        if (playerRect.top < levelRect.top) {
            debugLog("Out of bounds top");
            if (outOfBoundEffect.top == "contain") {
                object.y -= playerRect.top - levelRect.top;
            } else if (outOfBoundEffect.top == "respawn") {
                this.respawnAtCheckpoint();
            } else if (outOfBoundEffect.top == "wrap") {
                object.y = levelRect.height - (playerRect.height + 1);
                gameInstance.camera.snapToPlayer();
            }
        } else if (playerRect.bottom > levelRect.bottom) {
            debugLog("Out of bounds bottom");
            if (outOfBoundEffect.bottom == "contain") {
                object.y -= playerRect.height - (levelRect.bottom - playerRect.top);
            } else if (outOfBoundEffect.bottom == "respawn") {
                this.respawnAtCheckpoint();
            } else if (outOfBoundEffect.bottom == "wrap") {
                object.y = 0;
                gameInstance.camera.snapToPlayer();
            }

        }
    }
}
