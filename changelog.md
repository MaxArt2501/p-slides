# Changelog

## 1.6.0

- upgrade TypeScript to v7
- switch to subclasses of `CustomEvent` rather than using `CustomEvent` for the deck's events
- add a default print stylesheet
- redefine `reveal`, `insert` effects so they transit `--fragment-progress` only
- add support to Invoker Commands API
- add `presentationmode`, `speakermode` and `gridmode` as keybindings and Invoker Commands
- fix `PresentationSlideChange.previous` property to actually point to the previous slide
- fix type of deck's `fragments` property

## 1.5.1

- fix deck's `atEnd` property always yielding `true` on the last slide
- fix speaker notes visibility when commanding from another tab
- fix speaker note list cutting off long lists of notes and scroll to newly active notes
- set note activation on fragment group (if present) rather than ancestor fragment activation

## 1.5.0

- add several fragment effect presets in a separate **effects.css** file;
- hide slide content when one slide away in presentation mode, not visible in speaker mode and automatically in grid mode;
- add support to fragment groups;
- add support to fragment-less effects;
- add support for initially visibile fragments;
- add ability to group notes to separate fragments
- add support to Declarative Shadow DOM;
- add state data identification;
- add custom property for slide-level font size;
- code cleanup and minor fixes.

## 1.4.2

- order speaker notes according to the order of the container fragments;
- set slides inert to pointer actions except for the current one.

## 1.4.1

- add missing lib.d.ts in package.json's files property
- add missing references to repository URL

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
