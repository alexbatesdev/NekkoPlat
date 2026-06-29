export default class ProgressState {
  constructor(storageKey = "gameProgress") {
    this.storageKey = storageKey;
    this.data = this.load();
  }

  load() {
    try {
      return JSON.parse(localStorage.getItem(this.storageKey)) || {
        version: 1,
        flags: {},
        progress: {}
      };
    } catch {
      return { version: 1, flags: {}, progress: {} };
    }
  }

  save() {
    localStorage.setItem(this.storageKey, JSON.stringify(this.data));
  }

  setFlag(key, value = true) {
    this.data.flags[key] = value;
    this.save();
  }

  hasFlag(key) {
    return Boolean(this.data.flags[key]);
  }

  clearFlag(key) {
    delete this.data.flags[key];
    this.save();
  }

  toggleFlag(key) {
    const next = !this.hasFlag(key);
    this.setFlag(key, next);
    return next;
  }

  setState(key, value) {
    this.data.flags[key] = value;
    this.save();
  }

  getState(key, fallback = null) {
    return this.data.flags[key] ?? fallback;
  }

  setProgress(key, value) {
    this.data.progress[key] = value;
    this.save();
  }

  incrementProgress(key, amount = 1) {
    const next = (this.data.progress[key] || 0) + amount;
    this.setProgress(key, next);
    return next;
  }

  hasAll(keys) {
    return keys.every((k) => this.hasFlag(k));
  }

  hasAny(keys) {
    return keys.some((k) => this.hasFlag(k));
  }

  reset(prefix = "") {
    if (!prefix) {
      this.data = { version: 1, flags: {}, progress: {} };
    } else {
      for (const key of Object.keys(this.data.flags)) {
        if (key.startsWith(prefix)) delete this.data.flags[key];
      }
      for (const key of Object.keys(this.data.progress)) {
        if (key.startsWith(prefix)) delete this.data.progress[key];
      }
    }
    this.save();
  }
}