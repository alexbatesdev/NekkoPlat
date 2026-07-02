import { debugLog } from './tools.js';
import gameInstance from './game.js';
import { executeOnclickWithContext, getOnclickHandlerFromElement } from './onclickExecutor.js';

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

    toggle(event) {
        debugLog('Toggled', this.parent_element);
        if (this.toggledOn) {
            this.setToggledOff(false, event);
        } else {
            this.setToggledOn(false, event);
        }
    }

    syncState() {
        if (this.toggledOn) {
            this.setToggledOn(true);
        } else {
            this.setToggledOff(true);
        }
    }

    buildOnclickHelpers(event, additionalHelpers = {}) {
        return {
            manager: this,
            parentElement: this.parent_element,
            onElement: this.on_element,
            offElement: this.off_element,
            game: gameInstance,
            player: gameInstance.player,
            level: gameInstance.level,
            camera: gameInstance.camera,
            window,
            document,
            globalThis,
            location,
            toggle: (nextEvent = event) => this.toggle(nextEvent),
            setOn: (nextEvent = event) => this.setToggledOn(false, nextEvent),
            setOff: (nextEvent = event) => this.setToggledOff(false, nextEvent),
            getState: () => this.getState(),
            broadcastSignal: (channel, signal) => gameInstance.signalManager.broadcastSignal(channel, signal),
            event,
            ...additionalHelpers,
        };
    }

    executeElementOnclick(element, event, helpers = {}) {
        const onclick = getOnclickHandlerFromElement(element);
        if (!onclick) return false;

        return executeOnclickWithContext({
            onclick,
            event,
            thisArg: this,
            helpers: this.buildOnclickHelpers(event, helpers),
            errorLabel: `onclick for toggle element ${element?.id || element?.className || 'unknown'}`,
        });
    }

    setToggledOn(noClick = false, event) {
        debugLog('Toggled On');
        this.toggledOn = true;
        this.on_element.style.visibility = 'visible';
        this.off_element.style.visibility = 'hidden';
        if (!noClick) this.executeElementOnclick(this.on_element, event, { toggledOn: true });
        this.on_broadcasts.forEach(broadcast => gameInstance.signalManager.broadcastSignal(broadcast[0], broadcast[1]));
    }
    
    setToggledOff(noClick = false, event) {
        debugLog('Toggled Off');
        this.toggledOn = false;
        this.on_element.style.visibility = 'hidden';
        this.off_element.style.visibility = 'visible';
        if (!noClick) this.executeElementOnclick(this.off_element, event, { toggledOn: false });
        this.off_broadcasts.forEach(broadcast => gameInstance.signalManager.broadcastSignal(broadcast[0], broadcast[1]));
    }

    getState() {
        return this.toggledOn;
    }

    listenToBroadcast(channel, onSignal = 'on', offSignal = 'off') {
        gameInstance.signalManager.addListener(channel, (signal) => {
            if (signal === onSignal && !this.toggledOn) {
                this.toggledOn = true;
                this.on_element.style.visibility = 'visible';
                this.off_element.style.visibility = 'hidden';
            }
            if (signal === offSignal && this.toggledOn) {
                this.toggledOn = false;
                this.on_element.style.visibility = 'hidden';
                this.off_element.style.visibility = 'visible';
            }
        });
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

    listenToBroadcast(channel) {
        gameInstance.signalManager.addListener(channel, (signal) => {
            if (signal) {
                this.setState(signal);
            }
        });
    }
}