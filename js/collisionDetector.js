import gameInstance from "./game.js";
import { intersects, getCollisionOverlap } from "./tools.js";

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
        const objectRect = object.element.getBoundingClientRect();

        // Group objects by type for batch processing
        const solidObjects = [];
        const triggerObjects = [];

        collisionObjects.forEach(collisionObject => {
            if (!collisionObject.enabled) return;
            if (collisionObject.constructor.tags.includes('solid')) {
                solidObjects.push(collisionObject);
            }
            if (collisionObject.constructor.tags.includes('trigger')) {
                triggerObjects.push(collisionObject);
            }
        });

        // Process collisions
        this.checkOutOfBounds(object, objectRect);
        this.checkTriggerCollisions(triggerObjects, objectRect);
        const horizontalCollisions = this.checkHorizontalCollisions(object, solidObjects, objectRect);
        const verticalCollisions = this.checkVerticalCollisions(object, solidObjects, objectRect);

        // Update collision state
        this.updateCollisionState(horizontalCollisions, verticalCollisions);
    }

    updateCollisionState(horizontalCollisions, verticalCollisions) {
        if (horizontalCollisions === 0) {
            this.state.left = 0;
            this.state.right = 0;
        }
        if (verticalCollisions === 0) {
            this.state.top = 0;
            this.state.bottom = 0;
        }
        if (horizontalCollisions === 0 && verticalCollisions === 0) {
            this.state = { left: 0, right: 0, top: 0, bottom: 0 };
        }
    }

    checkTriggerCollisions(triggerObjects, playerRect) {
        triggerObjects.forEach(trigger => {
            if (intersects(playerRect, trigger.element.getBoundingClientRect())) {
                trigger.trigger();
            }
        });
    }

    checkVerticalCollisions(object, solidObjects, playerRect) {
        let collisionCount = 0;

        solidObjects.forEach(solid => {
            const solidRect = solid.element.getBoundingClientRect();

            // Predict future position
            const futureRect = {
                ...playerRect,
                top: playerRect.top + object.velocityY,
                bottom: playerRect.bottom + object.velocityY,
            };

            if (intersects(futureRect, solidRect)) {
                const collision = getCollisionOverlap(playerRect, solidRect);

                if (collision.bottom > 0) {
                    collisionCount++;
                    this.state.bottom = collision.bottom;
                    object.y -= collision.bottom;
                    object.velocityY = 0;
                }
                if (collision.top > 0) {
                    collisionCount++;
                    this.state.top = collision.top;
                    object.y += collision.top;
                    object.velocityY = 0;
                }
            }
        });

        return collisionCount;
    }

    checkHorizontalCollisions(object, solidObjects, playerRect) {
        let collisionCount = 0;

        solidObjects.forEach(solid => {
            const solidRect = solid.element.getBoundingClientRect();

            // Predict future position
            const futureRect = {
                ...playerRect,
                left: playerRect.left + object.velocityX,
                right: playerRect.right + object.velocityX,
            };

            if (intersects(futureRect, solidRect)) {
                const collision = getCollisionOverlap(playerRect, solidRect);

                if (collision.left > 0) {
                    collisionCount++;
                    this.state.left = collision.left;
                    object.x += collision.left;
                    object.velocityX = 0;
                }
                if (collision.right > 0) {
                    collisionCount++;
                    this.state.right = collision.right;
                    object.x -= collision.right;
                    object.velocityX = 0;
                }
            }
        });

        return collisionCount;
    }

    checkOutOfBounds(object, playerRect) {
        const levelRect = gameInstance.level.element.getBoundingClientRect();

        if (playerRect.left < levelRect.left) {
            this.handleOutOfBounds(object, 'left', playerRect.left - levelRect.left);
        } else if (playerRect.right > levelRect.right) {
            this.handleOutOfBounds(object, 'right', playerRect.right - levelRect.right);
        }
        if (playerRect.top < levelRect.top) {
            this.handleOutOfBounds(object, 'top', playerRect.top - levelRect.top);
        } else if (playerRect.bottom > levelRect.bottom) {
            this.handleOutOfBounds(object, 'bottom', playerRect.bottom - levelRect.bottom);
        }
    }

    handleOutOfBounds(object, direction, overlap) {
        const outOfBoundEffect = gameInstance.level.outOfBoundEffect[direction];

        if (outOfBoundEffect === 'contain') {
            if (direction === 'left' || direction === 'right') {
                object.x -= overlap;
            } else {
                object.y -= overlap;
            }
        } else if (outOfBoundEffect === 'respawn') {
            this.respawnAtCheckpoint();
        } else if (outOfBoundEffect === 'wrap') {
            if (direction === 'left' || direction === 'right') {
                object.x = direction === 'left' ? gameInstance.level.width : 0;
            } else {
                object.y = direction === 'top' ? gameInstance.level.height : 0;
            }
            gameInstance.camera.snapToPlayer();
        }
    }
}