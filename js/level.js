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
        this.screens = [];
        this.initScreens();
        this.initScreenGrid();
        if (this.element.classList.contains('dynamic')) {
            this.initScreensDynamicWindowSize();
        } else if (this.element.classList.contains('initial')) {
            this.initScreensInitialWindowSize();
        }
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
    
    initScreenGrid() {
        const classes = this.element.classList;
        let doDefault = true;
        for (let i = 0; i < classes.length; i++) {
            if (classes[i].includes('x')) {
                doDefault = false;
                const gridValues = classes[i].split('x');
                const columns = gridValues[0];
                const rows = gridValues[1];
                this.element.style.display = 'grid';
                this.element.style.position = 'relative';
                this.element.style.gridTemplateColumns = `repeat(${columns}, var(--screen-width))`;
                this.element.style.gridTemplateRows = `repeat(${rows}, var(--screen-height))`;
                if (this.screens.length > columns * rows) {
                    console.error("Screen count exceeds grid dimensions");
                } else if (this.screens.length < columns * rows) {
                    console.warn("Screen count is less than grid dimensions, some grid cells will be empty");
                }
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
        this.screens = Array.from(screenElements).map(screen => new Screen(screen));
    }

    update() {
        this.screens.forEach(screen => {
            screen.update();
        });
    }
}