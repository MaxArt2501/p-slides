# Changelog

## 1.4.0

- add Custom Element Manifest and VS Code integration;
- add CSS shadow parts for speaker mode;
- fix font sizing in viewports wider than the slides;
- perform fragment computation only on changes.

## 1.3.1

- fix incorrect fragment sequence building that caused a loop;
- fix incorrect current slide retrieval on initialization;
- set slides as inert if not in presentation mode.

## 1.3.0

- add additional slide animation effects via the `effect` attribute;
- fix slide counter.

## 1.2.0

- add grid mode;
- add additional navigation keys;
- add `nextSlide()`, `previousSlide()` deck methods.

## 1.1.0

- add support to external stylesheet/raw CSS to style `<p-deck>`'s shadow DOM;
- add support to special HTML comments as speaker notes;
- add types.

## 1.0.0

First stable release.

- remove definition of `<p-fragment>` and `<p-notes>` custom elements (they can
  still work as expected);
- remove Shadow DOM from `<p-slide>`;
- fragments are grouped by their index, and all fragments in a group are shown
  and hidden together;
- fragments with no explicit index are assigned an incremental index;
- add customizable labels for accessibility;
- change `current` attribute for fragments in favor of `aria-current` for slides
  and fragments;
- invert `areVisible` property value in `p-slides.fragmenttoggle` events;
- add <kbd>Alt</kbd>-<kbd>M</kbd> keybinding for speaker mode;
- general code modernization and simplification.

## 0.2.0

- remove support to custom prefix;
- mark current fragment.

## 0.1.0

Initial public release.
