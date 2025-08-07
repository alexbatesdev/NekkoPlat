class InputManager {
    constructor() {
        this.activeKeys = new Map();
        this.subscribers = {
            keydown: new Set(),
            keyup: new Set(),
        };

        document.addEventListener('keydown', (event) => {
            this.activeKeys.set(event.code, true);
            this._notify('keydown', event);
        });

        document.addEventListener('keyup', (event) => {
            this.activeKeys.set(event.code, false);
            this._notify('keyup', event);
        });
    }

    _notify(type, event) {
        if (!this.subscribers[type]) return;
        this.subscribers[type].forEach((callback) => callback(event));
    }

    isKeyActive(code) {
        return this.activeKeys.get(code) || false;
    }

    subscribe(type, callback) {
        if (!this.subscribers[type]) return;
        this.subscribers[type].add(callback);
    }

    unsubscribe(type, callback) {
        if (!this.subscribers[type]) return;
        this.subscribers[type].delete(callback);
    }
}

export default InputManager;
