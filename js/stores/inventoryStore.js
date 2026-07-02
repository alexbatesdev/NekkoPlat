/**
 * InventoryStore
 * Pure state machine for inventory data.
 * No persistence, no business logic, no DOM coupling.
 * Emits events when state changes.
 */
export class InventoryStore {
  constructor() {
    this.itemsList = [];
    this.pickupIDs = [];
    this.listeners = [];
  }

  /**
   * Get item by name
   * @param {string} name
   * @returns {Object|null}
   */
  getItem(name) {
    return this.itemsList.find((i) => i.name === name) || null;
  }

  /**
   * Get all items
   * @returns {Array}
   */
  getAllItems() {
    return [...this.itemsList];
  }

  /**
   * Get a page of items
   * @param {number} page
   * @param {number} pageSize
   * @returns {Array}
   */
  getItemsPage(page, pageSize) {
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    return this.itemsList.slice(start, end);
  }

  /**
   * Get item icon by name
   * @param {string} name
   * @returns {string|null}
   */
  getItemIcon(name) {
    const item = this.getItem(name);
    return item ? item.iconElement : null;
  }

  /**
   * Subscribe to state changes
   * @param {Function} listener
   * @returns {Function} unsubscribe
   */
  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  /**
   * Internal: notify listeners of state change
   * @private
   */
  _emit() {
    const state = {
      itemsList: this.getAllItems(),
      pickupIDs: [...this.pickupIDs],
    };
    this.listeners.forEach((listener) => listener(state));
  }

  /**
   * Internal: set state directly (used by InventoryService)
   * @private
   */
  _setItemsList(items) {
    this.itemsList = items;
    this._emit();
  }

  /**
   * Internal: set pickup IDs directly
   * @private
   */
  _setPickupIDs(ids) {
    this.pickupIDs = ids;
    this._emit();
  }

  /**
   * Internal: add item to list
   * @private
   */
  _addItem(item) {
    this.itemsList.push(item);
    this._emit();
  }

  /**
   * Internal: update item in list
   * @private
   */
  _updateItem(name, updates) {
    const item = this.getItem(name);
    if (item) {
      Object.assign(item, updates);
      this._emit();
    }
  }

  /**
   * Internal: remove item from list
   * @private
   */
  _removeItem(name) {
    this.itemsList = this.itemsList.filter((i) => i.name !== name);
    this._emit();
  }

  /**
   * Internal: clear all listeners (for testing/cleanup)
   * @private
   */
  _clearListeners() {
    this.listeners = [];
  }
}
