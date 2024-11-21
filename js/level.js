import Screen from './screen.js';

export default class Level {
    constructor(element_id) {
        this.element = null;
        if (element_id) {
            this.element = document.getElementById(element_id);
        } else {
            let temp_element = document.getElementsByClassName('level')[0]
            if (temp_element) {
                this.element = temp_element;
            } else {
                console.error("No level element found in the document");
                return;
            }
        }
        this.rows = 1;
        this.columns = 1;
        this.screens = [];
        this.initScreenGrid();
        this.initScreens();
        this.checkScreenCount();
        if (this.element.classList.contains('dynamic')) {
            this.initScreensDynamicWindowSize();
        } else if (this.element.classList.contains('initial')) {
            this.initScreensInitialWindowSize();
        }
        this.outOfBoundEffect = {
            top: null,
            right: null,
            bottom: null,
            left: null
        };
        this.initOutOfBoundEffects();
    }

    initOutOfBoundEffects() {
        const validEffects = ['contain', 'respawn', 'wrap'];
        this.element.classList.forEach(className => {
            validEffects.forEach(effect => {
                if (className.includes(effect)) {
                    if (className.includes("-")) {
                        if (className.split("-")[1] == "vert") {
                            this.outOfBoundEffect.top = effect;
                            this.outOfBoundEffect.bottom = effect;
                        } else if (className.split("-")[1] == "hori") {
                            this.outOfBoundEffect.left = effect;
                            this.outOfBoundEffect.right = effect;
                        } else {
                            this.outOfBoundEffect[className.split("-")[1]] = effect;
                        }
                    } else {
                        this.outOfBoundEffect.top = effect;
                        this.outOfBoundEffect.right = effect;
                        this.outOfBoundEffect.bottom = effect;
                        this.outOfBoundEffect.left = effect;
                    }
                }
            });
        });
    }

    initScreensInitialWindowSize() {
        document.documentElement.style.setProperty('--screen-width', window.innerWidth + 'px');
        document.documentElement.style.setProperty('--screen-height', window.innerHeight + 'px');
    }

    initScreensDynamicWindowSize() {
        this.initScreensInitialWindowSize();
        window.addEventListener('resize', () => {
            document.documentElement.style.setProperty('--screen-width', window.innerWidth + 'px');
            document.documentElement.style.setProperty('--screen-height', window.innerHeight + 'px');
        });
    }

    checkScreenCount() {
        if (this.screens.length > this.columns * this.rows) {
            console.error("Screen count exceeds grid dimensions");
        } else if (this.screens.length < this.columns * this.rows) {
            console.warn("Screen count is less than grid dimensions, some grid cells will be empty");
        }
    }

    initScreenGrid() {
        const classes = this.element.classList;
        let doDefault = true;
        for (let i = 0; i < classes.length; i++) {
            // This needs to be more nuanced, as it will match any class with an x in it 🐢💭
            if (classes[i].includes('x')) {
                doDefault = false;
                const gridValues = classes[i].split('x');
                this.columns = gridValues[0];
                this.rows = gridValues[1];
                this.element.style.display = 'grid';
                this.element.style.position = 'relative';
                this.element.style.gridTemplateColumns = `repeat(${this.columns}, var(--screen-width))`;
                this.element.style.gridTemplateRows = `repeat(${this.rows}, var(--screen-height))`;
                this.element.style.width = "max-content";
            }
        }
        if (doDefault) {
            console.warn("No grid dimensions specified, using linear grid layout");
            this.element.style.gridTemplateColumns = `repeat(${this.screens.length}, var(--screen-width))`;
            this.element.style.gridTemplateRows = `var(--screen-height)`;
        }
    }

    initScreens() {
        // Grab all of the screen elements
        const screenElements = document.querySelectorAll('.screen');
        let index = 0;
        this.screens = Array.from(screenElements).map(screen => {
            let column = index % this.columns;
            let row = Math.floor(index / this.columns);
            index++;
            return new Screen(this, screen, column, row)
        });
    }

    reinitStyles() {
        this.screens.forEach(screen => {
            screen.initStyles();
        });
    }

    update() {
        this.screens.forEach(screen => {
            screen.update();
        });
    }

    getScreen(x, y) {
        return this.screens.find(screen => screen.x === x && screen.y === y);
    }
}