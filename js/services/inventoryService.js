/**
 * InventoryService
 * Domain logic layer for inventory management.
 * Handles:
 * - Item add/remove/modify with validation
 * - Count clamping and zero-count cleanup
 * - PickupID tracking
 * - Persistence to localStorage
 * - Event propagation from store
 */
import { InventoryStore } from "../stores/inventoryStore.js";
import { InventoryItem } from "./inventoryItem.js";

export class InventoryService {
  /**
   * @param {string} storageKey - localStorage key (default: 'itemsList')
   */
  constructor(storageKey = "itemsList") {
    this.storageKey = storageKey;
    this.store = new InventoryStore();
    this.syncFromStorage();
  }

  /**
   * Load items from localStorage
   * @private
   */
  syncFromStorage() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (!stored) {
        this.store._setItemsList([]);
        this.store._setPickupIDs([]);
        return;
      }

      const items = JSON.parse(stored);
      const normalized = items.map((item) => this._normalizeItem(item));
      this.store._setItemsList(normalized);

      // Rebuild pickupIDs from items
      const pickupIDs = [];
      normalized.forEach((item) => {
        if (Array.isArray(item.pickupIDs)) {
          pickupIDs.push(...item.pickupIDs);
        }
      });
      this.store._setPickupIDs([...new Set(pickupIDs)]);
    } catch (error) {
      console.warn(`Failed to load inventory from ${this.storageKey}:`, error);
      this.store._setItemsList([]);
      this.store._setPickupIDs([]);
    }
  }

  /**
   * Save items to localStorage
   * @private
   */
  syncToStorage() {
    try {
      const items = this.store.getAllItems();
      localStorage.setItem(this.storageKey, JSON.stringify(items));
    } catch (error) {
      console.warn(`Failed to save inventory to ${this.storageKey}:`, error);
    }
  }

  /**
   * Normalize item data into InventoryItem
   * @private
   */
  _normalizeItem(itemData) {
    if (itemData instanceof InventoryItem) {
      return itemData;
    }

    const pickupIDs = Array.isArray(itemData.pickupIDs)
      ? itemData.pickupIDs
      : itemData.pickupID
        ? [itemData.pickupID]
        : [];

    return new InventoryItem(
      itemData.name,
      pickupIDs,
      itemData.description,
      itemData.count,
      itemData.iconElement,
      itemData.inspectElement,
      itemData.onclick,
      itemData.tags || []
    );
  }

  /**
   * Convert DOM elements to HTML strings in item
   * @private
   */
  _serializeElements(item) {
    if (item.iconElement && typeof item.iconElement === "object") {
      item.iconElement = item.iconElement.outerHTML;
    }
    if (item.inspectElement && typeof item.inspectElement === "object") {
      item.inspectElement = item.inspectElement.outerHTML;
    }
    return item;
  }

  /**
   * Add item to inventory
   * Handles stacking and updates pickupIDs
   * @param {InventoryItem|Object} item
   */
  addItem(item) {
    let normalized = this._normalizeItem(item);
    normalized = this._serializeElements(normalized);

    const existing = this.store.getItem(normalized.name);

    if (existing) {
      // Stack: increment count and merge pickupIDs
      existing.count += normalized.count;
      const newPickupIDs = Array.isArray(normalized.pickupIDs)
        ? normalized.pickupIDs
        : normalized.pickupID
          ? [normalized.pickupID]
          : [];
      existing.pickupIDs = [
        ...new Set([...existing.pickupIDs, ...newPickupIDs]),
      ];
      this.store._updateItem(normalized.name, existing);
    } else {
      // New item
      const pickupID = normalized.pickupID;
      delete normalized.pickupID;
      normalized.pickupIDs = Array.isArray(pickupID)
        ? [...pickupID]
        : pickupID
          ? [pickupID]
          : [];
      this.store._addItem(normalized);
    }

    // Update pickupIDs cache
    this._rebuildPickupIDs();
    this.syncToStorage();
  }

  /**
   * Remove item by name
   * Clamps count to 0, removes if count <= 0 (unless tagged permanent)
   * @param {string} name
   * @param {number} count - amount to remove (default: 1)
   */
  removeItemByName(name, count = 1) {
    const item = this.store.getItem(name);
    if (!item) return;

    item.count = Math.max(0, item.count - count);

    // Remove if zero and not permanent
    if (item.count <= 0 && !item.tags.includes("permanent")) {
      this.store._removeItem(name);
    } else {
      this.store._updateItem(name, item);
    }

    this._rebuildPickupIDs();
    this.syncToStorage();
  }

  /**
   * Remove item by pickupID
   * @param {string} pickupID
   */
  removeItemByPickupID(pickupID) {
    const item = this.store.itemsList.find((i) =>
      i.pickupIDs.includes(pickupID)
    );
    if (!item) return;

    item.pickupIDs = item.pickupIDs.filter((id) => id !== pickupID);
    item.count = Math.max(0, item.count - 1);

    // Remove if zero and not permanent
    if (item.count <= 0 && !item.tags.includes("permanent")) {
      this.store._removeItem(item.name);
    } else {
      this.store._updateItem(item.name, item);
    }

    this._rebuildPickupIDs();
    this.syncToStorage();
  }

  /**
   * Check if item exists with count > 0
   * @param {string} name
   * @returns {boolean}
   */
  hasItem(name) {
    const item = this.store.getItem(name);
    return item ? item.count > 0 : false;
  }

  /**
   * Check if a pickupID has been collected
   * @param {string} pickupID
   * @returns {boolean}
   */
  isPickedUp(pickupID) {
    return this.store.pickupIDs.includes(pickupID);
  }

  /**
   * Get item by name
   * @param {string} name
   * @returns {Object|null}
   */
  getItem(name) {
    return this.store.getItem(name);
  }

  /**
   * Get all items
   * @returns {Array}
   */
  getAllItems() {
    return this.store.getAllItems();
  }

  /**
   * Get paged items
   * @param {number} page
   * @param {number} pageSize
   * @returns {Array}
   */
  getItemsPage(page, pageSize) {
    return this.store.getItemsPage(page, pageSize);
  }

  /**
   * Get item icon by name
   * @param {string} name
   * @returns {string|null}
   */
  getItemIcon(name) {
    return this.store.getItemIcon(name);
  }

  /**
   * Modify item properties
   * @param {string} name
   * @param {Object} updates
   */
  modifyItem(name, updates) {
    const item = this.store.getItem(name);
    if (!item) return;

    Object.assign(item, updates);
    item = this._serializeElements(item);
    this.store._updateItem(name, item);
    this.syncToStorage();
  }

  /**
   * Subscribe to state changes
   * @param {Function} listener
   * @returns {Function} unsubscribe
   */
  subscribe(listener) {
    return this.store.subscribe(listener);
  }

  /**
   * Rebuild pickupIDs from current items
   * @private
   */
  _rebuildPickupIDs() {
    const pickupIDs = [];
    this.store.itemsList.forEach((item) => {
      if (Array.isArray(item.pickupIDs)) {
        pickupIDs.push(...item.pickupIDs);
      }
    });
    this.store._setPickupIDs([...new Set(pickupIDs)]);
  }
}
