import { PresentationDeckElement } from './components/deck.js';
import { PresentationSlideElement } from './components/slide.js';
import { setStyleRoot, whenAllDefined } from './utils.js';

export { PresentationDeckElement, PresentationSlideElement, setStyleRoot };

/**
 * Register the library's custom elements, i.e. calls `customElements.define` on each of them, and returns a promise
 * that resolves when the registration is complete (should be immediate).
 */
export function registerElements() {
	customElements.define('p-deck', PresentationDeckElement);
	customElements.define('p-slide', PresentationSlideElement);
	return whenAllDefined();
}
