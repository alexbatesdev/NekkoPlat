import { debugLog } from './tools.js';
import gameInstance from './game.js';

export default class ToggleManager {
    constructor(element, startOn = false) {
        this.parent_element = element;
        this.on_element = element.querySelector('.on');
        this.on_broadcasts = [];
        this.off_element = element.querySelector('.off');
        this.off_broadcasts = [];
        this.toggledOn = startOn;
        this.initBroadcasts();
        this.syncState();
    }

    initBroadcasts() {
        this.on_element.querySelectorAll('.broadcast').forEach(broadcast => {
            let broadcastChannel = null;
            broadcast.classList.forEach(className => {
                if (className.includes('channel-')) {
                    broadcastChannel = className.split('-')[1];
                }
            })
            this.on_broadcasts.push([broadcastChannel, broadcast.innerHTML]);
            broadcast.style.display = 'none';
        });
        this.off_element.querySelectorAll('.broadcast').forEach(broadcast => {
            let broadcastChannel = null;
            broadcast.classList.forEach(className => {
                if (className.includes('channel-')) {
                    broadcastChannel = className.split('-')[1];
                }
            })
            this.off_broadcasts.push([broadcastChannel, broadcast.innerHTML]);
            broadcast.style.display = 'none';
        });
    }

    toggle() {
        debugLog('Toggled', this.parent_element);
        if (this.toggledOn) {
            this.setToggledOff();
        } else {
            this.setToggledOn();
        }
    }

    syncState() {
        if (this.toggledOn) {
            this.setToggledOn(true);
        } else {
            this.setToggledOff(true);
        }
    }

    setToggledOn(noClick = false) {
        debugLog('Toggled On');
        this.toggledOn = true;
        this.on_element.style.visibility = 'visible';
        this.off_element.style.visibility = 'hidden';
        if (!noClick) this.on_element.click();
        this.on_broadcasts.forEach(broadcast => gameInstance.signalManager.broadcastSignal(broadcast[0], broadcast[1]));
    }
    
    setToggledOff(noClick = false) {
        debugLog('Toggled Off');
        this.toggledOn = false;
        this.on_element.style.visibility = 'hidden';
        this.off_element.style.visibility = 'visible';
        if (!noClick) this.off_element.click();
        this.off_broadcasts.forEach(broadcast => gameInstance.signalManager.broadcastSignal(broadcast[0], broadcast[1]));
    }

    getState() {
        return this.toggledOn;
    }
}

export class MultiStateManager {
    constructor(element, states = {}, startState = null) {
        this.parent_element = element;
        this.states = states;
        this.currentState = null;
        this.setState(startState);
    }

    setState(state) {
        if (this.currentState == state) return;
        this.currentState = state;
        let child_elements = this.parent_element.children;
        for (let i = 0; i < child_elements.length; i++) {
            if (child_elements[i].classList.contains("signal-" + this.currentState)) {
                child_elements[i].style.visibility = 'visible';
            } else {
                child_elements[i].style.visibility = 'hidden';
            }
        }
    }

    getState() {
        return this.currentState;
    }

    syncStateToBroadcast(channel) {
        const state = gameInstance.signalManager.checkBroadcast(channel);
        if (state) {
            this.setState(state);
        }
    }
}