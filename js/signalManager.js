class SignalManager {
    constructor() {
        this.signals = {};
    }

    broadcastSignal(signalName, signal) {
        this.signals[signalName] = signal;
    }

    broadcastSignalForDuration(signalName, signal, duration) {
        this.signals[signalName] = signal;
        setTimeout(() => {
            this.removeSignal(signalName);
        }, duration);
    }

    removeSignal(signalName) {
        this.signals[signalName] = null;
        delete this.signals[signalName];
    }

    checkSignal(signalName) {
        return this.signals[signalName];
    }
}

export default SignalManager;