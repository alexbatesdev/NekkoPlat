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
    object.updateTransform?.();
    this.checkTriggerCollisions(object, collisionObjects);
    let horizontal_collision_count = this.checkHorizontalCollisions(
      object,
      collisionObjects
    );
    let vertical_collision_count = this.checkVerticalCollisions(
      object,
      collisionObjects
    );
    let slope_collision_count = this.checkSlopeCollisions(
      object,
      collisionObjects
    );
    if (horizontal_collision_count <= 0) {
      this.state = {
        left: 0,
        right: 0,
        top: this.state.top,
        bottom: this.state.bottom,
      };
    }
    if (vertical_collision_count <= 0 && slope_collision_count <= 0) {
      this.state = {
        left: this.state.left,
        right: this.state.right,
        top: 0,
        bottom: 0,
      };
    }
    if (
      vertical_collision_count == 0 &&
      horizontal_collision_count == 0 &&
      slope_collision_count == 0
    ) {
      this.state = {
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
      };
    }
  }

  checkTriggerCollisions(object, collisionObjects) {
    const playerRect = object.element.getBoundingClientRect();
    collisionObjects.forEach((collisionObject) => {
      if (!collisionObject.enabled) return;
      const collisionRect = collisionObject.element.getBoundingClientRect();
      if (intersects(playerRect, collisionRect)) {
        if (collisionObject.element.classList.contains("trigger")) {
          collisionObject.trigger();
        }
      }
    });
  }

  checkVerticalCollisions(object, collisionObjects) {
    const playerRect = object.element.getBoundingClientRect();
    let collisionCount = 0;
    collisionObjects.forEach((collisionObject) => {
      if (!collisionObject.enabled) return;
      if (collisionObject.element.classList.contains("trigger")) return;
      if (collisionObject.element.classList.contains("slope")) return;
      const collisionRect = collisionObject.element.getBoundingClientRect();
      if (intersects(playerRect, collisionRect)) {
        const collision = getCollisionOverlap(playerRect, collisionRect);
        if (
          collision.bottom > 0 &&
          collisionObject.element.classList.contains("solid")
        ) {
          collisionCount++;
          this.state.bottom = collision.bottom;
          object.y -= collision.bottom;
          object.velocityY = 0;
        }
        if (
          collision.top > 0 &&
          collisionObject.element.classList.contains("solid")
        ) {
          collisionCount++;
          this.state.top = collision.top;
          object.y += collision.top;
          object.velocityY = 0;
        }
      }
    });
    return collisionCount;
  }

  checkHorizontalCollisions(object, collisionObjects) {
    const playerRect = object.element.getBoundingClientRect();
    let collisionCount = 0;
    collisionObjects.forEach((collisionObject) => {
      if (!collisionObject.enabled) return;
      if (collisionObject.element.classList.contains("trigger")) return;
      if (collisionObject.element.classList.contains("slope")) return;
      const collisionRect = collisionObject.element.getBoundingClientRect();
      if (intersects(playerRect, collisionRect)) {
        const collision = getCollisionOverlap(playerRect, collisionRect);
        if (
          collision.left > 0 &&
          collisionObject.element.classList.contains("solid")
        ) {
          this.state.left = collision.left;
          object.x += collision.left;
          object.velocityX = 0;
          collisionCount++;
        }
        if (
          collision.right > 0 &&
          collisionObject.element.classList.contains("solid")
        ) {
          collisionCount++;
          this.state.right = collision.right;
          object.x -= collision.right;
          object.velocityX = 0;
        }
      }
    });
    return collisionCount;
  }

  checkSlopeCollisions(object, collisionObjects) {
    const playerRect = object.element.getBoundingClientRect();
    let collisionCount = 0;
    collisionObjects.forEach((collisionObject) => {
      if (!collisionObject.enabled) return;
      if (!collisionObject.element.classList.contains("slope")) return;
      const slopeRect = collisionObject.element.getBoundingClientRect();
      if (!intersects(playerRect, slopeRect)) return;
      const type = collisionObject.element.dataset.slope || "up-right";
      const centerX = playerRect.left + playerRect.width / 2;
      const xRatio = (centerX - slopeRect.left) / slopeRect.width;
      if (xRatio < 0 || xRatio > 1) return;
      let surfaceY = 0;
      let angleRad = 0;
      let slideDir = 0;
      if (type === "function" && collisionObject.slopeFn) {
        const fn = collisionObject.slopeFn;
        const clamp = (v) => Math.min(1, Math.max(0, v));
        const yNorm = clamp(fn(xRatio));
        surfaceY = slopeRect.bottom - slopeRect.height * yNorm;
        const delta = 0.001;
        const y1 = clamp(fn(Math.min(1, xRatio + delta)));
        const y0 = clamp(fn(Math.max(0, xRatio - delta)));
        const derivative = (y1 - y0) / (delta * 2);
        const slope = derivative * (slopeRect.height / slopeRect.width);
        angleRad = Math.atan(Math.abs(slope));
        if (slope < 0) slideDir = 1;
        else if (slope > 0) slideDir = -1;
      } else {
        switch (type) {
          case "up-right":
            surfaceY = slopeRect.bottom - slopeRect.height * xRatio;
            slideDir = -1;
            break;
          case "up-left":
            surfaceY = slopeRect.bottom - slopeRect.height * (1 - xRatio);
            slideDir = 1;
            break;
          case "down-right":
            surfaceY = slopeRect.top + slopeRect.height * xRatio;
            slideDir = 1;
            break;
          case "down-left":
            surfaceY = slopeRect.top + slopeRect.height * (1 - xRatio);
            slideDir = -1;
            break;
          default:
            surfaceY = slopeRect.bottom - slopeRect.height * xRatio;
            slideDir = -1;
        }
        angleRad = Math.atan(slopeRect.height / slopeRect.width);
        const style = window.getComputedStyle(collisionObject.element);
        const transform = style.transform || style.webkitTransform;
        if (transform && transform !== "none") {
          const match = transform.match(/matrix\(([^)]+)\)/);
          if (match) {
            const values = match[1].split(",").map(parseFloat);
            if (values.length >= 2) {
              angleRad = Math.atan2(values[1], values[0]);
            }
          }
        }
      }
      const playerBottom = playerRect.bottom;
      if (playerBottom >= surfaceY && playerRect.top <= surfaceY) {
        const overlap = playerBottom - surfaceY;
        object.y -= overlap;
        object.velocityY = 0;
        this.state.bottom = overlap;
        object.updateTransform?.();
        collisionCount++;
        const angleDeg = Math.abs(angleRad * (180 / Math.PI));
        if (
          object.physics.slideOnSlopes &&
          angleDeg > object.physics.slopeSlideThreshold &&
          slideDir !== 0
        ) {
          object.velocityX +=
            Math.sin(Math.abs(angleRad)) * object.physics.gravity * slideDir;
        }
      }
    });
    return collisionCount;
  }

  // isGrounded(object, collisionObjects) {
  //   const playerRect = object.element.getBoundingClientRect();
  //   const probeRect = {
  //     left: playerRect.left,
  //     right: playerRect.right,
  //     top: playerRect.bottom,
  //     bottom: playerRect.bottom + 1,
  //   };
  //   return collisionObjects.some((collisionObject) => {
  //     if (!collisionObject.enabled) return false;
  //     const el = collisionObject.element;
  //     if (!(el.classList.contains("solid") || el.classList.contains("slope")))
  //       return false;
  //     return intersects(probeRect, el.getBoundingClientRect());
  //   });
  // }

  // checkSlopeCollisions(object, collisionObjects) {
  //   let collisionCount = 0;
  //   collisionObjects.forEach((collisionObject) => {
  //     if (!collisionObject.element.classList.contains("slope")) return;
  //     const playerRect = object.element.getBoundingClientRect();
  //     const slopeRect = collisionObject.element.getBoundingClientRect();
  //     if (!intersects(playerRect, slopeRect)) return;
  //     const type = collisionObject.element.dataset.slope || "up-right";
  //     const centerX = playerRect.left + playerRect.width / 2;
  //     const xRatio = (centerX - slopeRect.left) / slopeRect.width;
  //     if (xRatio < 0 || xRatio > 1) return;
  //     let surfaceY = 0;
  //     switch (type) {
  //       case "up-right":
  //         surfaceY = slopeRect.bottom - slopeRect.height * xRatio;
  //         break;
  //       case "up-left":
  //         surfaceY = slopeRect.bottom - slopeRect.height * (1 - xRatio);
  //         break;
  //       case "down-right":
  //         surfaceY = slopeRect.top + slopeRect.height * xRatio;
  //         break;
  //       case "down-left":
  //         surfaceY = slopeRect.top + slopeRect.height * (1 - xRatio);
  //         break;
  //       default:
  //         surfaceY = slopeRect.bottom - slopeRect.height * xRatio;
  //     }
  //     const playerBottom = playerRect.bottom;
  //     if (playerBottom >= surfaceY && playerRect.top <= surfaceY) {
  //       const overlap = playerBottom - surfaceY;
  //       object.y -= overlap;
  //       object.velocityY = 0;
  //       this.state.bottom = overlap;
  //       object.updateTransform?.();
  //       collisionCount++;
  //     }
  //   });
  //   return collisionCount;
  // }

  isGrounded(object, collisionObjects) {
    const playerRect = object.element.getBoundingClientRect();
    const probeRect = {
      left: playerRect.left,
      right: playerRect.right,
      top: playerRect.bottom,
      bottom: playerRect.bottom + 1,
    };
    let groundedObj = null;
    const grounded = collisionObjects.some((collisionObject) => {
      const el = collisionObject.element;
      if (!(el.classList.contains("solid") || el.classList.contains("slope")))
        return false;
      const hit = intersects(probeRect, el.getBoundingClientRect());
      if (hit) groundedObj = collisionObject;
      return hit;
    });
    object.groundedObject = groundedObj;
    return grounded;
  }

  checkOutOfBounds(object) {
    const playerRect = object.element.getBoundingClientRect();
    const levelRect = gameInstance.level.element.getBoundingClientRect();
    const outOfBoundEffect = gameInstance.level.outOfBoundEffect;
    if (playerRect.left < levelRect.left) {
      debugLog("Out of bounds left");
      if (outOfBoundEffect.left == "contain") {
        object.x -= playerRect.left - levelRect.left;
        object.updateTransform?.();
      } else if (outOfBoundEffect.left == "respawn") {
        this.respawnAtCheckpoint();
      } else if (outOfBoundEffect.left == "wrap") {
        object.x = levelRect.width - playerRect.width * 1.25;
        gameInstance.camera.snapToPlayer();
        object.updateTransform?.();
      }
    } else if (playerRect.right > levelRect.right) {
      debugLog("Out of bounds right");
      if (outOfBoundEffect.right == "contain") {
        object.x -= playerRect.right - levelRect.right;
        object.updateTransform?.();
      } else if (outOfBoundEffect.right == "respawn") {
        this.respawnAtCheckpoint();
      } else if (outOfBoundEffect.right == "wrap") {
        object.x = 0 + playerRect.width / 4;
        gameInstance.camera.snapToPlayer();
        object.updateTransform?.();
      }
    }
    if (playerRect.top < levelRect.top) {
      debugLog("Out of bounds top");
      if (outOfBoundEffect.top == "contain") {
        object.y -= playerRect.top - levelRect.top;
        object.updateTransform?.();
      } else if (outOfBoundEffect.top == "respawn") {
        this.respawnAtCheckpoint();
      } else if (outOfBoundEffect.top == "wrap") {
        object.y = levelRect.height - (playerRect.height + 1);
        gameInstance.camera.snapToPlayer();
        object.updateTransform?.();
      }
    } else if (playerRect.bottom > levelRect.bottom) {
      debugLog("Out of bounds bottom");
      if (outOfBoundEffect.bottom == "contain") {
        object.y -= playerRect.height - (levelRect.bottom - playerRect.top);
        object.updateTransform?.();
      } else if (outOfBoundEffect.bottom == "respawn") {
        this.respawnAtCheckpoint();
      } else if (outOfBoundEffect.bottom == "wrap") {
        object.y = 0;
        gameInstance.camera.snapToPlayer();
        object.updateTransform?.();
      }
    }
  }
}
