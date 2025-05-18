export default class Inventory {
  constructor() {
    this.pickupIDs = []
    this.itemsList = []
    this.syncToInventory()
  }

  // Sync itemsList with localstorage
  syncToLocalStorage() {
    localStorage.setItem('itemsList', JSON.stringify(this.itemsList));
  }

  // Sync localstorage with itemsList
  syncToInventory() {
    // Check if localstorage is empty
    if (localStorage.getItem('itemsList') === null) {
      this.itemsList = []
    } else {
      this.itemsList = JSON.parse(localStorage.getItem('itemsList'))
      for (let i = 0; i < this.itemsList.length; i++) {
        const item = this.itemsList[i]
        this.pickupIDs = this.pickupIDs.concat(item.pickupIDs);
        // Remove duplicate pickupIDs
        this.pickupIDs = [...new Set(this.pickupIDs)];
      }
    }
  }

  // Add item to the inventory
  addItem(item) {
    // Check if item is already in the inventory
    const existingItem = this.itemsList.find(i => i.name === item.name)
    if (existingItem) {
      existingItem.count += item.count
      existingItem.pickupIDs.push(item.pickupID)
    } else {
      const pickupID = item.pickupID
      delete item.pickupID
      item.pickupIDs = [pickupID]
      this.itemsList.push(item)
    }
    // Sync localstorage with itemsList
    this.syncToLocalStorage()
  }
  
  // Remove item from the inventory

  // Check if item is in the inventory

  // Get item by name

  // Get all items from the inventory

  // Get all items from the inventory with a specific tag

  // Get item icon element
  
  // Modify item in the inventory


}

export class InventoryItem {
  constructor(name, pickupID, description, count, iconElement, inspectElement, onclick) {
    // The name of the item
    this.name = name
    // The ID of the item's pickup container
    // We want to use this to track items that shouldnt appear as they have already been picked up
    // We will need to accomodate for stackables so pickupID needs to be an array
    this.pickupID = pickupID
    // The description of the item
    this.description = description
    // The count of the item in the inventory
    this.count = count
    // The element that will be used to display the item in the inventory and in the world
    this.iconElement = iconElement
    // The element that will be used if you want to inspect the item in the inventory
    this.inspectElement = inspectElement
    // The code to be executed when the item is triggered
    this.onclick = onclick
    // Element's HTML classes are used as tags to modify behavior of the item
    // tags for things such as:
    // hat-equipable, hand-equipable (uses interact button in the world),
    // stackable, permanent (for things we want to track even at 0 count like money/keys)

  }
}