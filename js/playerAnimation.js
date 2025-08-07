import gameInstance from "./game.js";

export default class PlayerAnimation {
    constructor(player, animationManager) {
        this.player = player;
        this.animationManager = animationManager;
    }

    update() {
        if (Math.abs(this.player.velocityX) > 0 && gameInstance.keyState['SHIFT']) {
            this.animationManager.changeAnimation('run');
        } else if (Math.abs(this.player.velocityX) > 0 && (gameInstance.keyState['A'] || gameInstance.keyState['D'])) {
            this.animationManager.changeAnimation('walk');
        } else if (this.player.grounded) {
            this.animationManager.changeAnimation('idle');
        } else {
            this.animationManager.changeAnimation('jump');
        }
    }

    lookRight() {
        this.player.element.style.transform = 'rotateY(180deg)';
        if (this.player.interactionBox.interactionIndicatorElement) {
            this.player.interactionBox.interactionIndicatorElement.style.transform = "translate(-50%, -100%) rotateY(180deg)";
        }
    }

    lookLeft() {
        this.player.element.style.transform = 'rotateY(0deg)';
        if (this.player.interactionBox.interactionIndicatorElement) {
            this.player.interactionBox.interactionIndicatorElement.style.transform = "translate(-50%, -100%) rotateY(0deg)";
        }
    }

    facingRight() {
        return this.player.element.style.transform === 'rotateY(180deg)';
    }
}
