/** @internal */
export const whenAllDefined = () => Promise.all(['p-deck', 'p-slide'].map(tag => customElements.whenDefined(tag)));

/** @typedef {import('./components/slide.js').PresentationSlideElement} PresentationSlideElement */

let styleRoot = 'css/';

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

/** @param {import('./components/deck.js').PresentationDeckElement} deck @internal */
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
			setFragmentVisibility(isPrevious)(...slide.fragments);
			setCurrentFragments(slide);
		}
	}
};

/**
 * @param {Node} root
 * @returns {Array<Element | Comment>}
 * @internal
 */
export function getNotes(root) {
	if (root instanceof Element) {
		return root.matches('p-notes, [p-notes]') ? [root] : Array.from(root.childNodes).flatMap(getNotes);
	}
	if (root instanceof Comment) {
		return root.nodeValue.startsWith('-') ? [root] : [];
	}
	return [];
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
		noteContainer.children[index].hidden = !isNoteVisible(note);
	});
};

/**
 * @param {KeyboardEvent} keyEvent
 * @param {Record<T, Array<Partial<KeyboardEvent>>>} keyMap
 * @return {T | null}
 * @template {string} T
 * @internal
 */
export function matchKey(keyEvent, keyMap) {
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
const getFragmentIndex = element => {
	const rawValue = element.getAttribute(element.localName === 'p-fragment' ? 'index' : 'p-fragment');
	if (rawValue === null) return null;
	const numValue = Number.parseFloat(rawValue);
	return Number.isFinite(numValue) && numValue >= 0 ? numValue : null;
};

/** @param {Element} element @internal */
export const isFragmentVisible = element => element.getAttribute('aria-hidden') === 'false';

/**
 * @param {boolean} visible
 * @return {(...elements: Element[]) => void}
 * @internal
 */
export const setFragmentVisibility =
	visible =>
	(...elements) =>
		elements.forEach(element => element.setAttribute('aria-hidden', String(!visible)));

/** @param {PresentationSlideElement} slide @internal */
export const setCurrentFragments = slide => {
	slide.fragmentSequence.forEach((fragments, index, blocks) => {
		const areVisible = fragments.every(isFragmentVisible);
		const areCurrent = areVisible && !blocks[index + 1]?.every(isFragmentVisible);
		fragments.forEach((fragment, index) => {
			fragment.toggleAttribute('previous', areVisible && !areCurrent);
			// Only the last fragment of a block should be set as the current fragment
			fragment.ariaCurrent = areCurrent && index === fragments.length - 1 ? 'step' : 'false';
		});
	});
};

/** @param {Element | Comment} note @internal */
const isNoteVisible = note =>
	((note instanceof Element ? note : note.parentElement).closest('p-fragment, [p-fragment]')?.getAttribute('aria-hidden') ?? 'false') ===
	'false';

/**
 * @param {ArrayLike<Element>} fragments
 * @returns {Element[][]}
 * @internal
 */
export const getSequencedFragments = fragments => {
	const nullIndexes = [];
	const indexMap = new Map();
	for (const fragment of fragments) {
		const index = getFragmentIndex(fragment);
		if (index === null) nullIndexes.push(fragment);
		else if (indexMap.has(index)) indexMap.get(index).push(fragment);
		else indexMap.set(index, [fragment]);
	}
	const sorted = [];
	let indexes = Array.from(indexMap.keys()).sort((a, b) => a - b);
	let nextIndex = indexes.shift();
	let count = 0;
	while (count < fragments.length) {
		if ((nextIndex === undefined || nextIndex > sorted.length) && nullIndexes.length) {
			sorted.push([nullIndexes.shift()]);
			count++;
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
export const getHighlightIndex = (key, current, columns, slides) =>
	key in indexMoveMap ? indexMoveMap[key](current, columns, slides) : NaN;

/**
 * @param {number} pageX
 * @param {number} pageY
 * @param {PresentationSlideElement[]} slides
 * @internal
 */
export const getHoverIndex = (pageX, pageY, slides) => {
	let start = 0;
	let end = slides.length;
	while (end > start) {
		const midIndex = (start + end) >> 1;
		const midRect = slides[midIndex].getBoundingClientRect();
		if (pageX >= midRect.left && pageY >= midRect.top && pageX < midRect.right && pageY < midRect.bottom) {
			return midIndex;
		}
		if (pageY >= midRect.bottom || (pageY >= midRect.top && pageX >= midRect.right)) {
			start = midIndex + 1;
		} else {
			end = midIndex;
		}
	}
	return -1;
};
