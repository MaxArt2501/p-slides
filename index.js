import { PresentationDeckElement } from './components/deck.js';
import { PresentationSlideElement } from './components/slide.js';
import { setStyleRoot, whenAllDefined } from './utils.js';

export { PresentationDeckElement, PresentationSlideElement, setStyleRoot };

export const registerElements = () => {
	customElements.define('p-deck', PresentationDeckElement);
	customElements.define('p-slide', PresentationSlideElement);
	return whenAllDefined();
};
