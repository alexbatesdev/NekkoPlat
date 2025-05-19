export default class Inventory {
  constructor() {
    this.pickupIDs = []
    this.itemsList = []
    this.syncToInventory()
    this.HUD = new HUD(this)
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
    item.inspectElement = item.inspectElement.outerHTML
    item.iconElement = item.iconElement.outerHTML
    // Check if item is already in the inventory
    const existingItem = this.itemsList.find(i => i.name === item.name)
    if (existingItem) {
      existingItem.count += item.count
      existingItem.pickupIDs.push(item.pickupID)
      // Remove duplicate pickupIDs
      existingItem.pickupIDs = [...new Set(existingItem.pickupIDs)];
      // Update the HUD count for the item
      this.HUD.updateCountForItem(item.name)
    } else {
      const pickupID = item.pickupID
      delete item.pickupID
      item.pickupIDs = [pickupID]
      this.itemsList.push(item)
      // Update the HUD count for the item
      this.HUD.updateCountForItem(item.name)
      this.HUD.setIcons()
    }
    console.log(this.itemsList)
    // Sync localstorage with itemsList
    this.syncToLocalStorage()
  }
  
  // Remove item from the inventory
  removeItemByName(name, count) {
    const item = this.itemsList.find(i => i.name === name)
    if (item) {
      item.count -= count
      if (item.count <= 0) {
        this.itemsList = this.itemsList.filter(i => i.name !== name)
      }
      // Sync localstorage with itemsList
      this.syncToLocalStorage()
    }
  }
  // Remove item from the inventory by pickupID
  removeItemByPickupID(pickupID) {
    const item = this.itemsList.find(i => i.pickupIDs.includes(pickupID))
    if (item) {
      item.count -= 1
      item.pickupIDs = item.pickupIDs.filter(id => id !== pickupID)
      if (item.count <= 0) {
        this.itemsList = this.itemsList.filter(i => i.name !== item.name)
      }
      // Sync localstorage with itemsList
      this.syncToLocalStorage()
    }
  }

  // Check if item is in the inventory
  hasItem(name) {
    return this.itemsList.some(i => i.name === name)
  }

  // Get item by name
  getItemByName(name) {
    const result = this.itemsList.find(i => i.name === name)
    return result
  }

  // Get all items from the inventory
  getAllItems() {
    return this.itemsList
  }

  // Get Item Icon by name
  getItemIcon(name) {
    const item = this.itemsList.find(i => i.name === name)
    if (item) {
      return item.iconElement
    }
    return null
  }

  // Get all items from the inventory with a specific tag
  
  // Modify item in the inventory
  modifyItem(name, newItem) {
    const item = this.itemsList.find(i => i.name === name)
    if (item) {
      item.name = newItem.name
      item.description = newItem.description
      item.count = newItem.count
      item.inspectElement = newItem.inspectElement.outerHTML
      item.iconElement = newItem.iconElement.outerHTML
      item.onclick = newItem.onclick
      // Sync localstorage with itemsList
      this.syncToLocalStorage()
    }
  }
}

export class InventoryItem {
  constructor(name, pickupID, description, count, iconElement, inspectElement, onclick, tags = []) {
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
    // The element that will be used to display the item in the inventory
    this.iconElement = iconElement
    // The element that will be used if you want to inspect the item in the inventory
    this.inspectElement = inspectElement
    // The code to be executed when the item is triggered
    this.onclick = onclick
    // tags will be used to modify behavior of the item
    this.tags = tags
    // tags for things such as:
    // hat-equipable, hand-equipable (uses interact button in the world),
    // stackable, permanent (for things we want to track even at 0 count like money/keys)

  }

  triggerOnClick() {
    const body = this.onclick.substring(this.onclick.indexOf('{') + 1, this.onclick.lastIndexOf('}')).trim();
    const func = new Function(body);
    func.call(this);
  }
}

export class HUD {
  constructor(player_inventory) {
    this.inventory = player_inventory
    this.HUD = {}
    this.initialize()
  }

  initialize() {
    let elements = document.querySelectorAll('.hud-item')
    let itemsList = []
    let hudElements = {}
    for (let i = 0; i < elements.length; i++) {
      const element = elements[i]
      for (let j = 0; j < element.classList.length; j++) {
        const className = element.classList[j]
        if (className.startsWith('hud-') && className !== 'hud-item') {
          const tag = className.split('-')[1]
          itemsList.push(tag)
        }
        if (className.startsWith('hud-') && className !== 'hud-item') {
          const tag = className.replace('hud-', '')
          hudElements[tag] = element
        }
      }
    }
    for (let i = 0; i < itemsList.length; i++) {
      const item = itemsList[i]
      for (let j = 0; j < Object.keys(hudElements).length; j++) {
        const element = hudElements[Object.keys(hudElements)[j]]
        for (let k = 0; k < element.classList.length; k++) {
          const className = element.classList[k]
          if (className.includes(item)) {
            if (this.HUD[item] === undefined) {
              this.HUD[item] = [element]
            } else {
              this.HUD[item].push(element)
            }

          }
        }
      }
      // clear duplicates from this.HUD[item]
      if (this.HUD[item] !== undefined) {
        this.HUD[item] = [...new Set(this.HUD[item])]
      }
    }
    this.syncCounts()
    this.setIcons()
  }

  setIcons() {
    for (let i = 0; i < Object.keys(this.HUD).length; i++) {
      const item = Object.keys(this.HUD)[i]
      const elements = this.HUD[item]
      for (let j = 0; j < elements.length; j++) {
        const element = elements[j]
        const itemObj = this.inventory.getItemByName(item)
        for (let k = 0; k < element.classList.length; k++) {
          const className = element.classList[k]
          if (className.includes('-icon')) {
            console.log('setting icon for ' + item)
            console.log(itemObj)
            console.log(element)
            if (itemObj) {
              element.innerHTML = itemObj.iconElement
            } else {
              element.innerHTML = ''
            }
          }
        }
      }
    }
  }

  syncCounts() {
    for (let i = 0; i < Object.keys(this.HUD).length; i++) {
      const item = Object.keys(this.HUD)[i]
      const elements = this.HUD[item]
      for (let j = 0; j < elements.length; j++) {
        const element = elements[j]
        const itemObj = this.inventory.getItemByName(item)
        for (let k = 0; k < element.classList.length; k++) {
          const className = element.classList[k]
          if (className.includes('-count')) {
            if (itemObj) {
              element.innerHTML = itemObj.count
            } else {
              element.innerHTML = ''
            }
          }
        }
      }
    }
  }

  updateCountForItem(name) {
    const item = this.inventory.getItemByName(name)
    if (item) {
      for (let i = 0; i < Object.keys(this.HUD).length; i++) {
        const itemName = Object.keys(this.HUD)[i]
        if (itemName === name) {
          const elements = this.HUD[itemName]
          for (let j = 0; j < elements.length; j++) {
            const element = elements[j]
            for (let k = 0; k < element.classList.length; k++) {
              const className = element.classList[k]
              if (className.includes('-count')) {
                element.innerHTML = item.count
              }
            }
          }
        }
      }
    }
  }
}