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

Of course, you're free to `import` the classes on your own and transpile whatever you want. But a pre-bundled version of
this the library will _not_ be provided.

Now, in order to install this library, just use `npm` (or `yarn` or `pnpm` or whatever):

```
npm install p-slides
```

If you want to use the modules as-is, you just have to copy them in a served directory. The following files are
necessary for P-Slides to function properly:

- **index.js**
- **components/deck.js**
- **components/slide.js**

Then, in your module:

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

The custom element `<p-deck>`, having a Shadow DOM, loads the file **css/deck.css** to style its internal content. If the
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
- **Left arrow** <kbd>←</kbd>, **up arrow** <kbd>↑</kbd>: previous slide/fragment;
- **Page down** <kbd>PgDn</kbd>: next slide;
- **Page up** <kbd>PgUp</kbd>: previous slide;
- <kbd>Home</kbd>: start of the presentation;
- <kbd>End</kbd>: end of the presentation.

These keys are compatible with most presentation pointers that are registered as external keyboards.

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

### Deck modes

P-Slides has three visualization modes, which can be cycled using <kbd>Alt-M</kbd> and <kbd>Alt-Shift-M</kbd> (by
default). The modes are:

- presentation: the usual presentation mode;
- speaker: with additional hints for the speaker's eyes only;
- grid: for quick navigation among the slides.

#### Speaker mode

Speaker mode will show:

- the current slide, with the current fragment internal progress;
- the next slide, with all the fragments enabled;
- the current slide index with relation with the total count of slides;
- a timer, followed by a button to play/pause it and another to reset it;
- an area that reports notes for the current slide (see next paragraph).

If you want to take advantage of the speaker mode, open two tabs of the presentation, and keep one in speaker mode,
while showing the other on the other screen for all the viewers. They will be kept in sync as long as they're from the
same browser session.

The timer can be started and paused using the key <kbd>P</kbd>, and reset with <kbd>Alt-0</kbd> (this works in other
modes too).

#### Grid mode

Grid mode is meant to quick navigation among the deck's slides. The slides are all visible in a grid of 4 columns (by
default). When setting the grid mode from another mode, the current slide is highlighted, then the selection can be moved
using the arrow keys, plus <kbd>Page Up</kbd> (back 3 rows), <kbd>Page Down</kbd> (ahead 3 rows), <kbd>Home</kbd> (to
the first slide) and <kbd>End</kbd> (to the last slide).

Pressing <kbd>Enter</kbd> or <kbd>Space</kbd>, or clicking on a highlighted slide, will set the slide as the current one
and will reset the deck's mode to the one set before grid has been selected, or to presentation mode if no other mode
have been set before.

### Notes

You can set up speaker notes for each slide. They will appear on the right of the speaker mode. In order to define them
you need to either use the `<p-notes>` element, an element with the `p-notes` attribute set, or a HTML comment starting
with `<!---` (meaning `<!` followed by _three_ dashes). Notes inside a fragment will initially appear as hidden/faded:

```html
<p-slide>
	<p>This will have some notes</p>
	<p-notes>Notes are a help for the speaker</p-notes>
	<div p-notes>Don't write too much in them (but you <em>can</em> use HTML inside)</div>
	<div p-fragment>
		Switch to the spearker mode to see them
		<p p-notes>The key combination is Alt-M by default</p>
	</div>
	<!--- Comment notes can only hold simple text -->
	<!-- This is a regular HTML comment and won't appear as a speaker note -->
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

| Command         | Keybindings                                                                                  |
| --------------- | -------------------------------------------------------------------------------------------- |
| `next`          | `[{ key: 'ArrowRight' }, { key: 'ArrowDown' }]`                                              |
| `previous`      | `[{ key: 'ArrowLeft' }, { key: 'ArrowUp' }]`                                                 |
| `nextslide`     | `[{ key: 'PageDown' }]`                                                                      |
| `previousslide` | `[{ key: 'PageUp' }]`                                                                        |
| `gotostart`     | `[{ key: 'Home' }]`                                                                          |
| `gotoend`       | `[{ key: 'End' }]`                                                                           |
| `toggleclock`   | `[{ key: 'P' }, { key: 'p' }]`                                                               |
| `resetclock`    | `[{ key: '0', altKey: true }]`                                                               |
| `togglemode`    | `[{ key: 'M', altKey: true, shiftKey: false }, { key: 'm', altKey: true, shiftKey: false }]` |
| `previousmode`  | `[{ key: 'M', altKey: true, shiftKey: true }, { key: 'm', altKey: true, shiftKey: true }]`   |

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

All of the following can be `import`ed from **index.js**.

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

##### `mode: 'presentation' | 'speaker' | 'grid'`

Getter/setter of current deck mode. It reflects the same named attribute value _if_ it's one of the valid values
(`'presentation'`, `'speaker'` or `'grid'`, defaults to `'presentation'`). Also sets it when assigning.

Operatively speaking, changing the deck mode does _nothing_. Its only purpose is to apply a different style to the
presentation, i.e. either the 'normal', the 'speaker' or the 'grid' mode. If you provide your own stylesheet without a
specific style for the speaker or grid mode then you're on your own.

##### `readonly slides: NodeList<PresentationSlideElement>`

At the moment, it's just a `querySelectorAll('p-slide')` executed on the deck's host element.

##### `readonly atStart: boolean`

It's `true` if and only if the presentation is at the start.

##### `readonly atEnd: boolean`

It's `true` if and only if the presentation is at the end.

##### `clock: number`

The amount of milliseconds on the timer.

##### `readonly isClockRunning: boolean`

It's `true` if and only if the timer is not paused.

##### `state: PresentationState`

An object that represents the presentation's state. Although exposed, handle it with caution, as changes may not be
reflected on the view or a second window. Use the method `broadcastState()` to send an updated state to a second view.

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

##### `readonly notes: Array<Element | Comment>`

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

### Style customizations

P-Slides needs two stylesheets, which are both provided by the library:

- **deck.css**: encapsulated styles for the deck's Shadow DOM;
- **p-slides.css**: global styles for the slides, resets and general layout.

The latter should be loaded however you want (presumably a `<link>` element), while the former is loaded by the
`<p-deck>` component class (see the documentation for `setStyleRoot()` and `PresentationDeckElement.styles`). Of course,
you can replace them as you like and define your own styles from scratch.

If you don't need to tweak the stylesheet as much, P-Slides can be fine-tuned by setting some CSS custom properties:

| Property                 | Type        | Default           | Description                                                                                      |
| ------------------------ | ----------- | ----------------- | ------------------------------------------------------------------------------------------------ |
| `--fragment-duration`    | `<time>`    | 300ms             | Time for a fragment's transition                                                                 |
| `--grid-columns`         | `<integer>` | 4                 | Number of columns in grid mode                                                                   |
| `--grid-gap`             | `<length>`  | 0.25em            | Gap and external padding in grid mode                                                            |
| `--grid-highlight-color` | \*          | `LinkText` / 50%  | Color for the outline of the highlighted slide in grid mode                                      |
| `--slide-aspect-ratio`   | `<number>`  | 1.777778 (16 / 9) | Aspect ratio of the slides                                                                       |
| `--slide-bg`             | \*          | white             | Background for the slides. Can be anything `background` accepts. Can be set on a single slide    |
| `--slide-effect`         | \*          | shuffle           | Animation effect for the slide (see [Slide effects](#slide-effects))                             |
| `--slide-font-size`      | \*          | 5                 | Size of the base presentation font in virtual units. Slides will be 100/(this value) `em`s large |
| `--slide-previous`       | \*          | 0                 | Set to 1 for every _previous_ slide; otherwise it's 0. Useful for animation effects and such     |
| `--sliding-duration`     | `<time>`    | 0s/0.5s           | Time for the transition between two slides: 0.5s if the user doesn't prefer reduced motion       |
| `--speaker-next-scale`   | `<number>`  | 0.666667 (2 / 3)  | Scale for the next slide compared to the whole area in speaker mode.                             |

When the type is specified, the properties have been registered using `@property` in **p-slides.css**.

`<p-deck>` elements also expose some [CSS shadow parts](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_shadow_parts)
for the speaker mode to let external stylesheets to override the default styling:

| Part name        | Element    | Description                                |
| ---------------- | ---------- | ------------------------------------------ |
| `sidebar`        | `<aside>`  | Spearker mode's sidebar                    |
| `toolbar`        | `<header>` | Spearker mode's toolbar inside the sidenav |
| `notelist`       | `<ul>`     | Container for the speaker notes            |
| `control-button` | `<button>` | Play, pause and clock reset button         |

For example:

```css
p-deck::part(sidebar) {
	filter: invert(0.9);
}
```

#### Slide numbering

The counter `slide` will be incremented by each `<p-slide>` element inside a `<p-deck>`. You can use it to automatically
generate the content of the slide using `counter(slide)`. There's no counter for the total amount of slides, but you can
always use the following:

- getting `slides.length` of the parent deck element;
- using [`sibling-count()`](https://developer.mozilla.org/en-US/docs/Web/CSS/sibling-count) - only where supported and
  only if all the slides are actually children of the same element.

If you're providing your own styles for the presentation, remember it's important to not set `display: none` on hidden
slides, because such elements don't affect counters.

### Slide effects

P-Slides comes with 4 pre-defined animations that are played when switching from a slide to another:

- `shuffle`: (default) classic effect of sliding the old slide behind the new one;
- `fade`: opacify fading;
- `slide`: slides get in and out of the view horizontally;
- `scroll`: slides get in and out of the view vertically.

Every slide can have its own entering effect when the `effect` attribute is set to one of the above values (notice that
there is no `effect` _property_ on `<p-slide>` elements). If you want to provide your own custom animation effect, you
have to provide your own CSS. P-Slides just uses a `@keyframes` rule to animate a slide in, and another to animate out
of the view, using the following CSS rules:

```css
p-slide[aria-hidden='true']:has(+ [effect='xyz']),
p-slide[effect='xyz'][aria-hidden='true']:not([previous]) {
	animation-name: xyz-out;
}
p-slide[previous][aria-hidden='false']:has(+ [effect='xyz']),
p-slide[effect='xyz'][aria-hidden='false']:not([previous]) {
	animation-name: xyz-in;
}
```

> [!NOTE]
> We need to use two different animations, and not using the same but playing it in reverse, because animations that
> have already ended don't restart if `animation-name` doesn't change or a reflow event occurs. Read this
> [CSS Tricks article](https://css-tricks.com/restart-css-animation/) for details.

Make use of the `--slide-previous` flag to discriminate an animation when applied to a _previous_ slide. For example:

```css
/* p-slides.css */
@keyframes slide-in {
	0% {
		translate: calc(100cqw - 200cqw * var(--slide-previous)) 0;
	}
	100% {
		translate: 0 0;
	}
}
```

This means that if we're going _forwards_, then the new slide will translate _from the right_ (`100cqw` to `0`), and if
we're returning to the previous slide it will translate _from the left_ (`-100cqw` to `0`).

If you want to change the default animation effect, redefine the `animation-name` property with your own CSS:

```css
p-slide {
	animation-name: xyz-out;

	&[aria-hidden='false'] {
		animation-name: xyz-in;
	}
}
```

#### Effect duration

If you don't want animations when showing a new slide, simply set `--sliding-duration` to `0s`. This is also what
happens normally, unless the `prefers-reduced-motion` media query resolves to `no-preference`: in that case, the value
is set to half second on the deck.

If you want to set another value, for accessibility's sake please check if the user allows full motion first:

```css
@media (prefers-reduced-motion: no-preference) {
	p-deck {
		--sliding-duration: 1s;
	}
}
```

Fragment transition duration is defined by the custom property `--fragment-duration`, with a default value of `300ms`.
Since fragments normally cover a portion of the screen, this value is _not_ determined by the `prefers-reduced-motion`
media query: if it's not the case, consider setting it to `0s` for all the fragments or maybe just for the larger ones:

```css
@media (prefers-reduced-motion: reduce) {
	.large-fragment {
		--fragment-duration: 0s;
	}
}
```

## Custom Element Manifest and IDE integrations

The package provides a [Custom Element Manifest](https://github.com/webcomponents/custom-elements-manifest) file with the
name **custom-elements.json**. It's also set as the `"custom-elements"` property in **package.json**. You can use it to
instruct your IDE and tasks about the components defined by P-Slides.

If you're using Visual Studio Code, remember to add the following lines to your **.vscode/setting.json** file in order to
receive autocompletion and intellisense from the IDE:

```json
{
	"html.customData": ["./node_modules/p-slides/p-slides.vscode.html-custom-data.json"],
	"css.customData": ["./node_modules/p-slides/p-slides.vscode.css-custom-data.json"]
}
```
