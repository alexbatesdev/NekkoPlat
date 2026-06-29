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
      const collisionRect = collisionObject.element.getBoundingClientRect();
      if (intersects(playerRect, collisionRect)) {
        if (collisionObject.element.classList.contains("trigger")) {
          collisionObject.trigger();
        }
      }
    });
  }

  checkVerticalCollisions(object, collisionObjects) {
    let collisionCount = 0;
    collisionObjects.forEach((collisionObject) => {
      if (!collisionObject.enabled) return;
      const el = collisionObject.element;
      if (el.classList.contains("trigger")) return;
      if (el.classList.contains("slope")) return;
      const playerRect = object.element.getBoundingClientRect();
      const collisionRect = el.getBoundingClientRect();
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
    let collisionCount = 0;
    collisionObjects.forEach((collisionObject) => {
      if (!collisionObject.enabled) return;
      const el = collisionObject.element;
      if (el.classList.contains("trigger")) return;
      if (el.classList.contains("slope")) return;
      const playerRect = object.element.getBoundingClientRect();
      const collisionRect = el.getBoundingClientRect();
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

  evaluateSlopeEquation(slopeElement, x) {
    const rawEquation = slopeElement.dataset.slopeEquation || "";
    if (!rawEquation) return null;

    let expression = rawEquation.trim();
    if (!expression) return null;

    const equationMatch = expression.match(/^y\s*=\s*(.+)$/i);
    if (equationMatch) {
      expression = equationMatch[1];
    }

    expression = expression.replace(/\s+/g, "");
    expression = expression.replace(/\^/g, "**");
    expression = expression.replace(/([0-9)\w])([A-Za-z(])/g, "$1*$2");
    expression = expression.replace(/([)\w])([0-9(])/g, "$1*$2");

    const variableValues = {};
    Object.entries(slopeElement.dataset).forEach(([key, value]) => {
      const singleLetterMatch = key.match(/^slope([A-Za-z])$/);
      if (!singleLetterMatch) return;
      const variableName = singleLetterMatch[1].toLowerCase();
      const numericValue = Number(value);
      if (Number.isFinite(numericValue)) {
        variableValues[variableName] = numericValue;
      }
    });

    const paramNames = ["x", ...Object.keys(variableValues)];
    const paramValues = [x, ...Object.values(variableValues)];

    try {
      const evaluator = new Function(...paramNames, `return (${expression});`);
      const result = evaluator(...paramValues);
      return Number.isFinite(result) ? result : null;
    } catch (error) {
      return null;
    }
  }

  getSlopeSurfaceY(slopeElement, playerRect) {
    const slopeRect = slopeElement.getBoundingClientRect();
    const centerX = playerRect.left + playerRect.width / 2;
    const equation = slopeElement.dataset.slopeEquation;

    if (equation) {
      const localX = centerX - slopeRect.left;
      if (localX < 0 || localX > slopeRect.width) return null;
      const localY = this.evaluateSlopeEquation(slopeElement, localX);
      if (localY == null || localY < 0 || localY > slopeRect.height) return null;
      return slopeRect.top + localY;
    }

    const type = slopeElement.dataset.slope || "up-right";
    const xRatio = (centerX - slopeRect.left) / slopeRect.width;
    if (xRatio < 0 || xRatio > 1) return null;

    switch (type) {
      case "up-right":
        return slopeRect.bottom - slopeRect.height * xRatio;
      case "up-left":
        return slopeRect.bottom - slopeRect.height * (1 - xRatio);
      case "down-right":
        return slopeRect.top + slopeRect.height * xRatio;
      case "down-left":
        return slopeRect.top + slopeRect.height * (1 - xRatio);
      default:
        return slopeRect.bottom - slopeRect.height * xRatio;
    }
  }

  checkSlopeCollisions(object, collisionObjects) {
    let collisionCount = 0;
    collisionObjects.forEach((collisionObject) => {
      if (!collisionObject.element.classList.contains("slope")) return;
      const playerRect = object.element.getBoundingClientRect();
      const slopeRect = collisionObject.element.getBoundingClientRect();
      if (!intersects(playerRect, slopeRect)) return;

      const surfaceY = this.getSlopeSurfaceY(collisionObject.element, playerRect);
      if (surfaceY == null) return;

      const playerBottom = playerRect.bottom;
      if (playerBottom >= surfaceY && playerRect.top <= surfaceY) {
        const overlap = playerBottom - surfaceY;
        object.y -= overlap;
        object.velocityY = 0;
        this.state.bottom = overlap;
        object.updateTransform?.();
        collisionCount++;
      }
    });
    return collisionCount;
  }

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
