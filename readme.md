# P-Slides

Presentations made simple with Web Components

## What's this?

This package comprises the definition of two custom elements that come in handy when writing a web presentation.
That's basically it.

The elements are:

- `<p-deck>`: defines the wrapper for the presentation and acts as the main controller;
- `<p-slide>`: a single presentation slide;

Version 0.x of the package used to define two more custom elements:

- `<p-fragment>`: a bit of visual content that starts as hidden, and gets shown later;
- `<p-notes>`: used for speaker's notes. Not shown in presentation mode, only in speaker mode.

These two elements are no longer defined, although you can _still_ use the tags above for the same behavior.
Alternatively, you can use the `p-fragment` and `p-notes` _attributes_ to attach to whatever element (even SVG and
MathML elements) to achieve the same result.

Also, the element `<p-slide>` does not define a Shadow DOM anymore.

## Usage

You _must_ use ES modules to use this library. It shouldn't be a problem, as every browser that supports Web Components
also supports ES modules.

Of course, you're free to `import` the classes on your own and transpile whatever you want. But I will _not_ provide a
pre-bundled version of this the library.

Now, in order to install this library, just use `npm` (or `yarn` or whatever):

```
npm install p-slides
```

If you want to use the modules as-is, you just have to copy them in a served directory. Everything `.js` file that's not
in the `test` directory is necessary. Then, in your module:

```js
import { registerElements } from './vendor/p-slides/index.js';
registerElements().then(() => {
	// The presentation elements have been registered
});
```

### Styles

Don't forget to also copy their stylesheets (located in the `css` directory), unless you want to provide your own.

You may wish to load the stylesheet **p-slides.css** globally, as it provides basic styling for the presentation.

```html
<link rel="stylesheet" href="./vendor/p-slides/css/p-slides.css" />
```

The custom element `<p-deck>`, having a Shadow DOM, loads the file `css/deck.css` to style its internal content. If the
file is located in a different directory, please use the `setStyleRoot` method to define the correct path:

```js
import { setStyleRoot } from './vendor/p-slides/index.js';
// It will attempt to load ./vendor/p-slides/css/deck.css
setStyleRoot('./vendor/p-slides/css/');
```

### Markup

Now you're ready to design your presentation. In order to do so, wrap your `<p-slide>` element inside a `<p-deck>`:

```html
<body>
	<p-deck>
		<p-slide>First slide</p-slide>
		<p-slide>Second slide</p-slide>
		...
	</p-deck>
	...
</body>
```

Slides have normally the attribute `aria-hidden="true"` and `aria-current="false"`, except the active one that has
`aria-hidden="false"` and `aria-current="page"`. Moreover, slides that came before the active one have the `previous`
attribute set.

In order to navigate among the slides, you can use the following keys:

- **Right arrow** <kbd>→</kbd>, **down arrow** <kbd>↓</kbd>: next slide/fragment;
- **Left arrow** <kbd>←</kbd>, **up arrow** <kbd>↑</kbd>: previous slide/fragment.

These keys compatible with most presentation pointers that are registered as external keyboards.

### Fragments

If you want to hide some content until you press "next", you can use **fragments**. These can be introduced using a
`<p-fragment>` element or a `p-fragment` attribute:

```html
<p-slide>
	<p>This is fragmented content</p>
	<p-fragment>This will appear next</p-fragment>
	<div p-fragment>Then this will appear</div>
	<svg>
		<text p-fragment>With SVG elements, you can only use the attribute</text>
	</svg>
</p-slide>
```

Similarly to slides, fragments are all initialized with `aria-hidden="true"` and `aria-current="false"`. When showing
slides, `aria-hidden` becomes `"false"`, but only the last fragment shown has `aria-current` set to `"step"`. Past
fragments have the `previous` attribute set as well.

Fragments can also have an _index_, i.e. a non-negative number. Fragments with the same index will appear and disappear
at the same time. Fragment indexes can be set using the `index` attribute in `<p-fragment>` elements, or as the value
of the `p-fragment` attribute.

If you don't provide an explicit index, fragment will automatically get one, incrementally as they appear in the slide.
Invalid indexes (non-numeric or negative) will be considered as not defined.

```html
<p-slide>
	<p>This is fragmented content</p>
	<p-fragment index="5">This will appear last</p-fragment>
	<div p-fragment>This will have an automatic index</div>
	<p p-fragment="1.2">Index can be fractional too!</p>
	<p-fragment index="1.2"> This will appear together with the paragraph above </p-fragment>
	<div p-fragment="-2">This has an invalid index</div>
	<div p-fragment>This will be the 5th</div>
</p-slide>
```

This table will explain how the order is created:

|   Index    |  Assigned  | Content                                                                            |
| :--------: | :--------: | ---------------------------------------------------------------------------------- |
|     -      |     0      | This will have an automatic index                                                  |
|     -2     |     1      | This has an invalid index                                                          |
| 1.2<br>1.2 | 1.2<br>1.2 | Index can be fractional too!<br>This will appear together with the paragraph above |
|     -      |     2      | This will be the 5th                                                               |
|     5      |     5      | This will appear last                                                              |

### Speaker mode

P-Slides provide a "speaker mode" that can be enabled pressing <kbd>Alt-M</kbd> (by default). It will show:

- the current slide, with the current fragment internal progress;
- the next slide, with all the fragments enabled;
- the current slide index with relation with the total count of slides;
- a timer, followed by a button to play/pause it and another to reset it;
- an area that reports notes for the current slide (see next paragraph).

If you want to take advantage of the speaker mode, open two tabs of the presentation, and keep one in speaker mode,
while showing the other on the other screen for all the viewers. They will be kept in sync as long as they're from the
same browser session.

The timer can be started and paused using the key <kbd>P</kbd>, and reset with <kbd>0</kbd>.

### Notes

You can set up speaker notes for each slide. They will appear on the right of the speaker mode. In order to define them
you need to either use the `<p-notes>` element or the `p-notes` attribute. Notes in a fragment will initially appear as
hidden/faded:

```html
<p-slide>
	<p>This will have some notes</p>
	<p-notes>Notes are a help for the speaker</p-notes>
	<div p-notes>Don't write too much in them</div>
	<div p-fragment>
		Switch to the spearker mode to see them
		<p p-notes>The key combination is Alt-M by default</p>
	</div>
</p-slide>
```

You can put whatever you like in notes. Remember they should be a _hint_ for the speaker, so I suggest to not put
anything too fancy there. Also, keep in mind that the content of the notes is _copied_ inside the speaker mode's area
for the notes.

### Keybindings

You can change the default keybindings on the deck's instance by setting the `keyCommands` property. It's an object that
maps a command name with a list of key descriptions (partials of
[`KeyboardEvent`](https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent) objects). These are the default
definitions:

| Command       | Keybindings                                                |
| ------------- | ---------------------------------------------------------- |
| `next`        | `[{ key: 'ArrowRight' }, { key: 'ArrowDown' }]`            |
| `previous`    | `[{ key: 'ArrowLeft' }, { key: 'ArrowUp' }]`               |
| `toggleclock` | `[{ key: 'P' }, { key: 'p' }]`                             |
| `resetclock`  | `[{ key: '0', altKey: true }]`                             |
| `togglemode`  | `[{ key: 'M', altKey: true }, { key: 'm', altKey: true }]` |

### A11y and I18n

Although P-Slides shows no text per se, it uses some as labels for accessibility purposes. Specifically, it provides
alternative text for the following elements:

- the slide counter (e.g. `'Slide 7 of 14'`);
- the timer (`'Elapsed time'`);
- the timer start button (`'Start the timer'`);
- the timer pause button (`'Pause the timer'`);
- the timer reset button (`'Reset the timer'`).

You can provide your own localized versions by setting the following properties on the `labels` property of the deck
instance, respectively:

- `ELAPSED_TIME`
- `TIMER_START`
- `TIMER_PAUSE`
- `TIMER_RESET`
- `SLIDE_COUNTER`

The values must be either a simple string, or a functions that returns a string and receives the deck's instance as the
first argument.

## API

All of the following can be `import`ed from `index.js`.

### `registerElements(): Promise<void[]>`

Register the library's custom elements, i.e. calls `customElements.define` on each of them, and returns a promise that
resolves when the registration is complete (should be immediate).

### `setStyleRoot(root: string): void`

The `<p-deck>` element will start loading its stylesheet at the default location of `css/`, if nothing has been set on
`PresentationDeckElement.styles`. You can change that _before defining or instantiating_ a `<p-deck>` element.

Don't forget the final slash! Or do, if you want to provide a prefix for the file names.

### `PresentationDeckElement`

The class corresponding to the `<p-deck>` element wrapper. You'll mostly have to interact with this to manage the
presentation.

#### Static properties

##### `styles: string | string[] | null`

Allows to define the location of one or more stylesheet, either as an URL (absolute or relative), or as raw CSS code.
You can mix URLs and CSS code as you wish. The logic for telling them apart is simple: if the
[`CSSStyleSheet`](https://developer.mozilla.org/en-US/docs/Web/API/CSSStyleSheet) generated by the given string has at
least one rule, or if the string contains a newline character, it's considered a valid stylesheet; otherwise, it
attempts to load the stylesheet treating the given string as a URL.

Set this property _before defining or instantiating_ a `<p-deck>` element.

#### Properties

##### `currentSlide: PresentationSlideElement | null`

Getter/setter for the slide element marked as 'current'. When setting, it _must_ be a `<p-slide>` elements descendant of
the deck.

##### `currentIndex: number`

Getter/setter of index of the current slide.

##### `mode: 'presentation' | 'speaker'`

Getter/setter of current deck mode. It reflects the same named attribute value _if_ it's either `'presentation'` or
`'speaker'` (defaults to the former). Also sets it when assigning.

Operatively speaking, changing the deck mode does _nothing_. Its only purpose is to apply a different style to the
presentation, i.e. either the 'normal' or the 'speaker' mode. If you provide your own stylesheet without a specific
style for the speaker mode then eh, you're on your own.

##### `readonly slides: NodeList<PresentationSlideElement>`

At the moment, it's just a `querySelectorAll('p-slide')` executed on the deck's host element.

##### `readonly atStart: boolean`

It's `true` if and only if the presentation is at the start.

##### `readonly atEnd: boolean`

It's `true` if and only if the presentation is at the end.

##### `clock: number`

The amount of milliseconds on the timer.

#### `readonly isClockRunning: boolean`

It's `true` if and only if the timer is not paused.

#### `state: PresentationState`

An object that represents the presentation's state. Although exposed, handle it with caution, as changes may not be
reflected on the view or a second window. Use the method `broadcastState()` to send an updated state to a second
view.

#### Methods

##### `next(): void`

Advances the presentation, either by showing a new fragment on the current slide, or switching to the next slide.

##### `previous(): void`

Brings the presentation back, either by hiding the last shown fragment on the current slide, or switching to the
previous slide.

##### `startClock(): void`

Starts the timer.

##### `stopClock(): void`

Stops the timer.

##### `toggleClock(): void`

Toggles the timer.

##### `broadcastState(): void`

Sends the current presentation's state to other windows/tabs open on the presentation.

##### `requestState(): void`

Retrieves the presentation's state from other windows/tabs open on the presentation.

#### Events

All events emitted are instances of [`CustomEvent`](https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent), with
additional data in the `detail` property. All the events bubble and cannot be cancelled.

##### `p-slides.slidechange`

Fired when the current slide changes.

| Detail property | Type                       | Description                        |
| --------------- | -------------------------- | ---------------------------------- |
| `slide`         | `PresentationSlideElement` | The new current slide              |
| `previous`      | `PresentationSlideElement` | The slide previouly set as current |

##### `p-slides.finish`

Fired when the presentation has reached the end.

##### `p-slides.clockstart`

Fired when the timer has been started.

| Detail property | Type     | Description                               |
| --------------- | -------- | ----------------------------------------- |
| `timestamp`     | `number` | Timestamp when the times has been started |
| `elapsed`       | `number` | Milliseconds on the timer                 |

##### `p-slides.clockstop`

Fired when the timer has been paused.

| Detail property | Type     | Description               |
| --------------- | -------- | ------------------------- |
| `elapsed`       | `number` | Milliseconds on the timer |

##### `p-slides.clockset`

Fired when the timer has been set via the `clock` property.

| Detail property | Type     | Description               |
| --------------- | -------- | ------------------------- |
| `elapsed`       | `number` | Milliseconds on the timer |

### `PresentationSlideElement`

The class corresponding to the `<p-slide>` element.

#### Properties

##### `readonly deck: PresentationDeckElement | null`

The parent presentation deck.

##### `isActive: boolean`

Whether the slide is the current one in the presentation. This will set the `aria-current` attribute to either `'page'`
or `'false'`.

It's discouraged to set it manually.

##### `isPrevious: boolean`

Whether the slide is past the current one in the presentation. This will set a `previous` attribute on the `<p-slide>`
element, that can be used for styling purposes. A slide can be the current one _and_ marked as "previous" when going
backward in the presentation.

It's discouraged to set it manually.

##### `readonly fragments: NodeListOf<Element>`

The list of the fragment elements as they appear in the slide's markup.

##### `readonly fragmentSequence: Element[][]`

The fragments grouped using their indexes.

##### `readonly nextHiddenFragments: Element[] | undefined`

The next group of fragments that will be shown when advancing the presentation, if any.

##### `readonly lastVisibleFragments: Element[] | undefined`

The last group of fragments that has been shown when advancing the presentation, if any.

##### `readonly notes: NodeListOf<Element>`

The list of the speaker notes as they appear in the slide's markup.

#### Methods

##### `next(): boolean`

Attempts to advance the presentation by showing a new block of fragments on the current slide. It returns `true` if no
fragments are left to show in the current slide (the deck will advance to the next slide).

##### `previous(): boolean`

Attempts to bring the presentation back by hiding the last shown block of fragments on the current slide. It returns
`true` if no fragments are left to hide in the current slide (the deck will go back to the previous slide).

#### Events

##### `p-slides.fragmenttoggle`

Fired when a block of fragments has been shown or hidden. The event bubbles and cannot be cancelled.

| Detail property | Type        | Description                                   |
| --------------- | ----------- | --------------------------------------------- |
| `fragments`     | `Element[]` | The fragments that have been toggled          |
| `areVisible`    | `boolean`   | The visibility state of the toggled fragments |
