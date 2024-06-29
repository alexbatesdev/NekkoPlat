# NekkoPlat

This is a simple platformer engine(?) that I'm making for fun. It's not really a game, but more of a tool to make games. It's written in Javascript, with the intent that you can make levels and games with no to minimal javascript! Not only that, but it should be easy to convert most webpages into a level for this engine.

This project has evolved from a project for fun, to a project for fun and practice! I've rewritten everything to be more modular/object oriented to make continued development easier!

## How to get started

1. hotlink to or download the javascript file
2. Create bare minimum tags in your html file
The following tags are required:
- #viewport
- .level.#x# (where # is the width and height of the level in tiles respectively)
- .screen
- #player
The player must be a child of the screen, and the screen must be a child of the level, and the level must be a child of the viewport.
- #viewport > .level > .screen > #player
3. Place .object.solid elements around the level to create walls
5. Profit!

## Lets explain some objects

### Player

```html
<div id="player">
</div>
```

The player is the object that the user controls. It is the element with the ID of `player`. The player object has a lot of configurable properties, such as speed, jump height, gravity, and more! If the config is left blank, the player will use these default values:
```html
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
```
To set your own config values simply put this snippet inside the player tag and change the values to your liking.

To customize the player's size, simply set the width and height of the player element with css. To customize the player's appearance add the following snippet to the player tag (but filled in with your animations):
```html
<div class="animation-container gif">
    <img class="idle" src="./img/cat_stand.gif" alt="A cat standing there menacingly">
    <img class="walk" src="./img/cat_walk.gif" alt="A cat walking">
    <img class="run" src="./img/cat_run.gif" alt="A cat running">
    <img class="jump" src="./img/cat_jump.gif" alt="A cat jumping">
    <img class="wait" src="./img/cat_fall_asleep.gif" alt="A cat falling asleep">
</div>
```

These image elements are hidden and shown as needed to animate the player. The player will automatically switch between these animations based on its state. 

The final piece of player customization is the player's interaction box and indicator. The interaction box is the area that the player can interact with objects in. The indicator is the element that appears over the player when they are in range of an interactable object. To enable the interaction box and indicator, add the following snippet to the player tag:
```html
<div class="interaction-indicator question-indicator">?</div>
<div id="interactionBox"></div>
```

Customize the interaction box with css. The interaction indicator is a simple element that appears over the player when they are in range of an interactable object. The interaction indicator itself can be customized with css, but the easiest way to make your own indicator would be to leave it alone and apply styles to a tag inside the indicator.

### Object

```html
<div class="object"></div>
```

An object is any entity or obstacle in the level that the player can interact with in some way. This includes solid walls, as well as interactable buttons and anything that might require javascript to make work. Objects are positioned with standard css, usually position absolute. They must be children of a .screen element. 

### Solid

```html
<div id="solidObject_1" class="object solid"></div>
```

This is the most basic object. It is a wall that the player cannot pass through. It is created by giving an element the class `object` and `solid`. The solid object is positioned with standard css, usually position absolute like this:
```css
#solidObject_1 {
    position: absolute;
    width: 100%;
    height: 32px;
    bottom: 0;
    left: 0;
    background-color: black;
}
```

This would make a black floor that covers the entire width of the screen.

### Screen

```html
<div class="screen"></div>
```

Screens are the containers that hold the player and objects in the level. They are elements within the level element that have the class `screen`. The screens are positioned via a grid system. The grid dimensions are determined by the level element. The screen's width and height can be set with css, or using 1 of 2 classes on the level element.

### Level

```html
<div class="level #x#"></div>
```

The level element is the container that holds the screens in the level. It is any element with the class `level`. The level displays the screens in a grid system, the dimensions of which are determined by a class on the level object. It must be placed within the viewport element The class should be in the format of `#x#`, where the first number is the width of the level in screens, and the second number is the height of the level in screens. 

The level element can also take the class `initial` to set all screens to be the same size as the viewport when the game starts, this means resizing the page will not resize the screens. The level element can also take the class `dynamic` to set all screens to be the same size as the viewport at all times, this means resizing the page will resize the screens.

Lastly, the level element can be configured to interact with the player in various ways if the players tries to leave the bounds of the level. There are 4 ways to interact with the player, `contain`, `wrap`, `respawn` and to just ignore them. The default behavior is to ignore the player and let them leave the level. To change this behavior, add a class containing the desired behavior, and the side of the level that the behavior should be applied to. For example: `wrap-hori` will wrap the player around the x axis of the level, `contain-vert` will contain the player within the y axis of the level. To get more specific you can replace x or y with a direction, like `wrap-left` or `contain-bottom`, and to apply the behavior to all sides of the level, just omit the direction, like `respawn`.

### Viewport

```html
<div class="tv" id="viewport"></div>
```

The viewport is the container that holds the level. It is the element with the ID of `viewport`. It's the window that you see the level through. It's the first element that you should create in your html file, and it's what allows the screen to scroll and follow the player. The viewport can be given the class `no-follow` to prevent the screen from following the player. The ciewport can also be given the class `scroll-bar` to add scroll bars to the viewport for debugging purposes.

### Interactable

```html
<div class="object interactable"></div>
```

An interactable object is an object that the player can interact with in some way. Passing over it will cause the pleyers interaction indicator to appear, and pressing the interact key will cause the object to do something. Interactable objects are created by giving an element the class `object` and `interactable`. The interactable object is positioned with standard css, usually position absolute. An interactable object with no other classes can't do anything, but you can add classes to it to give it functionality.

### Toggle

A toggle object is an interactable object that can be toggled on and off. It is created by giving an element the class `object`, `interactable`, and `toggle`. The toggle object is positioned with standard css, usually position absolute. The interactable toggle requires some more complex HTML to configure it's behavior:
```html
<div class="object interactable toggle">
    <div class="on">
        <p>
            ON
        </p>
    </div>
    <div class="off">
        <p>
            OFF
        </p>
    </div>
</div>
```

This is a basic interactable toggle that displays the word "ON" within a `p` tag when on, and "OFF" when off. The toggle object will automatically switch between these two states when interacted with. You can customize the appearance of the toggle by changing the html within on and off divs. 

You can also configure the toggle to broadcast a signal on a channel depending on its state. A toggle that does that looks like this:
```html
<div class="object interactable toggle">
    <div class="on">
        <span class="broadcast channel-toggle_one">on</span>
        <p>
            ON
        </p>
    </div>
    <div class="off">
        <span class="broadcast channel-toggle_one">off</span>
        <p>
            OFF
        </p>
    </div>
</div>
```

This toggle will broadcast the signal "on" on the channel "toggle_one" when turned on, and "off" when turned off. You can have as many channels as you want, and as many signals as you want. Signals are picked up by reciever objects.

### Reciever

A reciever object is an object that listens for signals on a channel. When a signal is broadcast on that channel, the reciever will display specific html depending on the signal. Recievers are created by giving an element the class "object" and "reciever". The reciever object is positioned with standard css, usually position absolute. Here is an example of a reciever object:
```html
<div class="object reciever">
    <span class="broadcast channel-toggle_one"></span>
    <div class="signal-off">
        <p>
            OFF
        </p>
    </div>
    <div class="signal-on">
        <p>
            ON
        </p>
    </div>
</div>
```

This reciever object is listening for signals on the channel "toggle_one". When it receives the signal "off" it will display the "OFF" message, and when it receives the signal "on" it will display the "ON" message. You can customize the appearance of the reciever by changing the html within the signal divs.

### Overlay

```html
<div id="overlay"></div>
```

The overlay is a container that sits on top of the viewport. It is the element with the id of `overlay`. It is used to display information to the player that won't be affected by the screen scrolling. The overlay can display whatever html you want to put in it. It must be placed within the viewport element.

### Pause

```html
<div id="pause"></div>
```

The pause element is a container that sits on top of the viewport and overlay when the game is paused by the player. It is the element with the id of `pause`. It is used to display information to the player when the game is paused. The pause element can display whatever html you want to put in it. It must be placed within the viewport element.

### Filter

```html
<span class="filter"></span>
```

The filter element is a tag that can be placed with the overlay or pause elements to create a filter using css. Here's an example snippet for a pause screen using filters to blur and darken the background:
```html
<div id="pause">
    <span class="filter blur"></span>
    <span class="filter dark"></span>
    <div class="pause-text">
        <h1>Paused</h1>
        <p>Press <span class="key">ESC</span> to resume</p>
    </div>
</div>
```

The css for blur and dark are just:
```css
.blur {
    backdrop-filter: blur(5px);
}

.dark {
    background: rgba(0, 0, 0, 0.3);
}
```

You can combine the filters with the reciever object to create a filter that changes based on signals. Here's an example of an overlay element that conditionally applies a filter based on a signal:
```html
<div id="overlay">
    <div id="reciever-3" class="reciever">
        <span class="broadcast channel-toggle_two"></span>
        <div class="signal-none">
        </div>
        <div class="signal-crt">
            <span class="filter crt"></span>
        </div>
    </div>
</div>
```
