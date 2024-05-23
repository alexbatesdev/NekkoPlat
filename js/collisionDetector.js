// CollisionDetection.js
// COMPLETELY UNTESTED AND UNIMPLEMENTED 😎🐢
export class CollisionDetection {
    constructor() {
        this.collisionState = {
            left: 0,
            right: 0,
            top: 0,
            bottom: 0,
        };
    }

    checkCollisions(object, solidObjects) {
        const objectRect = object.element.getBoundingClientRect();
        let collisionCount = 0;

        solidObjects.forEach(solidObject => {
            solidObject.updateRect();
            if (this.intersects(objectRect, solidObject.rect)) {
                const collision = this.getCollisionOverlap(objectRect, solidObject.rect);
                if (collision.bottom > 0) {
                    collisionCount++;
                    this.collisionState.bottom = collision.bottom;
                    object.y -= collision.bottom; // Adjust the y position by the overlap
                }
                if (collision.top > 0) {
                    this.collisionState.top = collision.top;
                    object.y += collision.top; // Adjust the y position by the overlap
                    collisionCount++;
                }
                if (collision.left > 0) {
                    this.collisionState.left = collision.left;
                    object.x += collision.left; // Adjust the x position by the overlap
                    collisionCount++;
                }
                if (collision.right > 0) {
                    this.collisionState.right = collision.right;
                    object.x -= collision.right; // Adjust the x position by the overlap
                    collisionCount++;
                }
            }
        });

        return collisionCount;
    }

    intersects(rect1, rect2) {
        return (
            rect1.left < rect2.right &&
            rect1.right > rect2.left &&
            rect1.top < rect2.bottom &&
            rect1.bottom > rect2.top
        );
    }

    getCollisionOverlap(rect1, rect2) {
        const overlap = {
            left: Math.max(0, rect2.left - rect1.right),
            right: Math.max(0, rect1.left - rect2.right),
            top: Math.max(0, rect2.top - rect1.bottom),
            bottom: Math.max(0, rect1.top - rect2.bottom),
        };
        return overlap;
    }
}
