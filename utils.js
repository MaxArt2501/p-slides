export const whenAllDefined = () => Promise.all(['p-deck', 'p-slide', 'p-fragment', 'p-notes'].map(tag => customElements.whenDefined(tag)));

let styleRoot = 'css/';
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

/** @type {Record<string, Promise<CSSStyleSheet>>} */
const styleMap = {};

/**
 * @param {HTMLElement} element
 * @returns {Promise<CSSStyleSheet>}
 */
export const attachStyle = element => {
  const name = element.localName.replace(/^p-/, '');
	if (!styleMap[name]) {
		styleMap[name] = fetch(`${styleRoot}${name}.css`)
			.then(res => res.text())
			.then(text => {
				const styleSheet = new CSSStyleSheet();
				styleSheet.replaceSync(text);
				return styleSheet;
    });
	}
	styleMap[name].then(sheet => element.shadowRoot.adoptedStyleSheets.push(sheet));
	return styleMap[name];
};

export const selectSlide = (slides, nextSlide) => {
  let isPrevious = true;
  let isNext = false;
  for (const slide of slides) {
    if (isNext) {
      slide.setAttribute('next', '');
      isNext = false;
    } else {
      slide.removeAttribute('next');
    }
    if (slide === nextSlide) {
      isPrevious = false;
      isNext = true;
    } else {
      slide.isActive = false;
      slide.isPrevious = isPrevious;
      slide.setFragmentVisibility(isPrevious);
    }
  }
};

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

export const checkNoteActivations = (noteContainer, notes) => {
  notes.forEach((note, index) => {
    noteContainer.children[index].classList.toggle('not-visible', !note.isVisible);
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

/**
 * @param {Element} element
 * @returns {number | null}
 */
export const getFragmentIndex = element => {
	const rawValue = element.getAttribute(element.localName === 'p-fragment' ? 'index' : 'p-fragment');
	if (rawValue === null) return null;
	const numValue = Number.parseFloat(rawValue);
	return Number.isFinite(numValue) && numValue >= 0 ? numValue : null;
};
