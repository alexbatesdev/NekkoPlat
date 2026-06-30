/**
 * HUDAdapter
 * UI adapter for in-game HUD display (icon + count).
 * Listens to inventory service for state changes and updates DOM.
 */
import { loadInventoryItemFragment } from "../tools.js";

export class HUDAdapter {
  /**
   * @param {InventoryService} inventoryService
   */
  constructor(inventoryService) {
    this.inventoryService = inventoryService;
    this.hudElements = {}; // Map of itemName -> [elements]
    this.unsubscribe = null;
  }

  /**
   * Initialize HUD adapter
   * Maps DOM elements and subscribes to state changes
   */
  initialize() {
    this.mapHudElements();
    this.syncCounts();
    this.setIcons();

    // Subscribe to inventory changes
    this.unsubscribe = this.inventoryService.subscribe((state) => {
      this.syncCounts();
      this.setIcons();
    });
  }

  /**
   * Map .hud-item elements to item names
   * @private
   */
  mapHudElements() {
    const elements = document.querySelectorAll(".hud-item");
    this.hudElements = {};

    elements.forEach((element) => {
      // Extract item name from class (e.g., hud-shroom-icon -> shroom)
      const classes = Array.from(element.classList);
      const hudClass = classes.find(
        (cls) => cls.startsWith("hud-") && cls !== "hud-item"
      );

      if (!hudClass) return;

      const itemName = hudClass.replace("hud-", "").split("-")[0];

      if (!this.hudElements[itemName]) {
        this.hudElements[itemName] = [];
      }

      // Avoid duplicates
      if (!this.hudElements[itemName].includes(element)) {
        this.hudElements[itemName].push(element);
      }
    });
  }

  /**
   * Sync all count displays
   * @private
   */
  syncCounts() {
    Object.keys(this.hudElements).forEach((itemName) => {
      this._updateCountForItem(itemName);
    });
  }

  /**
   * Set all icons
   * @private
   */
  setIcons() {
    Object.keys(this.hudElements).forEach((itemName) => {
      this._setIconForItem(itemName);
    });
  }

  /**
   * Update count display for a specific item
   * @private
   */
  _updateCountForItem(itemName) {
    const elements = this.hudElements[itemName] || [];
    const item = this.inventoryService.getItem(itemName);
    const count = item ? item.count : 0;

    elements.forEach((element) => {
      const countEl = element.querySelector(".hud-item, [class*='-count']");
      if (countEl || element.classList.contains("hud-item")) {
        const target = countEl || element;
        // Update count for all child elements that have -count class
        const countElements = element.querySelectorAll("[class*='-count']");
        countElements.forEach((el) => {
          el.innerHTML = count;
        });
        // Also check if element itself is a count container
        if (element.classList.toString().includes("-count")) {
          element.innerHTML = count;
        }
      }
    });
  }

  /**
   * Set icon for a specific item
   * @private
   */
  _setIconForItem(itemName) {
    const elements = this.hudElements[itemName] || [];
    const item = this.inventoryService.getItem(itemName);

    elements.forEach((element) => {
      const iconElements = element.querySelectorAll("[class*='-icon']");
      iconElements.forEach((iconEl) => {
        if (item && item.iconElement) {
          iconEl.innerHTML = item.iconElement;
        } else {
          // Load from fragment
          loadInventoryItemFragment(itemName).then(({ iconElement }) => {
            if (iconElement) {
              const clone = iconElement.cloneNode(true);
              iconEl.innerHTML = "";
              iconEl.appendChild(clone);
            } else {
              iconEl.innerHTML = "?";
            }
          });
          iconEl.innerHTML = "";
        }
      });
    });
  }

  /**
   * Cleanup and unsubscribe
   */
  dispose() {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
    this.hudElements = {};
  }
}
