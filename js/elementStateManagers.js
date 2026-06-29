import { debugLog } from './tools.js';
import gameInstance from './game.js';

export default class ToggleManager {
    constructor(element, startOn = false) {
        this.parent_element = element;
        this.on_element = element.querySelector('.on');
        this.on_broadcasts = [];
        this.off_element = element.querySelector('.off');
        this.off_broadcasts = [];
        this.progressFlag = element.dataset.progressFlag || null;
        const persisted = this.progressFlag
            ? gameInstance.progressState.getState(this.progressFlag, startOn)
            : startOn;
        this.toggledOn = Boolean(persisted);
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
        if (this.progressFlag) {
            gameInstance.progressState.setFlag(this.progressFlag, true);
        }
        this.on_element.style.visibility = 'visible';
        this.off_element.style.visibility = 'hidden';
        if (!noClick) this.on_element.click();
        this.on_broadcasts.forEach(broadcast => gameInstance.signalManager.broadcastSignal(broadcast[0], broadcast[1]));
    }
    
    setToggledOff(noClick = false) {
        debugLog('Toggled Off');
        this.toggledOn = false;
        if (this.progressFlag) {
            gameInstance.progressState.setFlag(this.progressFlag, false);
        }
        this.on_element.style.visibility = 'hidden';
        this.off_element.style.visibility = 'visible';
        if (!noClick) this.off_element.click();
        this.off_broadcasts.forEach(broadcast => gameInstance.signalManager.broadcastSignal(broadcast[0], broadcast[1]));
    }

    getState() {
        return this.toggledOn;
    }

    listenToBroadcast(channel, onSignal = 'on', offSignal = 'off') {
        gameInstance.signalManager.addListener(channel, (signal) => {
            if (signal === onSignal && !this.toggledOn) {
                this.toggledOn = true;
                if (this.progressFlag) {
                    gameInstance.progressState.setFlag(this.progressFlag, true);
                }
                this.on_element.style.visibility = 'visible';
                this.off_element.style.visibility = 'hidden';
            }
            if (signal === offSignal && this.toggledOn) {
                this.toggledOn = false;
                if (this.progressFlag) {
                    gameInstance.progressState.setFlag(this.progressFlag, false);
                }
                this.on_element.style.visibility = 'hidden';
                this.off_element.style.visibility = 'visible';
            }
        });
    }
}

export class MultiStateManager {
    constructor(element, states = {}, startState = null) {
        this.parent_element = element;
        this.progressFlag = element.dataset.progressFlag || null;
        this.states = Array.isArray(states) ? states : Object.keys(states);
        this.currentState = null;

        let initialState = startState;
        if (this.progressFlag) {
            const persisted = gameInstance.progressState.getState(this.progressFlag, null);
            if (persisted !== null && persisted !== undefined) {
                initialState = persisted;
            }
        }

        if (initialState === null || initialState === undefined) {
            initialState = Array.isArray(this.states) && this.states.length > 0 ? this.states[0] : null;
        }

        this.setState(initialState, true);
    }

    setState(state, noPersist = false) {
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

        if (!noPersist && this.progressFlag) {
            gameInstance.progressState.setState(this.progressFlag, state);
        }
    }

    getState() {
        return this.currentState;
    }

    listenToBroadcast(channel) {
        gameInstance.signalManager.addListener(channel, (signal) => {
            if (signal) {
                this.setState(signal);
            }
        });
    }
}