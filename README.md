# NekkoPlat

A browser-based platformer engine built with plain JavaScript, HTML and CSS. Levels are authored directly in markup and the engine handles physics, collision, camera tracking and interaction logic.

## Getting Started

1. Include the engine script and styles in your HTML. `global.css` is required — it holds structural rules the engine's JS depends on (viewport sizing, object positioning, etc.). `platformer.css` is this project's own visual theme for levels/objects (stone textures, backgrounds, etc.); you can swap it for your own stylesheet as long as you cover the same object/solid classes your level uses. See `examples/minimal-import/` for a level that supplies its own minimal theme instead of `platformer.css`.

```html
<link rel="stylesheet" href="css/global.css">
<link rel="stylesheet" href="css/platformer.css">
<script type="module" src="js/platformer.js" defer></script>
```

2. Provide the minimal HTML structure:

```html
<div id="viewport">
  <div class="level grid-1x1" id="level-one">
    <div class="screen">
      <div id="player">
        <div id="interactionBox"></div>
      </div>
    </div>
  </div>
</div>
```

3. Open the page in a modern browser. Use `WASD` to move, `Shift` to sprint, `Space/W` to jump and `E` to interact. `R` respawns at the current checkpoint. `ESC` pauses the game, `3` toggles debug mode, and arrow keys adjust camera framing.

## Configuration

The player element (size, sprites, interaction indicator, `#interactionBox`, and `.config` physics parameters) can be configured in two ways:

1. **External HTML Player Template**:
   Keep the player's full HTML markup in an external HTML file (e.g., `html/player.html` or `html/player_cat.html`) and point `#player` to it via `src` or `data-src`:
   ```html
   <div id="player" src="../../html/player.html"></div>
   ```

2. **Inline Player HTML**:
   Embed the player's markup directly in the level HTML:
   ```html
   <div class="cat" id="player">
     <div class="interaction-indicator question-indicator">?</div>
     <div id="interactionBox"></div>
     <span class="config">
       <span class="maxVelocity">10</span>
       <span class="sprintMaxVelocity">18</span>
       <span class="acceleration">1</span>
       <span class="sprintAcceleration">2</span>
       <span class="maxAirJumps">1</span>
       <span class="gravity">0.9</span>
       <span class="fallingGravity">3</span>
       <span class="preJumpAllowance">10</span>
       <span class="jumpForce">25</span>
       <span class="coyoteTime">100</span>
     </span>
   </div>
   ```

3. **Zero Configuration**:
   Omit the config block entirely and the engine will automatically supply standard default platformer physics!

* Grid dimensions are defined on `.level` via `grid-colsxrows` or vanilla CSS layout rules.
* Grid layout origin and wrap order are driven directly by vanilla CSS rendering:
  * Default: Standard CSS Grid flowing top-left to bottom-right.
  * `grid-bottom-left` or `wrap-up`: Uses `flex-wrap: wrap-reverse` to wrap screens upward starting from the bottom-left.
  * Custom CSS: You can also use standard CSS Grid rules (`grid-template-areas`, `grid-row`/`grid-column`, `:nth-child()`, or flexbox) in your level stylesheet. The engine automatically calculates screen coordinates `(x, y)` based on where CSS renders each `.screen` element in the DOM.
* Add `dynamic` or `initial` on `.level` to control how `--screen-width`/`--screen-height` are initialized (`dynamic` updates on resize).
* Out-of-bounds behavior is controlled by classes on the `.level` element such as `contain`, `respawn` or `wrap` with optional direction suffixes (e.g. `wrap-vert`).
* Level-wide decorative parallax can be authored as direct children of `.level` using `.parallax-layer`; these layers persist across all screens and are updated from camera scroll instead of screen ownership.
* Player spawn can be set via URL fragment target IDs (for example `#door-1`), which aligns with normal DOM anchor-style syntax.
* Filters and camera behavior are controlled with classes on `#viewport` (e.g. `no-follow`, `scroll-bar`).

Example level-wide parallax layer:

```html
<div class="level contain grid-3x1" id="level-one">
  <div class="parallax-layer grassland-skyline z-6 noplax-y" data-plax-scale="1.08"></div>
  <div class="screen">...</div>
</div>
```

Authoring notes:
- Negative `z-*` values behave like distant backgrounds and move more slowly than the world.
- Positive `z-*` values can be used for foreground decorative layers that move faster than the world.
- Use `data-plax-depth`, `data-plax-depth-x`, or `data-plax-depth-y` to override the z-derived depth when needed.
- Use `data-plax-scale` for optional scale, `data-plax-offset-x` / `data-plax-offset-y` for static offsets, and `noplax-x` / `noplax-y` to lock an axis.

## Module Overview

### `platformer.js`
Entry point that instantiates the game on `DOMContentLoaded`. It locates `#player`, creates `Player`, creates `Level` with the hardcoded id `level-one`, registers both on `gameInstance`, and starts the game loop. Exposes `teleportCheat` and `game` on `window`; `player` is also exposed once `Player` is constructed.

### `game.js`
Central controller. Maintains debug and pause modes, the `Camera`, active `Player` and `Level`, and a `BroadcastManager` for in-game signals. Uses `InputManager` action bindings (`move`, `jump`, `interact`, `respawn`, `camera` offsets, etc.) and runs a fixed-step update loop.

### `player.js`
Handles player physics, input, collisions, animation and interaction logic. Reads configuration from the embedded `.config` element and manages an `InteractionBox` and `GifAnimationManager`.

Spawn resolution order:
- If the URL includes a hash target (for example `./grassland.html#door-1`), the player spawns at the center of that element.
- If there is no hash target, player spawn falls back to CSS variables `--player-spawn-x` and `--player-spawn-y`.

Also wires inventory runtime dependencies:
- `InventoryService` for inventory state and item actions
- `HUDAdapter` for HUD icon/count rendering
- `InventoryMenuAdapter` for pause menu rendering

### `level.js`
Represents the level grid. Discovers `.screen` elements, wraps them as `Screen` objects, configures grid dimensions from `grid-CxR`, and initializes screen sizing variables (`--screen-width`, `--screen-height`) based on `initial`/`dynamic` classes. It stores per-side out-of-bounds policy that collision handling applies at runtime.

Also discovers level-wide `.parallax-layer` children, moves them under an internal `.level-parallax-root`, and updates them separately from screen-local objects.

### `screen.js`
Represents a single screen within the level. Collects solid objects, interactables, receivers and screen-local parallax props, registers nearby solids/interactables with the player and updates objects when the player is present.

### `levelParallax.js`
Level-wide decorative parallax runtime. Interprets `z-index` or `z-*` classes as the default depth control, then converts camera scroll into stable layer transforms without requiring layers to live inside `.screen` elements.

### `levelObjects.js`
Defines in‑level object types:
- `LevelObject`: base class with enable/disable logic and optional parallax support.
- `SolidObject`: impassable geometry.
- `MovingPlatform`: follows CSS transform motion and carries the grounded player by transform delta.
- `SaggingPlatform`: applies configurable downward sag while the player is standing on it.
- `TriggerArea`: runs its `onclick` when the player enters.
- `InteractableObject` and `InteractableToggle`: elements that react to player interaction and can broadcast signals.
- `Receiver`: shows different child elements based on received signals.
- `ItemPickup`: builds `InventoryItem` data from item fragments and adds or executes item actions.
- `Slope`: ramp geometry. Combine classes `object`, `solid` and `slope` and set `data-slope` to `up-right`, `up-left`, `down-right` or `down-left`.
- `Slope` also supports `data-slope-equation` (`y=...`) and optional `data-slope-role="ceiling"` for ceiling collisions.
- `OneWaySolid`: blocks movement from one side. Use classes `object solid oneway-DIR` where `DIR` is `up`, `down`, `left` or `right`. Add `dropthrough` to an `oneway-up` element to allow falling through by holding `S` and pressing a jump key; each platform maintains its own drop timer.
- `CameraZone`: constrains the camera's scroll position to its own bounds while the player overlaps it, and releases automatically the instant the player leaves. See [Camera Zones](#camera-zones) below.

Example sloped surface:

```html
<div class="object solid slope" data-slope="up-right"
     style="width:200px;height:200px;clip-path:polygon(0% 100%,100% 100%,100% 0%);"></div>
```

Example one-way platform:

```html
<div class="object solid oneway-up" style="width:100px;height:20px;"></div>
```

Example drop-through platform:

```html
<div class="object solid oneway-up dropthrough" style="width:100px;height:20px;"></div>
```

Example toggle/receiver pair:

```html
<div class="object interactable toggle">
  <div class="on"><span class="broadcast channel-door">open</span></div>
  <div class="off"><span class="broadcast channel-door">close</span></div>
</div>
<div class="object receiver">
  <span class="broadcast channel-door"></span>
  <div class="signal-open">Door is open</div>
  <div class="signal-close">Door is closed</div>
</div>
```

### `stores/inventoryStore.js`
Pure inventory state container. Stores `itemsList` and `pickupIDs`, exposes query methods, and emits state-change events to subscribers.

### `services/inventoryService.js`
Domain/service layer for inventory logic:
- add/remove/modify item operations
- localStorage sync (`itemsList`)
- pickup tracking (`isPickedUp`)
- item action execution (`useItemByName`, `executeItem`)
- helper-provider extension system (`registerHelperProvider`)

### `services/inventoryItem.js`
Data model for inventory entries and dynamic onclick execution.

Item onclick scripts run with `this` bound to the live item instance, so scripts can mutate item state directly.

### `adapters/hudAdapter.js`
Event-driven HUD adapter that renders icon/count displays for `.hud-item` targets and falls back to fragment icon loading when needed.

### `adapters/inventoryMenuAdapter.js`
Event-driven pause-menu adapter that renders inventory rows and wires use/inspect interactions.

### `camera.js`
Controls the viewport. Follows the player with smoothing and lookahead, allows offset adjustment with arrow keys, manages overlay elements and display filters via the `Filter` helper class. Also supports optional scroll-position bounds (`setBounds`/`resetBounds`) used by `CameraZone` objects to constrain camera movement; bounds are clamped on the follow *target* rather than the eased result, so entering/leaving a bounds zone eases in smoothly instead of snapping. See [Camera Zones](#camera-zones).

### `collisionDetector.js`
Performs collision checks between the player and level objects, handles trigger activation, applies side-specific out-of-bounds effects from the level config, and resolves both AABB solids and slope surfaces.

### `physics.js`
Applies gravity, friction and acceleration limits. Provides a `move` method used by `Player` to adjust velocity.

### `interactionBox.js`
Tracks nearby interactable objects relative to the player. When the player presses `E`, it calls `interact()` on any overlapping interactables and shows an indicator while in range.

Idea 🐢: Make the interaction only happen with 1 interactable in range, then add a button to cycle through them. Only show the interaction indicator over the currently selected interactable.

### `broadcastManager.js`
Pub/sub signal system. Stores channel -> signal mappings and supports channel listeners (`addListener`/`removeListener`) so state managers can react to broadcasts immediately.

### `elementStateManagers.js`
`ToggleManager` swaps visibility of `.on`/`.off` elements and issues broadcasts. `MultiStateManager` selects a child matching a broadcast signal from a channel.

### `gifAnimationManager.js`
Utility for toggling GIF animations inside an `animation-container` by class name.

### `hexBackground.js`
Utility to align and animate hex‑pattern backgrounds. Call `syncBackgrounds()` to position `.hexBackground` elements and update on window resize.

### `tools.js`
Collection of helpers for geometry (`intersects`, `getCollisionOverlap`), logging (`debugLog`), class list checks and transform manipulation.

Also includes `loadInventoryItemFragment(itemName)` for loading item fragment data from `/items/*.html`.

## Camera Zones

`camera-zone` objects constrain the camera's scroll position to their own bounds while the player overlaps them, and release automatically the instant the player leaves — the camera then eases back to normal player-following rather than snapping.

```html
<div class="object camera-zone" style="left: 0; top: 0; width: 1200px; height: 800px;"></div>
```

- Add `no-constrain-x` to only lock vertical scroll, or `no-constrain-y` to only lock horizontal scroll.
- If a zone is smaller than the camera viewport on a given axis, that axis' bounds collapse to a single value and the camera holds still centered on the zone for that axis instead of jittering.
- Bounds are re-applied every frame the player overlaps the zone and reset each frame before level objects run, so leaving all zones releases the camera on the very next frame.
- Zones are drawn with a cyan debug outline when debug mode (`3`) is toggled on, like other level objects.
- Overlapping zones combine by intersection rather than whichever ran last: each zone narrows the allowed range, so a smaller zone nested inside a bigger one tightens the camera further while the player's inside it, and reverts to the outer zone's framing on the way out. If two zones genuinely share no overlapping range, a console warning fires (in debug mode) instead of silently locking the camera to an arbitrary point.

A common pattern is locking a level's camera Y position per "floor" in a multi-row level, while leaving a vertical shaft column free of any zone so the camera can still follow the player between floors:

```html
<!-- Solid ground on either side of a shaft: lock Y, leave X free -->
<div class="object camera-zone no-constrain-x" style="left: 0; top: 0; width: 150px; height: 100%;"></div>
<div class="object camera-zone no-constrain-x" style="left: 350px; top: 0; width: calc(100% - 350px); height: 100%;"></div>
<!-- The 150px-350px gap has no camera-zone at all, so the camera scrolls freely there -->
```

See `examples/minimal-camera-zone/` for a single locked room, `examples/minimal-camera-zone-floors/` for a 2x2 grid demonstrating per-floor Y locking with a shaft that stays free to scroll between floors, and `examples/minimal-camera-zone-overlap/` for a nested "focus area" zone that further tightens the camera's framing within a larger room zone.

## Inventory Helper Providers

The inventory action system supports helper injection through `InventoryService.registerHelperProvider`.

Use this when you want item scripts (the `onclick` body in item fragments) to access helpers from other modules without hard-coupling those modules to `InventoryItem`.

Provider signature:

```js
({ service, item, event }) => ({
  helperName: (...args) => {
    // custom behavior
  },
})
```

Example:

```js
const unregister = player.inventory.registerHelperProvider(
  ({ service, item, event }) => ({
    healPlayer: (amount = 1) => {
      service.removeItemByName(item.name, 1);
      // call into your health system here
    },
  }),
);

// Later if needed:
unregister();
```

Built-in helpers available in item onclick scripts:
- `this.consume(count = 1)`
- `this.hasItem(name)`
- `this.addItem(item)`
- `this.getItem(name)`

Note: helper methods are injected for the duration of action execution and then removed, while direct item mutations (for example `this.description = "..."`) persist.

## Onclick Context Runtime

NekkoPlat now routes dynamic onclick execution through a shared runtime in `js/onclickExecutor.js`.

What this gives you:
- Full browser-global access inside onclick scripts (`window`, `document`, `globalThis`, `location`, etc.).
- A helper-rich `this` context based on the object type that triggered the onclick.
- Temporary helper injection: helpers are attached only while the onclick runs, then restored/removed.

Why helper restore exists:
- Prevents temporary helpers from leaking into persistent object state.
- Prevents accidental long-term property collisions after a click.
- Keeps object mutations explicit: only properties your script intentionally sets on the object remain.


### Authoring Onclick Scripts

Use regular inline onclick scripts in your HTML fragments and level markup.

Example: trigger that disables itself after broadcasting a signal

```html
<div class="object trigger" onclick="{
  this.broadcastSignal('door', 'open');
  this.disableOnce();
}"></div>
```

Example: interactable door navigation with fragment-based spawn target

```html
<div class="door object interactable" onclick="window.location.href='./hub.html#door-1'"></div>
```

Example: inventory item onclick from item fragment

```html
<div onclick="{
  if (this.hasItem('key')) {
    this.consume(1);
    this.description = 'Used key';
  }
}">
  ...
</div>
```

### Practical Rules

- Prefer helper methods for game actions (`this.broadcastSignal`, `this.consume`, `this.setOn`, etc.).
- Keep using browser globals when needed (`window.location`, `document.querySelector`, timers, fetch).
- If a helper name overlaps an existing property, the original value is restored after onclick returns.
- If you intentionally mutate object state (for example `this.description = ...` on inventory items), that mutation persists.

## Dependencies
The engine uses no external build tools or packages and runs entirely in the browser. A modern browser with ES module support is required.

## Known Limitations
- Collision is still discrete/step-based and can allow tunneling at very high speeds.
- `platformer.js` currently initializes `Level` with the hardcoded id `level-one`.
- APIs are unstable and subject to change as the project evolves.

## TODO Notes (7/1/2026)
- `js/camera.js`: replace the current `followPlayer` boolean approach with a camera mode system (follow player, pinned/manual coordinates, follow another element).
- `js/collisionDetector.js`: optimize trigger collision checks by avoiding full-list scans when only trigger objects need to be evaluated.
- `js/levelObjects.js`: add a configurable cooldown for `TriggerArea` so repeatable triggers do not fire multiple times in one frame.
- `js/gifAnimationManager.js`: add a sprite-sheet animation manager as an alternative to GIF-only animation switching.
- `README.md` (`interactionBox.js` idea note): interaction currently triggers all interactables in range; proposed improvement is single-target interaction with cycling and focused indicator display.

### Turtle Notes (🐢)
- `js/camera.js`: `// TODO: 🐢💭` note in camera follow logic.
- `js/collisionDetector.js`: `// 🐢💭` note in trigger collision handling.
- `js/levelObjects.js`: `// TODO: 🐢<(I am the TODO TURTLE)` note near trigger-area behavior.
- `README.md` (`interactionBox.js` idea note): `Idea 🐢` proposes single-target interaction with cycling and a focused indicator.

