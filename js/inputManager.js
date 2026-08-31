class InputManager {
    constructor(actionBindings = {}) {
        this.activeKeys = new Map();
        this.actionBindings = new Map();
        this.subscribers = {
            keydown: new Set(),
            keyup: new Set(),
        };

        for (const [action, codes] of Object.entries(actionBindings)) {
            this.bindAction(action, codes);
        }

        document.addEventListener('keydown', (event) => {
            this.activeKeys.set(event.code, true);
            this._notify('keydown', event);
        });

        document.addEventListener('keyup', (event) => {
            this.activeKeys.set(event.code, false);
            this._notify('keyup', event);
        });
    }

    bindAction(action, codes) {
        if (!Array.isArray(codes)) codes = [codes];
        this.actionBindings.set(action, new Set(codes));
    }

    addKeyToAction(action, code) {
        const set = this.actionBindings.get(action) || new Set();
        set.add(code);
        this.actionBindings.set(action, set);
    }

    removeKeyFromAction(action, code) {
        const set = this.actionBindings.get(action);
        if (set) {
            set.delete(code);
        }
    }

    _notify(type, event) {
        if (!this.subscribers[type]) return;
        this.subscribers[type].forEach((callback) => callback(event));
    }

    isKeyActive(code) {
        return this.activeKeys.get(code) || false;
    }

    isActionActive(action) {
        const codes = this.actionBindings.get(action);
        if (!codes) return false;
        for (const code of codes) {
            if (this.isKeyActive(code)) return true;
        }
        return false;
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
