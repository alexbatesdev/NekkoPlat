import { debugLog } from './tools.js';

export default class ToggleManager {
    constructor(element, startOn = false) {
        this.parent_element = element;
        this.on_element = element.querySelector('.on');
        this.off_element = element.querySelector('.off');
        this.toggledOn = startOn;
    }

    toggle() {
        debugLog('Toggled', this.parent_element);
        if (this.toggledOn) {
            this.toggledOn = false;
            this.on_element.style.visibility = 'hidden';
            this.off_element.style.visibility = 'visible';
            this.on_element.click();
        } else {
            this.toggledOn = true;
            this.on_element.style.visibility = 'visible';
            this.off_element.style.visibility = 'hidden';
            this.off_element.click();
        }
    }

    setToggledOn() {
        this.toggledOn = true;
    }

    setToggledOff() {
        this.toggledOn = false;
    }

    getState() {
        return this.toggledOn;
    }
}

export class MultiStateManager {
    constructor(element, states = {}, startState = -1) {
        this.parent_element = element;
        this.states = states;
        this.currentState = startState;
    }

    setState(state) {
        this.currentState = state;
        let child_elements = this.parent_element.children;
        for (let i = 0; i < child_elements.length; i++) {
            if (child_elements[i].classList.contains(this.currentState)) {
                child_elements[i].style.visibility = 'visible';
            } else {
                child_elements[i].style.visibility = 'hidden';
            }
        }
    }

    getState() {
        return this.currentState;
    }
}