import { PresentationDeckElement } from './components/deck.js';
import { PresentationFragmentElement } from './components/fragment.js';
import { PresentationNotesElement } from './components/notes.js';
import { PresentationSlideElement } from './components/slide.js';
import { setStyleRoot, whenAllDefined } from './utils.js';

export { PresentationDeckElement, PresentationFragmentElement, PresentationNotesElement, PresentationSlideElement, setStyleRoot };

export const registerElements = () => {
	customElements.define('p-deck', PresentationDeckElement);
	customElements.define('p-slide', PresentationSlideElement);
	customElements.define('p-fragment', PresentationFragmentElement);
	customElements.define('p-notes', PresentationNotesElement);
	return whenAllDefined();
};
