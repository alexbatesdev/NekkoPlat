import gameInstance from "./game.js";

export default class Camera {
    constructor() {
        this.element = document.getElementById('viewport');
        this.targetX = 0;
        this.targetY = 0;
        this.smoothing = 0.1;
        this.restingOffsetX = 0.5;
        this.restingOffsetY = 0.8;
        this.offsetX = 0.5;
        this.offsetY = 0.5;
        this.maxOffset = 0.8;
        this.minOffset = 0.2;
        this.lookahead = 0.1;
    }

    update() {
        this.trackPlayer();
        this.processInput();
        this.applyMaxOffset();
    }

    trackPlayer() {
        let currentX = this.element.scrollLeft;
        let currentY = this.element.scrollTop;

        this.targetX = (gameInstance.player.x + (gameInstance.player.element.getBoundingClientRect().width / 2)) - (this.element.getBoundingClientRect().width - 80) * this.offsetX;
        this.targetY = (gameInstance.player.y + (gameInstance.player.element.getBoundingClientRect().height / 2)) - (this.element.getBoundingClientRect().height - 80) * this.offsetY;

        this.element.scrollTo(
            currentX + (this.targetX - currentX) * this.smoothing,
            currentY + (this.targetY - currentY) * this.smoothing
        );
    }

    processInput() {
        if (gameInstance.keyState['ARROWUP']) {
            this.offsetY += 0.01;
        }
        if (gameInstance.keyState['ARROWDOWN']) {
            this.offsetY -= 0.01;
        }
        if (gameInstance.keyState['ARROWLEFT']) {
            this.offsetX += 0.01;
        }
        if (gameInstance.keyState['ARROWRIGHT']) {
            this.offsetX -= 0.01;
        }

        if (!gameInstance.keyState['ARROWUP'] && !gameInstance.keyState['ARROWDOWN'] && !gameInstance.keyState['ARROWLEFT'] && !gameInstance.keyState['ARROWRIGHT']) {
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
        if (this.offsetX != (this.restingOffsetX + (gameInstance.player.facingRight() ? -this.lookahead : this.lookahead))) {
            if (this.offsetX > (this.restingOffsetX + (gameInstance.player.facingRight() ? -this.lookahead : this.lookahead))) {
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