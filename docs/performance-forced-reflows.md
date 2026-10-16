# Removing Forced Reflows from the Game Loop

This guide describes a set of optimizations first applied to the "space" page in
`personal-site-backend` and how to apply the same ideas to NekkoPlat. The goal is
to stop the game loop from forcing the browser to recalculate style/layout
multiple times per frame.

## The problem

A Chrome Performance trace shows `Recalculate style` entries flagged
"Forced reflow is a likely performance bottleneck". A forced reflow happens when
JavaScript **writes** something that dirties styles/layout and then **reads** a
layout-dependent value (or performs a layout-dependent write such as setting
`scrollLeft`) in the same frame. The browser must flush pending style and layout
work synchronously instead of batching it.

In the space page the offending sequence, once per simulation tick, was:

1. Write the player's `style.transform`.
2. Set `scrollLeft` / `scrollTop` on the page (needs layout to clamp the value).
3. A `scroll` event fires, and the parallax layers write styles again, then read
   `scrollWidth`, `getBoundingClientRect()` and `computedStyleMap()`.

## The fix in three rules

1. **No layout reads in the frame.** Cache anything measurable (viewport size,
   element sizes, parallax depth) at init and on `resize`.
2. **No native scrolling for the camera.** Keep the camera as plain numbers and
   move the world with one `translate`. This removes scroll events and the
   scroll-clamping layout flush.
3. **One batch of writes per frame.** Compute simulation state first, then write
   all DOM styles together at the end of the `requestAnimationFrame` callback.

## Where NekkoPlat does this today

A scan of `js/` shows the same patterns:

| Location | Pattern |
| --- | --- |
| `camera.js` `trackPlayer()` / `snapToPlayer()` | Reads `scrollLeft`, `scrollTop`, and calls `getBoundingClientRect()` on both the player and the viewport every tick, then `scrollTo()` |
| `camera.js` `positionOverlay()` | Reads `scrollLeft`/`scrollTop` right after `scrollTo()` |
| `camera.js` `update()` | Writes `element.style.overflow` every tick |
| `level.js` `updateParallaxLayers()` | Reads `cameraElement.scrollLeft`/`scrollTop` after the camera scrolled, then each `LevelParallaxLayer.update()` writes `style.transform` |
| `game.js` `update()` | Runs `player.update()`, `level.update()`, `camera.update()` and the parallax update inside the fixed-step `while` loop, so they can run several times per rendered frame |
| `collisionDetector.js`, `levelObjects.js`, `player.js`, `interactionBox.js` | Many `getBoundingClientRect()` calls per tick, interleaved with writes |

## Step 1: Make the camera a plain-number object

Replace scroll-based tracking with stored coordinates. Sketch for `camera.js`:

```js
constructor(...) {
    // ...existing setup...
    this.x = 0;               // camera top-left in world space
    this.y = 0;
    this.measure();
    window.addEventListener('resize', () => this.measure());
}

// Layout reads happen only here (init / resize / room load).
measure() {
    const rect = this.element.getBoundingClientRect();
    this.viewportWidth = rect.width;
    this.viewportHeight = rect.height;
    this.worldWidth = this.worldElement.offsetWidth;
    this.worldHeight = this.worldElement.offsetHeight;
}

trackPlayer() {
    if (!this.player) return;
    // player.width / player.height are cached at spawn (see Step 3)
    this.targetX = this.player.x + this.player.width / 2 - (this.viewportWidth - 80) * this.offsetX;
    this.targetY = this.player.y + this.player.height / 2 - (this.viewportHeight - 80) * this.offsetY;

    this.x += (this.targetX - this.x) * this.smoothing;
    this.y += (this.targetY - this.y) * this.smoothing;
    this.clamp();
}

clamp() {
    this.x = Math.max(0, Math.min(this.x, this.worldWidth - this.viewportWidth));
    this.y = Math.max(0, Math.min(this.y, this.worldHeight - this.viewportHeight));
}
```

`snapToPlayer()` becomes the same calculation assigned directly to `this.x`/`this.y`.

Native `scrollTo` clamps for free; with plain numbers you must clamp yourself, as
`clamp()` does above.

## Step 2: One render call per frame

Add a `render()` method on the camera and call it **once per `requestAnimationFrame`**,
after the fixed-step loop, not inside it:

```js
render() {
    // Move the world instead of scrolling the viewport
    this.worldElement.style.translate = `${-this.x}px ${-this.y}px`;
    // The overlay is viewport-fixed now, so positionOverlay() is no longer needed
    gameInstance.level.updateParallaxLayers(this.x, this.y);
}
```

In `game.js`:

```js
while (this.accumulator >= this.fixedDelta) {
    this.processInput();
    if (!this.paused) {
        this.player.update();
        this.level.update();
        this.camera.update();      // math only, no DOM
    }
    this.accumulator -= this.fixedDelta;
}
this.camera.render();              // all camera-driven DOM writes, once
requestAnimationFrame(this.update.bind(this));
```

Use the `translate` property (not `transform`) on the world element so it does not
clash with anything that uses `transform`. Add `will-change: translate` to it in
`global.css` so it gets its own compositor layer.

Related changes:

- `level.updateParallaxLayers(cameraElement)` should take `(x, y)` numbers rather
  than reading `scrollLeft`/`scrollTop`. `LevelParallaxLayer.update(scrollLeft, scrollTop)`
  already accepts numbers, so its maths does not change.
- Set `overflow: hidden` on the viewport once in CSS/init instead of writing
  `style.overflow` every tick. Only touch it when debug mode toggles.
- The overlay (`#overlay`) was moved with `translate(scrollLeft, scrollTop)` to
  stay pinned to the viewport. If the viewport no longer scrolls, make the
  overlay a sibling of the world (positioned `absolute; inset: 0`) rather than a
  child, and delete `positionOverlay()`.

### Things that scrolling gave you for free

Because NekkoPlat's `#viewport` is also used with `scroll-bar` and debug modes
(`overflow: auto`), decide explicitly what to do there. Options: keep native
scrolling for those modes only (the camera's `render()` is skipped), or drop them
in favour of a debug free-camera driven by the arrow keys.

## Step 3: Cache sizes instead of calling `getBoundingClientRect()`

Anything whose size does not change per frame should be measured once:

- **Player:** store `width`/`height` when the element is created or the player is
  respawned (`player.js` already measures at spawn; keep those values on the
  instance and read them in `camera.js`).
- **Static solids/slopes:** `collisionDetector.js` re-measures every solid every
  tick. Measure them once per room load into an array of
  `{ left, top, right, bottom }` in **world coordinates** (using `offsetLeft`/`offsetTop`
  chains or one measurement pass), then collide against those numbers.
- **Moving objects:** track their world position in JS (as the player already
  does with `x`/`y`) rather than measuring.

Note that `getBoundingClientRect()` returns **viewport** coordinates, which change
when the camera moves. After Step 2 the world is translated instead of scrolled, so
rect comparisons between two world elements remain consistent, but comparisons
against fixed viewport values (such as in `levelObjects.js` lines near the
camera centre) need the camera offset applied. Moving collision to cached world
coordinates avoids the issue entirely and is the larger performance win.

## Step 4: Cache parallax inputs

`levelParallax.js` calls `getComputedStyle()` in its helper functions, but only in
the constructor, which is fine. The per-frame `update()` does string work only.
To trim further:

- Build the transform string once for the case where `scale === 1` and no
  `baseTransform`, and skip layers whose `depthX`/`depthY` are exactly `1`
  (they never move relative to the camera).
- Use the individual `translate` property instead of `transform` when
  `baseTransform` is empty, so it never conflicts with CSS animations.

## Step 5: GPU cost (separate from reflow)

If the trace still shows a busy GPU lane after the reflow fixes:

- Avoid large elements with `filter` (for example `brightness()`); bake the effect
  into the image.
- Avoid huge continuously animated or rotating images.
- Add `will-change: transform` / `translate` only to layers that really move.
  Overusing it increases memory.
- Use integer scaling and `image-rendering: pixelated` for pixel art, and snap
  tiled-background offsets to whole source pixels.

## Verification

1. Record a Performance trace in Chrome DevTools while moving the player.
2. Before: the `Recalculate style` events carry the forced-reflow warning and
   appear inside `camera.update` / `scrollTo`.
3. After: no forced-reflow warnings from `animate` / `update`, and one
   style+layout pass per frame.
4. Regression-check: camera follow smoothing, look-ahead, arrow-key camera offset,
   room transitions, parallax depth, and debug/scroll-bar modes.

## Suggested rollout order

1. Cache sizes and remove `getBoundingClientRect()` from `camera.js` (small, safe).
2. Move `updateParallaxLayers` and the overlay to a single `render()` after the
   fixed-step loop.
3. Switch the camera from `scrollTo` to a translated world.
4. Convert collision measurements to cached world coordinates.
5. GPU clean-up.

Each step is independently shippable and can be profiled on its own.
