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
    this.helperProviders = [];
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
    let item = this.store.getItem(name);
    if (!item) return;

    Object.assign(item, updates);
    item = this._serializeElements(item);
    this.store._updateItem(name, item);
    this.syncToStorage();
  }

  /**
   * Execute an item action by item name.
   * Supplies helper methods (e.g. this.consume()) to onclick scripts.
   * @param {string} name
   * @param {Event} event
   * @returns {boolean}
   */
  useItemByName(name, event) {
    const item = this.getItem(name);
    if (!item || item.count <= 0) return false;
    this.executeItem(item, event);
    return true;
  }

  /**
   * Execute an item action for an item instance.
   * Useful for instant-use world pickups.
   * @param {InventoryItem} item
   * @param {Event} event
   */
  executeItem(item, event) {
    if (!item || typeof item.triggerOnClick !== "function") return;
    const previousName = item.name;
    const helpers = this._buildActionHelpers(item, event);
    item.triggerOnClick(event, helpers);

    // Persist and broadcast any live mutations performed by item scripts.
    // Use the pre-action name as a stable lookup key in case the action renamed the item.
    this.store._updateItem(previousName, item);
    this._rebuildPickupIDs();
    this.syncToStorage();
  }

  /**
   * Register a provider that contributes helper methods for item onclick handlers.
   * Provider signature: ({ service, item, event }) => ({ helperName: fn, ... })
   * @param {Function} provider
   * @returns {Function} unregister callback
   */
  registerHelperProvider(provider) {
    if (typeof provider !== "function") {
      return () => {};
    }

    this.helperProviders.push(provider);

    return () => {
      this.helperProviders = this.helperProviders.filter((p) => p !== provider);
    };
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

  /**
   * Build helper methods that item onclick handlers can use via `this`.
   * @private
   */
  _buildActionHelpers(item, event) {
    const baseHelpers = {
      consume: (count = 1) => this.removeItemByName(item.name, count),
      hasItem: (name) => this.hasItem(name),
      addItem: (newItem) => this.addItem(newItem),
      getItem: (name) => this.getItem(name),
    };

    const externalHelpers = {};
    this.helperProviders.forEach((provider) => {
      try {
        const provided = provider({ service: this, item, event });
        if (provided && typeof provided === "object") {
          Object.assign(externalHelpers, provided);
        }
      } catch (error) {
        console.warn("Inventory helper provider failed:", error);
      }
    });

    return {
      ...baseHelpers,
      ...externalHelpers,
    };
  }
}
