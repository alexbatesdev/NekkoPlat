export default class Inventory {
  constructor() {
    this.itemsList = {}
    // Check localstorage for itemsList 
    // Add them to the itemsList
  }

  // Sync itemsList with localstorage

  // Sync localstorage with itemsList

  // Add item to the inventory
  
  // Remove item from the inventory

  // Check if item is in the inventory

  // Get item by name

  // Get all items from the inventory

  // Get all items from the inventory with a specific tag

  // Get item icon element
  
  // Modify item in the inventory


}

export class InventoryItem {
  constructor() {
    // The name of the item
    this.name
    // The description of the item
    this.description
    // The element that will be used to display the item in the inventory and in the world
    this.iconElement
    // The element that will be used if you want to inspect the item in the inventory
    this.inspectElement
    // The code to be executed when the item is triggered
    this.onclick
    // Element's HTML classes are used as tags to modify behavior of the item
    // tags for things such as:
    // hat-equipable, hand-equipable (uses interact button in the world),
    // broadcast-count (for GUI), permanent (for things we want to track even at 0 count like money/keys)

  }
}