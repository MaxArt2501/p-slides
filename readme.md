P-Slides
========

Presentations made simple with Web Components

## What's this?

This package comprises the definition of four custom elements that come in handy when writing a web presentation.
That's basically it.

The elements are:
* `<p-deck>`: defines the wrapper for the presentation and acts as the main controller;
* `<p-slide>`: a single presentation slide;
* `<p-fragment>`: a bit of visual content that starts as hidden, and gets shown later;
* `<p-notes>`: used for speaker's notes. Not shown in presentation mode, only in speaker mode.

## Usage

You *must* use ES modules to use this library. It shouldn't be a problem, as every browser that supports Web Components
also supports ES modules.

Of course, you're free to `import` the classes on your own and transpile whatever you want. But I will *not* provide a
pre-bundled version of this the library.

Now, in order to install this library, just use `npm` (or `yarn` or whatever):

```
### NOT YET
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

Don't forget to also copy their stylesheets (located in the `css` directory), unless you want to provide your own.

## API

All of the following can be `import`ed from `index.js`.

### `registerElements(): Promise<void[]>`

Register the library's custom elements, i.e. calls `customElements.define` on each of them, and returns a promise which
is resolved when the registration is complete (should be immediate).

### `setStyleRoot(root: string): void`

The custom elements will start loading their stylesheet at the default location of `css/`. For example, the deck will
load `css/deck.css`, the slide `css/slide.css` and so on. You can change that *before instantiating them* using this
method.

Don't forget the final slash! Or do, if you want to provide a prefix for the file names.

### `PresentationDeckElement`

The class corresponding to the `<p-deck>` element wrapper. You'll mostly have to interact with this to manage the
presentation.

#### `currentSlide: PresentationSlideElement | null`

Getter/setter for the slide element marked as 'current'. When setting, it *must* be a `<p-slide>` elements descendant of
the deck.

#### `currentIndex: number`

Getter/setter of index of the current slide.

#### `mode: 'presentation' | 'speaker'`

Getter/setter of current deck mode. It reflects the same named attribute value *if* it's either `presentation` or
`speaker` (defaults to the former). Also sets it when assigning.

Operatively speaking, changing the deck mode does *nothing*. Its only purpose is to apply a different style to the
presentation, i.e. either the 'normal' or the 'speaker' mode. If you provide your own stylesheet without a specific
style for the speaker mode then eh, you're on your own.

#### `readonly slides: NodeList<PresentationSlideElement>`

At the moment, it's just a `querySelectorAll('p-slide')` executed on the deck's host element.

#### `readonly atStart: boolean`

It's `true` if and only if the presentation is at the start.

#### `readonly atEnd: boolean`

It's `true` if and only if the presentation is at the end.
