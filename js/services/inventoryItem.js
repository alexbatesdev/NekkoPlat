/**
 * InventoryItem
 * Data class representing a single inventory item.
 * No direct inventory reference; consumed via service.
 */
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

    const body = this.onclick
      .substring(this.onclick.indexOf("{") + 1, this.onclick.lastIndexOf("}"))
      .trim();

    if (!body) {
      console.warn(`No onclick function body found for item: ${this.name}`);
      return;
    }

    const helperKeys = Object.keys(helpers);
    const previousValues = new Map();

    try {
      // Inject helpers directly on the item so onclick scripts can both:
      // 1) call helper methods like this.consume()
      // 2) mutate the live item instance (e.g. this.description = "...")
      helperKeys.forEach((key) => {
        if (Object.prototype.hasOwnProperty.call(this, key)) {
          previousValues.set(key, this[key]);
        }
        this[key] = helpers[key];
      });

      const func = new Function("event", body);
      func.call(this, event);
    } catch (error) {
      console.error(`Error executing onclick for item ${this.name}:`, error);
    } finally {
      // Restore or remove injected helpers so they do not permanently pollute item state.
      helperKeys.forEach((key) => {
        if (previousValues.has(key)) {
          this[key] = previousValues.get(key);
        } else {
          delete this[key];
        }
      });
    }
  }
}
