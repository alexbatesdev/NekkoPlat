import gameInstance from "./game.js";
import { LevelObject, Reciever } from "./levelObjects.js";

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
        this.filterReciever = null;
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
        const reciever = this.overlayElement.querySelector('.reciever')
        if (reciever) {
            this.filterReciever = new Reciever(reciever);
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

    update() {
        if (this.followPlayer) this.trackPlayer();
        if (this.filterReciever) this.filterReciever.update();
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

        this.element.scrollTo(
            currentX + (this.targetX - currentX) * this.smoothing,
            currentY + (this.targetY - currentY) * this.smoothing
        );
    }

    snapToPlayer() {
        if (!this.player) return;
        this.followPlayer = false;
        this.element.scrollTo(
            (this.player.x + (this.player.element.getBoundingClientRect().width / 2)) - (this.element.getBoundingClientRect().width - 80) * this.offsetX,
            (this.player.y + (this.player.element.getBoundingClientRect().height / 2)) - (this.element.getBoundingClientRect().height - 80) * this.offsetY
        );
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