export class Wall {
    constructor(element) {
        this.element = element;
        this.rect = this.element.getBoundingClientRect();
    }

    updateRect() {
        this.rect = this.element.getBoundingClientRect();
    }

    update() {
        this.updateRect();
    }
}