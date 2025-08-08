class BroadcastManager {
    constructor() {
        this.broadcasts = {};
        this.listeners = {};
    }

    broadcastSignal(channel, signal) {
        this.broadcasts[channel] = signal;
        if (this.listeners[channel]) {
            this.listeners[channel].forEach(callback => callback(signal));
        }
    }

    broadcastSignalForDuration(channel, signal, duration) {
        this.broadcastSignal(channel, signal);
        setTimeout(() => {
            this.stopBroadcast(channel);
        }, duration);
    }

    stopBroadcast(channel) {
        delete this.broadcasts[channel];
    }

    checkBroadcast(channel) {
        return this.broadcasts[channel];
    }

    addListener(channel, callback) {
        if (!this.listeners[channel]) {
            this.listeners[channel] = new Set();
        }
        this.listeners[channel].add(callback);
    }

    removeListener(channel, callback) {
        if (this.listeners[channel]) {
            this.listeners[channel].delete(callback);
        }
    }
}

export default BroadcastManager;