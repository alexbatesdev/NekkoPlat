// Physics.js
export class Physics {
    constructor() {
        this.gravity = 0.9;
        this.maxVelocity = 10;
        this.acceleration = 0.7;
        this.friction = 0.93;
    }

    applyPhysics(object, collisionState, delta) {
        const frameMult = delta * 60; // scale values to maintain 60fps behaviour
        object.velocityY += this.gravity * frameMult;
        if (object.grounded && Math.abs(object.velocityX) < 0.2) {
            object.velocityX = 0;
        } else if (object.grounded) {
            object.velocityX *= Math.pow(this.friction, frameMult);
        }

        // Apply max falling velocity
        if (!collisionState.bottom > 0) {
            if (object.velocityY > 30) {
                object.velocityY = 30;
            }
        }

        if (object.velocityX > this.maxVelocity) {
            object.velocityX = this.maxVelocity;
        } else if (object.velocityX < -this.maxVelocity) {
            object.velocityX = -this.maxVelocity;
        }

        object.x += object.velocityX * frameMult;
        object.y += object.velocityY * frameMult;
    }

    move(object, xVelocity, yVelocity, delta) {
        const frameMult = delta * 60;
        if (object.grounded) {
            object.velocityX += xVelocity * frameMult;
        } else {
            object.velocityX += (xVelocity * 0.5) * frameMult;
        }
        object.velocityY += yVelocity * frameMult;
    }
}
