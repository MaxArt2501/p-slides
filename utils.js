export const whenAllDefined = () => Promise.all(['p-deck', 'p-slide'].map(tag => customElements.whenDefined(tag)));

export let styleRoot = 'css/';
/** @param {string} root */
export const setStyleRoot = root => (styleRoot = root);

/**
 * @this {HTMLElement}
 * @param {string[]} strings
 * @param  {...any} values
 */
export function setShadowDOM(strings, ...values) {
	const root = this.attachShadow({ mode: 'open' });
	root.innerHTML = String.raw({ raw: strings }, ...values);
	return root;
}

/**
 * @param {import("./components/slide.js").PresentationSlideElement[]} slides
 * @param {import("./components/slide.js").PresentationSlideElement} nextSlide
 */
export const selectSlide = (slides, nextSlide) => {
  let isPrevious = true;
  for (const slide of slides) {
    if (slide === nextSlide) {
      isPrevious = false;
    } else {
      slide.isActive = false;
      slide.isPrevious = isPrevious;
      slide.setFragmentVisibility(isPrevious);
    }
  }
};

/**
 * @param {Element} noteContainer
 * @param {Element[]} notes
 */
export const copyNotes = (noteContainer, notes) => {
  while (noteContainer.lastChild) {
    noteContainer.removeChild(noteContainer.lastChild);
  }
  for (const note of notes) {
    const li = noteContainer.ownerDocument.createElement('li');
    for (const child of note.childNodes) {
      li.appendChild(child.cloneNode(true));
    }
    noteContainer.appendChild(li);
	}
	checkNoteActivations(noteContainer, notes);
  };

/**
 *
 * @param {Element} noteContainer
 * @param {Element[]} notes
 */
export const checkNoteActivations = (noteContainer, notes) => {
  notes.forEach((note, index) => {
		noteContainer.children[index].hidden = !areNotesVisible(note);
  });
};

/**
 * @param {KeyboardEvent} keyEvent
 * @param {Record<string, Array<Partial<KeyboardEvent>>>} keyMap
 */
export const matchKey = (keyEvent, keyMap) => {
	for (const [command, keys] of Object.entries(keyMap)) {
    for (const keyDef of keys) {
			if (Object.entries(keyDef).every(([prop, value]) => keyEvent[prop] === value)) {
        return command;
      }
    }
  }
  return null;
};

/**
 * @param {EventTarget} target
 * @param {string} eventName
 * @param {*} detail
 */
export const fireEvent = (target, eventName, detail = {}) => {
  const event = new CustomEvent(`p-slides.${eventName}`, { bubbles: true, detail });
  target.dispatchEvent(event);
};

/**
 * @param {number} millis
 * @returns {`${number}:${number}:${number}`}
 */
export const formatClock = millis => {
  const secs = Math.floor(millis / 1000);
	return `${secs < 0 ? '-' : ''}${Math.floor(secs / 3600)
		.toString()
		.padStart(2, '0')}:${Math.floor((secs % 3600) / 60)
		.toString()
		.padStart(2, '0')}:${Math.floor(secs % 60)
		.toString()
		.padStart(2, '0')}`;
};

/** @param {Element} element */
export const getFragmentIndex = element => {
	const rawValue = element.getAttribute(element.localName === 'p-fragment' ? 'index' : 'p-fragment');
	if (rawValue === null) return null;
	const numValue = Number.parseFloat(rawValue);
	return Number.isFinite(numValue) && numValue >= 0 ? numValue : null;
};

export const isFragmentVisible = element => element.getAttribute('aria-hidden') === 'false';

export const setFragmentVisibility = (element, visible) => element.setAttribute('aria-hidden', visible ? 'false' : 'true');

/** @param {Element} notes */
export const areNotesVisible = notes => (notes.closest('p-fragment, [p-fragment]')?.getAttribute('aria-hidden') ?? 'false') === 'false';
