/**
 * InventoryItem
 * Data class representing a single inventory item.
 * No direct inventory reference; consumed via service.
 */
import { executeOnclickWithContext } from "../onclickExecutor.js";

export class InventoryItem {
  constructor(
    name,
    pickupID,
    description,
    count,
    iconElement,
    inspectElement,
    onclick,
    tags = []
  ) {
    this.name = name;
    // pickupID can be a string or array; normalize to array
    this.pickupID = Array.isArray(pickupID) ? pickupID[0] : pickupID;
    this.pickupIDs = Array.isArray(pickupID)
      ? [...pickupID]
      : pickupID
        ? [pickupID]
        : [];
    this.description = description;
    this.count = count;
    this.iconElement = iconElement;
    this.inspectElement = inspectElement;
    this.onclick = onclick;
    this.tags = tags;
  }

  /**
   * Trigger onclick handler
   * @param {Event} event - optional event to pass to handler
   */
  triggerOnClick(event, helpers = {}) {
    if (!this.onclick) {
      console.warn(`No onclick function body found for item: ${this.name}`);
      return;
    }
    executeOnclickWithContext({
      onclick: this.onclick,
      event,
      thisArg: this,
      helpers,
      errorLabel: `onclick for item ${this.name}`,
    });
  }
}
