import gameInstance from "./game.js";
import { Receiver } from "./levelObjects.js";

export default class Camera {
    constructor(player = null, keyState = null, debugProvider = () => false) {
        this.element = document.getElementById('viewport');
        this.overlayElement = document.getElementById('overlay');
        if (!this.overlayElement) {
            this.overlayElement = document.createElement('div');
            this.overlayElement.id = 'overlay';
        }
        this.element.appendChild(this.overlayElement);
        this.filters = [];
        this.filterReceiver = null;
        this.initFilters();
        this.targetX = 0;
        this.targetY = 0;
        this.smoothing = 0.1;
        // Should make this configurable via HTML
        this.restingOffsetX = 0.5;
        this.restingOffsetY = 0.6;
        this.offsetX = this.restingOffsetX;
        this.offsetY = this.restingOffsetY;
        this.followPlayer = true;
        if (this.element.classList.contains('no-follow')) this.followPlayer = false;
        if (this.element.classList.contains('scroll-bar')) this.element.style.overflow = 'auto';
        else this.element.style.overflow = 'hidden';
        this.offsetBounds = 0;
        this.maxOffset = 1 - this.offsetBounds;
        this.minOffset = this.offsetBounds;
        this.lookahead = 0.05;
        // Scroll-space constraints (in px), set by camera zones. Null axis = unconstrained.
        this.bounds = null;
        this.initStyles();

        // References to game dependencies
        this.player = player;
        this.keyState = keyState;
        this.debugProvider = debugProvider;
    }

    positionOverlay() {
        this.overlayElement.style.transform = `translate(${this.element.scrollLeft}px, ${this.element.scrollTop}px)`;
    }

    initStyles() {
        this.overlayElement.style.zIndex = '5';
        this.overlayElement.style.width = '100%';
        this.overlayElement.style.height = '100%';
        this.overlayElement.style.position = 'absolute';
        this.overlayElement.style.top = '0';
        this.overlayElement.style.left = '0';
        this.overlayElement.style.pointerEvents = 'none';

    }

   initFilters() {
        this.overlayElement.querySelectorAll('.filter').forEach(filter => {
            this.filters.push(new Filter(filter));
        });
        const receiver = this.overlayElement.querySelector('.receiver')
        if (receiver) {
            this.filterReceiver = new Receiver(receiver);
        }

    }

    setPlayer(player) {
        this.player = player;
    }

    setInput(keyState) {
        this.keyState = keyState;
    }

    setDebugProvider(debugProvider) {
        this.debugProvider = debugProvider;
    }

    // Narrows in any provided axis bounds (in scroll px) toward their intersection with
    // whatever's already set this frame, so overlapping zones combine deterministically
    // instead of the last zone to run simply overwriting the others. Pass undefined to
    // leave an axis untouched. A zone narrower than the camera viewport reports its min/max
    // reversed (its own "collapse to center" quirk), so each pair is normalized before merging.
    setBounds({ minX, maxX, minY, maxY } = {}) {
        if (!this.bounds) this.bounds = { minX: null, maxX: null, minY: null, maxY: null };
        if (minX !== undefined && maxX !== undefined) {
            const lo = Math.min(minX, maxX);
            const hi = Math.max(minX, maxX);
            this.bounds.minX = this.bounds.minX == null ? lo : Math.max(this.bounds.minX, lo);
            this.bounds.maxX = this.bounds.maxX == null ? hi : Math.min(this.bounds.maxX, hi);
        }
        if (minY !== undefined && maxY !== undefined) {
            const lo = Math.min(minY, maxY);
            const hi = Math.max(minY, maxY);
            this.bounds.minY = this.bounds.minY == null ? lo : Math.max(this.bounds.minY, lo);
            this.bounds.maxY = this.bounds.maxY == null ? hi : Math.min(this.bounds.maxY, hi);
        }
        this.warnIfBoundsConflict();
    }

    // If two overlapping zones disagree so hard there's no valid range left, surface that
    // instead of silently collapsing the camera to a single point.
    warnIfBoundsConflict() {
        if (!gameInstance.debug) return;
        if (this.bounds.minX != null && this.bounds.maxX != null && this.bounds.minX > this.bounds.maxX) {
            console.warn("Camera zones conflict on the X axis: active zones share no overlapping range.");
        }
        if (this.bounds.minY != null && this.bounds.maxY != null && this.bounds.minY > this.bounds.maxY) {
            console.warn("Camera zones conflict on the Y axis: active zones share no overlapping range.");
        }
    }

    // Called once per frame before level objects run, so zones can re-apply bounds while active.
    resetBounds() {
        this.bounds = null;
    }

    clampScrollPosition(x, y) {
        if (!this.bounds) return { x, y };
        let clampedX = x;
        let clampedY = y;
        if (this.bounds.minX != null && this.bounds.maxX != null) {
            const min = Math.min(this.bounds.minX, this.bounds.maxX);
            const max = Math.max(this.bounds.minX, this.bounds.maxX);
            clampedX = Math.min(Math.max(x, min), max);
        }
        if (this.bounds.minY != null && this.bounds.maxY != null) {
            const min = Math.min(this.bounds.minY, this.bounds.maxY);
            const max = Math.max(this.bounds.minY, this.bounds.maxY);
            clampedY = Math.min(Math.max(y, min), max);
        }
        return { x: clampedX, y: clampedY };
    }

    update() {
        // TODO: 🐢💭
        // I'm thinking instead of a "following player" boolean
        // there should be a "mode" enum
        // Modes:
        // 1. Follow Player
        // 2. Pinned to coordinates/manual control
        // 3. Follow another element
        if (this.followPlayer) this.trackPlayer();
        if (this.filterReceiver) this.filterReceiver.update();
        this.processInput();
        this.applyMaxOffset();
        this.positionOverlay();
        if (this.debugProvider && this.debugProvider()) this.element.style.overflow = "auto";
        else {
            if (this.element.classList.contains('scroll-bar')) this.element.style.overflow = 'auto';
            else this.element.style.overflow = 'hidden';
        }
    }

    trackPlayer() {
        if (!this.player) return;
        let currentX = this.element.scrollLeft;
        let currentY = this.element.scrollTop;
        this.targetX = (this.player.x + (this.player.element.getBoundingClientRect().width / 2)) - (this.element.getBoundingClientRect().width - 80) * this.offsetX;
        this.targetY = (this.player.y + (this.player.element.getBoundingClientRect().height / 2)) - (this.element.getBoundingClientRect().height - 80) * this.offsetY;

        // Clamp the target (not the eased result) so entering/leaving a bounded zone eases
        // toward the boundary via the normal smoothing instead of snapping instantly.
        const clampedTarget = this.clampScrollPosition(this.targetX, this.targetY);

        this.element.scrollTo(
            currentX + (clampedTarget.x - currentX) * this.smoothing,
            currentY + (clampedTarget.y - currentY) * this.smoothing
        );
    }

    snapToPlayer() {
        if (!this.player) return;
        this.followPlayer = false;
        const next = this.clampScrollPosition(
            (this.player.x + (this.player.element.getBoundingClientRect().width / 2)) - (this.element.getBoundingClientRect().width - 80) * this.offsetX,
            (this.player.y + (this.player.element.getBoundingClientRect().height / 2)) - (this.element.getBoundingClientRect().height - 80) * this.offsetY
        );
        this.element.scrollTo(next.x, next.y);
        this.followPlayer = true;
    }

    processInput() {
        if (!gameInstance.inputManager) return;
        if (gameInstance.inputManager.isActionActive('cameraUp')) {
            this.offsetY += 0.01;
        }
        if (gameInstance.inputManager.isActionActive('cameraDown')) {
            this.offsetY -= 0.01;
        }
        if (gameInstance.inputManager.isActionActive('cameraLeft')) {
            this.offsetX += 0.01;
        }
        if (gameInstance.inputManager.isActionActive('cameraRight')) {
            this.offsetX -= 0.01;
        }

        if (
            !gameInstance.inputManager.isActionActive('cameraUp') &&
            !gameInstance.inputManager.isActionActive('cameraDown') &&
            !gameInstance.inputManager.isActionActive('cameraLeft') &&
            !gameInstance.inputManager.isActionActive('cameraRight')
        ) {
            this.applyCenterDrift();
        }
    }

    applyMaxOffset() {
        if (this.offsetX > this.maxOffset) this.offsetX = this.maxOffset;
        if (this.offsetX < this.minOffset) this.offsetX = this.minOffset;
        if (this.offsetY > this.maxOffset) this.offsetY = this.maxOffset;
        if (this.offsetY < this.minOffset) this.offsetY = this.minOffset;
    }

    applyCenterDrift() {
        if (!this.player) return;
        if (this.offsetX != (this.restingOffsetX + (this.player.facingRight() ? -this.lookahead : this.lookahead))) {
            if (this.offsetX > (this.restingOffsetX + (this.player.facingRight() ? -this.lookahead : this.lookahead))) {
                this.offsetX -= 0.01;
            } else {
                this.offsetX += 0.01;
            }
        }

        if (this.offsetY != this.restingOffsetY) {
            if (this.offsetY > this.restingOffsetY) {
                this.offsetY -= 0.01;
            } else {
                this.offsetY += 0.01;
            }
        }
    }
}

export class Filter {
    constructor(element) {
        this.element = element;
        this.initStyles();
    }

    initStyles() {
        this.element.style.position = 'absolute';
        this.element.style.top = '0';
        this.element.style.left = '0';
        this.element.style.width = '100%';
        this.element.style.height = '100%';
        this.element.style.pointerEvents = 'none';
        this.element.style.zIndex = -1;
    }
}