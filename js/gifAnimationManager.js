// GifAnimationManager.js
export default class GifAnimationManager {
    constructor(animationElement) {
        this.animationElement = animationElement;
        this.currentAnimation = '';
        this.initStyles();
    }

    initStyles() {
        this.animationElement.style.position = "absolute";
        this.animationElement.style.top = 0;
        this.animationElement.style.left = 0;
        this.animationElement.style.width = "100%";
        this.animationElement.style.height = "100%";
        this.animationElement.style.zIndex = 1;

        let animations = this.animationElement.children;
        Array.from(animations).forEach(animation => {
            animation.style.display = 'none';
            animation.style.position = "absolute";
            animation.style.top = 0;
            animation.style.left = 0;
            animation.style.width = "100%";
            animation.style.height = "100%";
            animation.style.zIndex = 1;
        });
    }

    changeAnimation(animationName) {
        if (this.currentAnimation === animationName) return;
        this.currentAnimation = animationName;
        this.setGifAnimation(animationName);
    }

    setGifAnimation(animationName) {
        for (let i = 0; i < this.animationElement.children.length; i++) {
            const child = this.animationElement.children[i];
            if (child.classList.contains(animationName)) {
                child.style.display = 'block';
            } else {
                child.style.display = 'none';
            }
        }
    }
}

// TODO: A spritesheet animation manager
