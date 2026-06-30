/**
 * InventoryMenuAdapter
 * UI adapter for pause menu inventory display.
 * Listens to inventory service and renders menu on state changes.
 */
import gameInstance from "../game.js";

export class InventoryMenuAdapter {
  /**
   * @param {InventoryService} inventoryService
   */
  constructor(inventoryService) {
    this.inventoryService = inventoryService;
    this.unsubscribe = null;
    this.inventoryMenuElement = null;
    this.itemListElement = null;
    this.itemListPatternElement = null;
  }

  /**
   * Initialize menu adapter
   * Caches DOM elements and subscribes to state changes
   */
  initialize() {
    this.inventoryMenuElement = document.getElementById("inventory-menu");
    if (!this.inventoryMenuElement) {
      console.warn("No #inventory-menu element found");
      return;
    }

    this.itemListElement = this.inventoryMenuElement.querySelector(".item-list");
    this.itemListPatternElement =
      this.inventoryMenuElement.querySelector(".list-pattern");

    if (!this.itemListElement || !this.itemListPatternElement) {
      console.warn("Inventory menu structure incomplete");
      return;
    }

    // Subscribe to changes
    this.unsubscribe = this.inventoryService.subscribe((state) => {
      this.syncMenu();
    });
  }

  /**
   * Sync menu with current inventory state
   */
  syncMenu() {
    if (!this.inventoryMenuElement) return;

    const itemList = this.itemListElement;
    const pattern = this.itemListPatternElement;
    const template = pattern.querySelector(".item-wrapper");

    if (!template) {
      console.warn("No .item-wrapper template found in inventory menu");
      return;
    }

    // Clear and reset
    itemList.innerHTML = "";
    itemList.appendChild(pattern);

    // Hide pattern unless debug
    if (!gameInstance.debug) {
      pattern.style.display = "none";
    }

    // Render only items with count > 0
    const items = this.inventoryService
      .getAllItems()
      .filter((item) => item.count > 0);

    items.forEach((item) => {
      const itemElement = template.cloneNode(true);
      this._populateItemElement(itemElement, item);
      this._attachItemHandlers(itemElement, item);
      itemList.appendChild(itemElement);
    });
  }

  /**
   * Fill in item data into a cloned template element
   * @private
   */
  _populateItemElement(itemElement, item) {
    const iconEl = itemElement.querySelector(".item-icon");
    const nameEl = itemElement.querySelector(".item-name");
    const countEl = itemElement.querySelector(".item-count");
    const descEl = itemElement.querySelector(".item-description");

    if (iconEl && item.iconElement) {
      iconEl.innerHTML = item.iconElement;
      iconEl.title = item.description || "No description";
    }

    if (nameEl) {
      nameEl.innerHTML = item.name;
      nameEl.title = item.description || "No description";
    }

    if (countEl) {
      countEl.innerHTML = item.count;
      countEl.title = `Count: ${item.count}`;
    }

    if (descEl) {
      descEl.innerHTML = item.description || "No description available";
    }
  }

  /**
   * Attach use and inspect button handlers
   * @private
   */
  _attachItemHandlers(itemElement, item) {
    const useButton = itemElement.querySelector(".use-button");
    const inspectButton = itemElement.querySelector(".inspect-button");

    if (useButton) {
      useButton.onclick = (event) => {
        if (item.count > 0) {
          this.inventoryService.useItemByName(item.name, event);
        } else {
          alert("You don't have any of this item to use.");
        }
      };
    } else {
      // If no use button, attach to entire element
      itemElement.onclick = (event) => {
        if (item.count > 0) {
          this.inventoryService.useItemByName(item.name, event);
        } else {
          alert("You don't have any of this item to use.");
        }
      };
    }

    if (inspectButton) {
      if (item.count > 0) {
        inspectButton.onclick = () => {
          this._showInspectWindow(item);
        };
      } else {
        inspectButton.onclick = () => {
          alert("You don't have any of this item to inspect.");
        };
      }
    }
  }

  /**
   * Show inspect window overlay
   * @private
   */
  _showInspectWindow(item) {
    const inspectWindow = document.createElement("div");
    inspectWindow.className = "inspect-window";
    inspectWindow.innerHTML = item.inspectElement;
    inspectWindow.title = "click to close";
    document.body.appendChild(inspectWindow);

    const closeHandler = (event) => {
      if (event.key === "Escape") {
        this._closeInspectWindow(inspectWindow, closeHandler);
      }
    };

    inspectWindow.onclick = (event) => {
      if (event.target === inspectWindow) {
        this._closeInspectWindow(inspectWindow, closeHandler);
      }
    };

    document.addEventListener("keydown", closeHandler);
  }

  /**
   * Close inspect window
   * @private
   */
  _closeInspectWindow(window, closeHandler) {
    if (document.body.contains(window)) {
      document.body.removeChild(window);
    }
    document.removeEventListener("keydown", closeHandler);
  }

  /**
   * Cleanup and unsubscribe
   */
  dispose() {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
  }
}
