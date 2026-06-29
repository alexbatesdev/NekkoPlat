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
    this.slopeDebugCanvas = null;
    this.slopeDebugContext = null;
    this.slopeDebugFramePending = false;
    this.slopeDebugLastDrawTime = 0;
    this.slopeDebugLastBounds = null;
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

    this.queueSlopeDebugDraw(object, collisionObjects);
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
    expression = expression.replace(/([A-Za-z)])(?=[A-Za-z(])/g, "$1*");
    expression = expression.replace(/([A-Za-z)])(?=[0-9(])/g, "$1*");
    expression = expression.replace(/([0-9)])(?=[A-Za-z(])/g, "$1*");

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

  getSlopeSurfaceHeight(slopeElement, localX) {
    const slopeRect = slopeElement.getBoundingClientRect();
    const equation = slopeElement.dataset.slopeEquation;

    if (equation) {
      if (localX < 0 || localX > slopeRect.width) return null;
      const inputY = this.evaluateSlopeEquation(slopeElement, localX);
      if (inputY == null || inputY < 0 || inputY > slopeRect.height) return null;
      // Interpret user input as a conventional math line with y increasing upward.
      // Convert that to the screen-space height from the top edge.
      return slopeRect.height - inputY;
    }

    const type = slopeElement.dataset.slope || "up-right";
    const xRatio = localX / slopeRect.width;
    if (xRatio < 0 || xRatio > 1) return null;

    switch (type) {
      case "up-right":
        return slopeRect.height * (1 - xRatio);
      case "up-left":
        return slopeRect.height * xRatio;
      case "down-right":
        return slopeRect.height * xRatio;
      case "down-left":
        return slopeRect.height * (1 - xRatio);
      default:
        return slopeRect.height * (1 - xRatio);
    }
  }

  getSlopeSurfaceY(slopeElement, playerRect) {
    const slopeRect = slopeElement.getBoundingClientRect();
    const centerX = playerRect.left + playerRect.width / 2;
    const localX = centerX - slopeRect.left;
    const surfaceHeight = this.getSlopeSurfaceHeight(slopeElement, localX);
    if (surfaceHeight == null) return null;
    return slopeRect.top + surfaceHeight;
  }

  ensureSlopeDebugCanvas() {
    if (typeof document === "undefined") return null;
    if (this.slopeDebugCanvas) return this.slopeDebugCanvas;

    const canvas = document.createElement("canvas");
    canvas.style.position = "fixed";
    canvas.style.inset = "0";
    canvas.style.width = "100vw";
    canvas.style.height = "100vh";
    canvas.style.pointerEvents = "none";
    canvas.style.zIndex = "10000";
    canvas.style.opacity = "0.9";
    document.body.appendChild(canvas);

    this.slopeDebugCanvas = canvas;
    this.slopeDebugContext = canvas.getContext("2d");
    return canvas;
  }

  queueSlopeDebugDraw(object, collisionObjects) {
    if (!gameInstance.debug) {
      if (this.slopeDebugCanvas) {
        this.slopeDebugCanvas.style.display = "none";
      }
      return;
    }

    if (!this.ensureSlopeDebugCanvas()) return;
    this.slopeDebugCanvas.style.display = "block";

    const playerRect = object?.element?.getBoundingClientRect?.();
    const bounds = {
      playerLeft: playerRect?.left ?? 0,
      playerTop: playerRect?.top ?? 0,
      playerWidth: playerRect?.width ?? 0,
      collisionCount: collisionObjects.filter((entry) => entry.element?.classList?.contains("slope")).length,
      width: window.innerWidth,
      height: window.innerHeight,
      dpr: window.devicePixelRatio || 1,
    };

    const shouldSkip =
      this.slopeDebugFramePending ||
      (this.slopeDebugLastBounds &&
        this.slopeDebugLastBounds.playerLeft === bounds.playerLeft &&
        this.slopeDebugLastBounds.playerTop === bounds.playerTop &&
        this.slopeDebugLastBounds.playerWidth === bounds.playerWidth &&
        this.slopeDebugLastBounds.collisionCount === bounds.collisionCount &&
        this.slopeDebugLastBounds.width === bounds.width &&
        this.slopeDebugLastBounds.height === bounds.height &&
        this.slopeDebugLastBounds.dpr === bounds.dpr);

    if (shouldSkip) return;

    this.slopeDebugLastBounds = bounds;
    this.slopeDebugFramePending = true;
    window.requestAnimationFrame(() => {
      this.slopeDebugFramePending = false;
      this.drawSlopeDebugLines(object, collisionObjects);
    });
  }

  drawSlopeDebugLines(object, collisionObjects) {
    const canvas = this.slopeDebugCanvas;
    const ctx = this.slopeDebugContext;
    if (!gameInstance.debug || !canvas || !ctx) {
      if (this.slopeDebugCanvas) {
        this.slopeDebugCanvas.style.display = "none";
      }
      return;
    }

    const dpr = window.devicePixelRatio || 1;
    const width = Math.round(window.innerWidth * dpr);
    const height = Math.round(window.innerHeight * dpr);
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    ctx.strokeStyle = "rgba(255, 0, 0, 0.9)";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    collisionObjects.forEach((collisionObject) => {
      const el = collisionObject.element;
      if (!el.classList.contains("slope")) return;
      const rect = el.getBoundingClientRect();
      const sampleCount = Math.max(20, Math.round(rect.width / 8));
      ctx.beginPath();
      let hasPoint = false;
      for (let i = 0; i <= sampleCount; i++) {
        const localX = (rect.width * i) / sampleCount;
        const y = this.getSlopeSurfaceHeight(el, localX);
        if (y == null) continue;
        const x = rect.left + localX;
        const worldY = rect.top + y;
        if (!hasPoint) {
          ctx.moveTo(x, worldY);
          hasPoint = true;
        } else {
          ctx.lineTo(x, worldY);
        }
      }
      if (hasPoint) {
        ctx.stroke();
      }

      if (object?.element) {
        const playerRect = object.element.getBoundingClientRect();
        const centerX = playerRect.left + playerRect.width / 2;
        const localX = centerX - rect.left;
        const surfaceHeight = this.getSlopeSurfaceHeight(el, localX);
        if (surfaceHeight != null) {
          const surfaceY = rect.top + surfaceHeight;
          ctx.beginPath();
          ctx.fillStyle = "#00f7ff";
          ctx.arc(centerX, surfaceY, 4, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    });
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
