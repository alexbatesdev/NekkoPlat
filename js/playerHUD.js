export default class PlayerHUD {
    constructor(player) {
        this.player = player;
        this.xDisplay = document.getElementById('xPositionDisplay');
        this.yDisplay = document.getElementById('yPositionDisplay');
    }

    update() {
        if (this.xDisplay) {
            this.xDisplay.innerHTML = Math.round(this.player.x + this.player.element.getBoundingClientRect().width / 2);
        }
        if (this.yDisplay) {
            this.yDisplay.innerHTML = Math.round(this.player.y + this.player.element.getBoundingClientRect().height / 2);
        }
    }
}
