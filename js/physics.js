// Physics.js
export class Physics {
    constructor() {
        this.gravity = 0.9;
        this.maxVelocity = 10;
        this.acceleration = 0.7;
        this.friction = 0.93;
    }

    applyPhysics(object, collisionState) {
        object.velocityY += this.gravity;
        if (object.grounded && Math.abs(object.velocityX) < 0.2) {
            object.velocityX = 0;
        } else {
            object.velocityX *= this.friction;
        }

        // Apply max velocity while grounded
        if (!collisionState.bottom > 0) {
            if (object.velocityY > 30) {
                object.velocityY = 30;
            }
        }

        object.x += object.velocityX;
        object.y += object.velocityY;
    }

    move(object, xVelocity, yVelocity) {
        object.velocityX += xVelocity;
        object.velocityY += yVelocity;
    }
}
