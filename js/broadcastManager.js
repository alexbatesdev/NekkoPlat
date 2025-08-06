class BroadcastManager {
    constructor() {
        this.broadcasts = {};
    }

    broadcastSignal(channel, signal) {
        this.broadcasts[channel] = signal;
    }

    broadcastSignalForDuration(channel, signal, duration) {
        this.broadcasts[channel] = signal;
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
}

export default BroadcastManager;