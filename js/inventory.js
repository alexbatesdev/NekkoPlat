export default class Inventory {
  constructor() {
    this.pickupIDs = [];
    this.itemsList = [];
    this.syncToInventory();
    this.eventTarget = new EventTarget();
  }

  on(eventName, listener) {
    this.eventTarget.addEventListener(eventName, listener);
  }

  off(eventName, listener) {
    this.eventTarget.removeEventListener(eventName, listener);
  }

  emit(eventName, detail) {
    this.eventTarget.dispatchEvent(new CustomEvent(eventName, { detail }));
  }

  // Sync itemsList with localstorage
  syncToLocalStorage() {
    localStorage.setItem("itemsList", JSON.stringify(this.itemsList));
  }

  // Sync localstorage with itemsList
  syncToInventory() {
    // Check if localstorage is empty
    if (localStorage.getItem("itemsList") === null) {
      this.itemsList = [];
    } else {
      this.itemsList = JSON.parse(localStorage.getItem("itemsList"));
      for (let i = 0; i < this.itemsList.length; i++) {
        const item = this.itemsList[i];
        this.pickupIDs = this.pickupIDs.concat(item.pickupIDs);
        // Remove duplicate pickupIDs
        this.pickupIDs = [...new Set(this.pickupIDs)];
      }
    }
  }

  // Add item to the inventory
  addItem(item) {
    // Check if item is already in the inventory
    const existingItem = this.itemsList.find((i) => i.name === item.name);
    if (existingItem) {
      existingItem.count += item.count;
      existingItem.pickupIDs.push(item.pickupID);
      // Remove duplicate pickupIDs
      existingItem.pickupIDs = [...new Set(existingItem.pickupIDs)];
      this.emit('itemAdded', { item: existingItem });
    } else {
      const pickupID = item.pickupID;
      delete item.pickupID;
      item.pickupIDs = [pickupID];
      this.itemsList.push(item);
      this.emit('itemAdded', { item });
    }
    console.log(this.itemsList);
    // Sync localstorage with itemsList
    this.syncToLocalStorage();
  }

  // Remove item from the inventory
  removeItemByName(name, count) {
    const item = this.itemsList.find((i) => i.name === name);
    if (item) {
      item.count -= count;
      if (item.count <= 0) {
        this.itemsList = this.itemsList.filter((i) => i.name !== name);
      }
      // Sync localstorage with itemsList
      this.syncToLocalStorage();
      this.emit('itemRemoved', { item });
    }
  }
  // Remove item from the inventory by pickupID
  removeItemByPickupID(pickupID) {
    const item = this.itemsList.find((i) => i.pickupIDs.includes(pickupID));
    if (item) {
      item.count -= 1;
      item.pickupIDs = item.pickupIDs.filter((id) => id !== pickupID);
      if (item.count <= 0) {
        this.itemsList = this.itemsList.filter((i) => i.name !== item.name);
      }
      // Sync localstorage with itemsList
      this.syncToLocalStorage();
      this.emit('itemRemoved', { item });
    }
  }

  // Check if item is in the inventory
  hasItem(name) {
    return this.itemsList.some((i) => i.name === name);
  }

  // Get item by name
  getItemByName(name) {
    const result = this.itemsList.find((i) => i.name === name);
    return result;
  }

  // Get all items from the inventory
  getAllItems() {
    return this.itemsList;
  }

  // Get a page of items from the inventory
  getItemsPage(page, pageSize) {
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    return this.itemsList.slice(start, end);
  }

  // Get Item Icon by name
  getItemIcon(name) {
    const item = this.itemsList.find((i) => i.name === name);
    if (item) {
      const template = document.getElementById(item.templateId);
      if (template) {
        const icon = template.content.querySelector('.iconElement');
        return icon ? icon.outerHTML : null;
      }
    }
    return null;
  }

  // Get all items from the inventory with a specific tag

  // Modify item in the inventory
  modifyItem(name, newItem) {
    const item = this.itemsList.find((i) => i.name === name);
    if (item) {
      item.name = newItem.name;
      item.description = newItem.description;
      item.count = newItem.count;
      item.templateId = newItem.templateId;
      item.onclick = newItem.onclick;
      // Sync localstorage with itemsList
      this.syncToLocalStorage();
      this.emit('itemModified', { item });
    }
  }
}

export class InventoryItem {
  constructor(
    name,
    pickupID,
    description,
    count,
    templateId,
    onclick,
    tags = []
  ) {
    // The name of the item
    this.name = name;
    // The ID of the item's pickup container
    // We want to use this to track items that shouldnt appear as they have already been picked up
    // We will need to accomodate for stackables so pickupID needs to be an array
    this.pickupID = pickupID;
    // The description of the item
    this.description = description;
    // The count of the item in the inventory
    this.count = count;
    // Reference to the template defining the item's markup
    this.templateId = templateId;
    // The code to be executed when the item is triggered
    this.onclick = onclick;
    // tags will be used to modify behavior of the item
    this.tags = tags;
    // tags for things such as:
    // hat-equipable, hand-equipable (uses interact button in the world),
    // stackable, permanent (for things we want to track even at 0 count like money/keys)
  }

  triggerOnClick() {
    const body = this.onclick
      .substring(this.onclick.indexOf("{") + 1, this.onclick.lastIndexOf("}"))
      .trim();
    const func = new Function(body);
    func.call(this);
  }
}
