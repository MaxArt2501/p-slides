/** @internal */
export const whenAllDefined = () => Promise.all(['p-deck', 'p-slide'].map(tag => customElements.whenDefined(tag)));

/** @typedef {import('./components/deck.js').PresentationDeckElement} PresentationDeckElement */
/** @typedef {import('./components/slide.js').PresentationSlideElement} PresentationSlideElement */
/** @typedef {import('./declarations.js').PresentationKeyHandler} PresentationKeyHandler */

let styleRoot = 'css/';

/** @internal */
export const INITIALLY_VISIBLE = 'p-initially-visible';
/** @internal */
export const FRAGMENTS = 'p-fragment,[p-fragment]';

/**
 * The `<p-deck>` element will start loading its stylesheet at the default location of `css/`, if nothing has been set
 * on `PresentationDeckElement.styles`. You can change that _before defining or instantiating_ a `<p-deck>` element.
 *
 * Don't forget the final slash! Or do, if you want to provide a prefix for the file names.
 * @param {string} root
 */
export function setStyleRoot(root) {
	styleRoot = root;
}

/** @type {Record<string, Promise<CSSStyleSheet>>} */
const stylesheets = {};

/** @param {PresentationDeckElement} deck @internal */
export const applyStylesheets = async deck => {
	let styles =
		deck.getAttribute('styles') || /** @type {typeof import('./components/deck.js').PresentationDeckElement} */ (deck.constructor).styles;
	if (!styles) styles = [`${styleRoot}deck.css`];
	else if (!Array.isArray(styles)) styles = [styles];

	const cssStyles = await Promise.all(
		styles.map(source => {
			const sourceString = String(source);
			if (!stylesheets[sourceString]) {
				const stylesheet = parseStylesheet(sourceString);
				stylesheets[sourceString] = stylesheet
					? Promise.resolve(stylesheet)
					: fetch(sourceString, { headers: { accept: 'text/css' } })
							.then(res => res.text())
							.then(text => {
								const styleSheet = new CSSStyleSheet();
								styleSheet.replaceSync(text);
								return styleSheet;
							});
			}
			return stylesheets[sourceString];
		})
	);
	deck.shadowRoot.adoptedStyleSheets.push(...cssStyles);
	return cssStyles;
};

/**
 * @param {unknown} element
 * @returns {element is PresentationSlideElement}
 * @internal
 */
export const isSlide = element => element instanceof Element && element.localName === 'p-slide';

/** @param {string} source @internal */
const parseStylesheet = source => {
	const styleSheet = new CSSStyleSheet();
	styleSheet.replaceSync(source);
	return styleSheet.cssRules.length || source.includes('\n') ? styleSheet : null;
};

/**
 * @param {PresentationSlideElement[]} slides
 * @param {PresentationSlideElement} nextSlide
 * @internal
 */
export const selectSlide = (slides, nextSlide) => {
	let isPrevious = true;
	for (const slide of slides) {
		if (slide === nextSlide) {
			isPrevious = false;
		} else {
			slide.isActive = false;
			slide.isPrevious = isPrevious;
			setFragmentActivation(isPrevious)(...slide.fragments);
			setCurrentFragments(slide);
		}
	}
};

/**
 * @param {Node} root
 * @returns {Array<Element | Comment>}
 * @internal
 */
function getNotes(root) {
	if (root instanceof Element) {
		return root.matches('p-notes, [p-notes]') ? [root] : Array.from(root.childNodes).flatMap(getNotes);
	}
	if (root instanceof Comment) {
		return root.nodeValue.startsWith('-') ? [root] : [];
	}
	return [];
}

/**
 * @param {Node} node
 * @returns {node is Element}
 * @internal */
const isElement = node => node.nodeType === Node.ELEMENT_NODE;

/** @param {Element | Comment} note @internal */
const getNoteFragment = note => {
	const fragment = (isElement(note) ? note : note.parentElement).closest(FRAGMENTS);
	if (fragment) return fragment;
	if (!isElement(note)) return null;
	const group = note.getAttribute('p-group');
	if (group === null) return null;
	return note.closest('p-slide')?.querySelector(`[p-group="${group}"]:is(${FRAGMENTS})`) ?? null;
};

/** @param {PresentationSlideElement} slide @internal */
export function collectNotes(slide) {
	const notes = getNotes(slide);
	const { fragmentSequence } = slide;
	const noteFragments = new Map(
		notes.map(note => {
			const noteFragment = getNoteFragment(note);
			const noteIndex = noteFragment ? fragmentSequence.findIndex(frags => frags.some(fragment => fragment === noteFragment)) : -1;
			return [note, noteIndex];
		})
	);
	notes.sort((a, b) => noteFragments.get(a) - noteFragments.get(b));
	return notes;
}

/**
 * @param {Element} noteContainer
 * @param {Array<Element | Comment>} notes
 * @internal
 */
export const copyNotes = (noteContainer, notes) => {
	while (noteContainer.lastChild) {
		noteContainer.removeChild(noteContainer.lastChild);
	}
	for (const note of notes) {
		const li = noteContainer.ownerDocument.createElement('li');
		if (note instanceof Element)
			for (const child of note.childNodes) {
				li.appendChild(child.cloneNode(true));
			}
		else li.textContent = note.nodeValue.slice(1);
		noteContainer.appendChild(li);
	}
	checkNoteActivations(noteContainer, notes);
};

/**
 * @param {Element} noteContainer
 * @param {Array<Element | Comment>} notes
 * @internal
 */
export const checkNoteActivations = (noteContainer, notes) => {
	notes.forEach((note, index) => {
		noteContainer.children[index].hidden = !isNoteActive(note);
	});
};

/**
 * @param {KeyboardEvent} keyEvent
 * @param {Record<T, Array<Partial<KeyboardEvent>>>} keyMap
 * @return {T | null}
 * @template {string} T
 * @internal
 */
function matchKey(keyEvent, keyMap) {
	for (const [command, keys] of Object.entries(keyMap)) {
		for (const keyDef of keys) {
			if (Object.entries(keyDef).every(([prop, value]) => keyEvent[prop] === value)) {
				return command;
			}
		}
	}
	return null;
}

/**
 * @typedef {{
 * 	[E in keyof HTMLElementEventMap]: E extends `p-slides.${infer N}` ? N : never;
 * }[keyof HTMLElementEventMap]} PresentationEventSimpleName
 */
/**
 * @param {EventTarget} target
 * @param {N} eventName
 * @param {HTMLElementEventMap[`p-slides.${N}`]['detail']} detail
 * @template {PresentationEventSimpleName} N
 * @internal
 */
export const fireEvent = (target, eventName, detail = {}) => {
	const event = new CustomEvent(`p-slides.${eventName}`, { bubbles: true, detail });
	return target.dispatchEvent(event);
};

/**
 * @param {number} millis
 * @returns {[number, number, number]}
 * @internal
 */
export const formatClock = millis => {
	const secs = Math.floor(millis / 1000);
	return [Math.trunc(secs / 3600), Math.trunc((secs % 3600) / 60), Math.trunc(secs % 60)];
};

/** @param {Element} element @internal */
const getIndexAttr = element => element.getAttribute(element.localName === 'p-fragment' ? 'index' : 'p-fragment');

/** @param {Element} element @internal */
const getFragmentIndex = element => {
	const rawValue = getIndexAttr(element);
	if (rawValue === null) return null;
	const numValue = Number.parseFloat(rawValue);
	return Number.isFinite(numValue) && numValue >= 0 ? numValue : null;
};

/** @param {Element} element @internal */
const getFragmentGroup = element => {
	const group = element.getAttribute('p-group');
	if (group !== null) return group;
	const rawValue = getIndexAttr(element);
	return rawValue?.includes(':') ? rawValue.slice(rawValue.indexOf(':') + 1) : null;
};

/** @param {Element} element @internal */
export const isFragmentActivated = element => element.getAttribute('aria-hidden') === String(element.hasAttribute(INITIALLY_VISIBLE));

/**
 * @param {boolean} activate
 * @return {(...elements: Element[]) => void}
 * @internal
 */
export const setFragmentActivation =
	activate =>
	(...elements) =>
		elements.forEach(element => element.setAttribute('aria-hidden', String(!(activate ^ element.hasAttribute(INITIALLY_VISIBLE)))));

/** @param {PresentationSlideElement} slide @internal */
export const setCurrentFragments = slide => {
	slide.fragmentSequence.forEach((fragments, index, blocks) => {
		const areActivated = fragments.every(isFragmentActivated);
		const areCurrent = areActivated && !blocks[index + 1]?.every(isFragmentActivated);
		fragments.forEach((fragment, index) => {
			fragment.toggleAttribute('previous', areActivated && !areCurrent);
			// Only the last fragment of a block should be set as the current fragment
			fragment.ariaCurrent = areCurrent && index === fragments.length - 1 ? 'step' : 'false';
		});
	});
};

/** @param {Element | Comment} note @internal */
const isNoteActive = note => {
	const fragment = getNoteFragment(note);
	return !fragment || isFragmentActivated(fragment);
};

/**
 * @param {Map<K, V[]>} map
 * @param {K} key
 * @param  {...V} values
 * @template {string | number} K
 * @template V
 * @internal
 */
const upsert = (map, key, ...values) => {
	if (map.has(key)) map.get(key).push(...values);
	else map.set(key, values);
};

/**
 * @param {ArrayLike<Element>} fragments
 * @returns {Element[][]}
 * @internal
 */
export const getSequencedFragments = fragments => {
	const nullIndexes = [];
	const indexMap = new Map();
	const groups = new Map();
	for (const fragment of fragments) {
		const index = getFragmentIndex(fragment);
		const group = getFragmentGroup(fragment);
		if (group !== null) upsert(groups, group, { fragment, index });
		else if (index === null) nullIndexes.push(fragment);
		else upsert(indexMap, index, fragment);
	}
	for (const [, group] of groups) {
		const indexed = group.find(({ index }) => index !== null);
		const fragments = group.map(({ fragment }) => fragment);
		if (indexed) {
			upsert(indexMap, indexed.index, ...fragments);
		} else {
			const insertIndex = nullIndexes.findIndex(
				frags => (frags[0] ?? frags).compareDocumentPosition(fragments[0]) & Node.DOCUMENT_POSITION_PRECEDING
			);
			if (insertIndex >= 0) nullIndexes.splice(insertIndex, 0, fragments);
			else nullIndexes.push(fragments);
		}
	}
	const sorted = [];
	let indexes = Array.from(indexMap.keys()).sort((a, b) => a - b);
	let nextIndex = indexes.shift();
	let count = 0;
	while (count < fragments.length) {
		if ((nextIndex === undefined || nextIndex > sorted.length) && nullIndexes.length) {
			const nulls = nullIndexes.shift();
			const frags = Array.isArray(nulls) ? nulls : [nulls];
			sorted.push(frags);
			count += frags.length;
		} else if (nextIndex <= sorted.length || !nullIndexes.length) {
			const block = indexMap.get(nextIndex);
			sorted.push(block);
			count += block.length;
			nextIndex = indexes.shift();
		}
	}
	return sorted;
};

/**
 * @param {C} context
 * @param {keyof T} name
 * @template {{ labels: T}} C
 * @template {Record<string, string | (context: C) => string>} T
 * @internal
 */
export const getLabel = (context, name) =>
	typeof context.labels[name] === 'string' ? context.labels[name] : context.labels[name](context);

/** @type {Record<string, (index: number, gridColumns: number, slides: number) => number>} */
const indexMoveMap = {
	ArrowUp: (index, gridColumns) => Math.max(index % gridColumns, index - gridColumns),
	ArrowDown: (index, gridColumns, slides) => index + (index + gridColumns >= slides ? 0 : gridColumns),
	ArrowLeft: index => Math.max(0, index - 1),
	ArrowRight: (index, _, slides) => Math.min(slides - 1, index + 1),
	Home: () => 0,
	End: (_, __, slides) => slides - 1,
	PageUp: (index, gridColumns) => Math.max(0, index - gridColumns * 3),
	PageDown: (index, gridColumns, slides) => Math.min(slides - 1, index + gridColumns * 3)
};
/**
 * @param {string} key
 * @param {number} current
 * @param {number} columns
 * @param {number} slides
 * @internal
 */
export const updateHighlightIndex = (key, current, columns, slides) =>
	key in indexMoveMap ? indexMoveMap[key](current, columns, slides) : NaN;

/** @param {number} index @internal */
export const getHighlightSelector = index => `:host([mode="grid"]) ::slotted(p-slide:nth-of-type(${index}))`;

/** @param {string} selector @internal */
export const getHighlightIndex = selector => selector.replace(/\D/g, '') - 1;

const encoder = new TextEncoder();
/** @param {Element} element @internal */
export const generateTextId = async element => {
	const hash = await crypto.subtle.digest('sha-1', encoder.encode(element.textContent).buffer);
	const bytes = new Uint8Array(hash);
	return bytes.toHex?.() ?? Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
};

const motionMatcher = matchMedia('(prefers-reduced-motion: no-preference)');
/** @internal */
export let whateverMotion = motionMatcher.matches;
motionMatcher.addEventListener('change', event => (whateverMotion = event.matches));

/** @type {PresentationKeyHandler} @internal */
export const defaultKeyHandler = (keyEvent, deck) => {
	const command = matchKey(keyEvent, deck.keyCommands);
	switch (command) {
		case 'previous':
			deck.previous();
			break;
		case 'next':
			deck.next();
			break;
		case 'previousslide':
			deck.previousSlide();
			break;
		case 'nextslide':
			deck.nextSlide();
			break;
		case 'gotostart':
			deck.currentIndex = 0;
			deck.previousSlide();
			break;
		case 'gotoend':
			deck.currentIndex = deck.slides.length - 1;
			deck.nextSlide();
			break;
		case 'toggleclock':
			deck.toggleClock();
			break;
		case 'resetclock':
			deck.clock = 0;
			break;
		case 'togglemode':
			deck.mode = deck.modes[(deck.modes.indexOf(deck.mode) + 1) % deck.modes.length];
			break;
		case 'previousmode':
			deck.mode = deck.modes[(deck.modes.indexOf(deck.mode) + deck.modes.length - 1) % deck.modes.length];
			break;
		default:
			return false;
	}
	return true;
};

/** @type {PresentationKeyHandler} @internal */
export const gridKeyHandler = (keyEvent, deck) => {
	if (['altKey', 'shiftKey', 'metaKey', 'ctrlKey'].some(modifier => keyEvent[modifier])) return false;
	if (['Escape', 'Enter', 'Space'].includes(keyEvent.key)) {
		if (keyEvent.key !== 'Escape') {
			deck.currentIndex = deck.highlightedSlideIndex;
		}
		deck.restoreMode();
		return true;
	}
	const gridColumns = parseInt(deck.ownerDocument.defaultView.getComputedStyle(deck).getPropertyValue('--grid-columns'), 10);
	const newIndex = updateHighlightIndex(keyEvent.key, deck.highlightedSlideIndex, gridColumns, deck.slides.length);
	if (isNaN(newIndex)) return false;
	deck.highlightedSlideIndex = newIndex;
	keyEvent.preventDefault();
	return true;
};
